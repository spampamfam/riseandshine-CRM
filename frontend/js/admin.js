// Admin Dashboard functionality
class AdminDashboard {
    constructor() {
        this.currentPage = 1;
        this.itemsPerPage = 20;
        this.currentFilters = {
            search: ''
        };
        this.users = [];
        this.stats = {};
        this.init();
    }

    async init() {
        await this.checkAuth();
        this.setupEventListeners();
        await this.loadStats();
        await this.loadUsers();
    }

    async checkAuth() {
        try {
            const response = await fetch('https://riseandshine-crm-production.up.railway.app/api/auth/me', {
                credentials: 'include'
            });
            
            if (!response.ok) {
                window.location.href = 'login.html';
                return;
            }
            
            const data = await response.json();
            this.currentUser = data.user;
            
            // Check if user is admin (you can implement your own admin logic)
            if (!this.currentUser.user_metadata?.role === 'admin') {
                this.showNotification('Access denied. Admin privileges required.', 'error');
                window.location.href = 'dashboard.html';
                return;
            }
            
            // Update user email display
            const userEmail = document.getElementById('userEmail');
            if (userEmail) {
                userEmail.textContent = this.currentUser.email;
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            window.location.href = 'login.html';
        }
    }

    setupEventListeners() {
        // Refresh button
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refreshData());
        }

        // User search
        const userSearchInput = document.getElementById('userSearchInput');
        if (userSearchInput) {
            userSearchInput.addEventListener('input', this.debounce(() => {
                this.currentFilters.search = userSearchInput.value;
                this.currentPage = 1;
                this.loadUsers();
            }, 300));
        }

        // Modal events
        this.setupModalEvents();
    }

    setupModalEvents() {
        const userModal = document.getElementById('userModal');
        const deleteUserModal = document.getElementById('deleteUserModal');

        // Close modal buttons
        document.getElementById('closeUserModal')?.addEventListener('click', () => this.closeUserModal());
        document.getElementById('closeDeleteUserModal')?.addEventListener('click', () => this.closeDeleteUserModal());
        document.getElementById('cancelDeleteUser')?.addEventListener('click', () => this.closeDeleteUserModal());

        // Modal backdrop clicks
        userModal?.addEventListener('click', (e) => {
            if (e.target === userModal) this.closeUserModal();
        });

        deleteUserModal?.addEventListener('click', (e) => {
            if (e.target === deleteUserModal) this.closeDeleteUserModal();
        });
    }

    async refreshData() {
        await this.loadStats();
        await this.loadUsers();
        this.showNotification('Data refreshed successfully!', 'success');
    }

    async loadStats() {
        try {
            const response = await fetch('https://riseandshine-crm-production.up.railway.app/api/admin/stats', {
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                this.stats = data.stats;
                this.updateStatsDisplay();
            }
        } catch (error) {
            console.error('Failed to load stats:', error);
            this.showNotification('Failed to load system statistics', 'error');
        }
    }

    updateStatsDisplay() {
        document.getElementById('totalUsers').textContent = this.stats.total_users || 0;
        document.getElementById('totalLeads').textContent = this.stats.total_leads || 0;
        document.getElementById('newLeads').textContent = this.stats.leads_by_status?.new || 0;
        document.getElementById('contactedLeads').textContent = this.stats.leads_by_status?.contacted || 0;
        document.getElementById('qualifiedLeads').textContent = this.stats.leads_by_status?.qualified || 0;
        document.getElementById('convertedLeads').textContent = this.stats.leads_by_status?.converted || 0;
        document.getElementById('recentUsers').textContent = this.stats.recent_activity?.users_last_30_days || 0;
        document.getElementById('recentLeads').textContent = this.stats.recent_activity?.leads_last_30_days || 0;
    }

    async loadUsers() {
        try {
            const params = new URLSearchParams({
                page: this.currentPage,
                limit: this.itemsPerPage,
                ...this.currentFilters
            });

            const response = await fetch(`http://localhost:3000/api/admin/users?${params}`, {
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                this.users = data.users;
                this.renderUsersTable();
                this.renderUserPagination(data.pagination);
            }
        } catch (error) {
            console.error('Failed to load users:', error);
            this.showNotification('Failed to load users', 'error');
        }
    }

    renderUsersTable() {
        const tbody = document.getElementById('usersTableBody');
        if (!tbody) return;

        tbody.innerHTML = '';

        if (this.users.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                        No users found.
                    </td>
                </tr>
            `;
            return;
        }

        this.users.forEach(user => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${this.escapeHtml(user.email)}</td>
                <td>${user.lead_count || 0}</td>
                <td>${this.formatDate(user.created_at)}</td>
                <td>
                    <button onclick="adminDashboard.viewUser('${user.id}')" class="btn btn-secondary" style="padding: 0.25rem 0.5rem; font-size: 0.75rem; margin-right: 0.5rem;">View</button>
                    <button onclick="adminDashboard.deleteUser('${user.id}')" class="btn btn-danger" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;">Delete</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    renderUserPagination(pagination) {
        const paginationContainer = document.getElementById('userPagination');
        if (!paginationContainer) return;

        if (pagination.totalPages <= 1) {
            paginationContainer.innerHTML = '';
            return;
        }

        let paginationHTML = '';
        
        // Previous button
        if (pagination.page > 1) {
            paginationHTML += `<button onclick="adminDashboard.goToUserPage(${pagination.page - 1})" class="btn btn-outline" style="margin-right: 0.5rem;">Previous</button>`;
        }

        // Page numbers
        for (let i = 1; i <= pagination.totalPages; i++) {
            if (i === pagination.page) {
                paginationHTML += `<button class="btn btn-primary" style="margin: 0 0.25rem;">${i}</button>`;
            } else {
                paginationHTML += `<button onclick="adminDashboard.goToUserPage(${i})" class="btn btn-outline" style="margin: 0 0.25rem;">${i}</button>`;
            }
        }

        // Next button
        if (pagination.page < pagination.totalPages) {
            paginationHTML += `<button onclick="adminDashboard.goToUserPage(${pagination.page + 1})" class="btn btn-outline" style="margin-left: 0.5rem;">Next</button>`;
        }

        paginationContainer.innerHTML = paginationHTML;
    }

    goToUserPage(page) {
        this.currentPage = page;
        this.loadUsers();
    }

    async viewUser(userId) {
        try {
            const response = await fetch(`http://localhost:3000/api/admin/users/${userId}`, {
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                this.openUserModal(data);
            } else {
                throw new Error('Failed to load user details');
            }
        } catch (error) {
            console.error('Failed to load user details:', error);
            this.showNotification('Failed to load user details', 'error');
        }
    }

    openUserModal(userData) {
        const modal = document.getElementById('userModal');
        const modalTitle = document.getElementById('userModalTitle');
        const modalContent = document.getElementById('userModalContent');

        modalTitle.textContent = `User: ${userData.user.email}`;

        // Create user details content
        modalContent.innerHTML = `
            <div style="margin-bottom: 2rem;">
                <h3>User Information</h3>
                <p><strong>Email:</strong> ${this.escapeHtml(userData.user.email)}</p>
                <p><strong>Joined:</strong> ${this.formatDate(userData.user.created_at)}</p>
                <p><strong>Total Leads:</strong> ${userData.stats.total}</p>
            </div>
            
            <div style="margin-bottom: 2rem;">
                <h3>Lead Statistics</h3>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem;">
                    <div><strong>New:</strong> ${userData.stats.new}</div>
                    <div><strong>Contacted:</strong> ${userData.stats.contacted}</div>
                    <div><strong>Qualified:</strong> ${userData.stats.qualified}</div>
                    <div><strong>Converted:</strong> ${userData.stats.converted}</div>
                </div>
            </div>
            
            <div>
                <h3>Recent Leads</h3>
                ${this.renderUserLeadsTable(userData.leads)}
            </div>
        `;

        modal.classList.remove('hidden');
    }

    renderUserLeadsTable(leads) {
        if (!leads || leads.length === 0) {
            return '<p style="color: var(--text-secondary);">No leads found.</p>';
        }

        let tableHTML = `
            <table class="table" style="font-size: 0.875rem;">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Contact</th>
                        <th>Status</th>
                        <th>Created</th>
                    </tr>
                </thead>
                <tbody>
        `;

        leads.forEach(lead => {
            tableHTML += `
                <tr>
                    <td>${this.escapeHtml(lead.name)}</td>
                    <td>${this.escapeHtml(lead.contact)}</td>
                    <td><span class="status-badge status-${lead.status}">${lead.status}</span></td>
                    <td>${this.formatDate(lead.created_at)}</td>
                </tr>
            `;
        });

        tableHTML += '</tbody></table>';
        return tableHTML;
    }

    closeUserModal() {
        const modal = document.getElementById('userModal');
        modal.classList.add('hidden');
    }

    deleteUser(userId) {
        this.userToDelete = userId;
        const modal = document.getElementById('deleteUserModal');
        modal.classList.remove('hidden');
        
        // Setup confirm delete button
        const confirmBtn = document.getElementById('confirmDeleteUser');
        confirmBtn.onclick = () => this.confirmDeleteUser();
    }

    closeDeleteUserModal() {
        const modal = document.getElementById('deleteUserModal');
        modal.classList.add('hidden');
        this.userToDelete = null;
    }

    async confirmDeleteUser() {
        if (!this.userToDelete) return;

        try {
            const response = await fetch(`http://localhost:3000/api/admin/users/${this.userToDelete}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (response.ok) {
                this.showNotification('User deleted successfully!', 'success');
                this.closeDeleteUserModal();
                await this.loadStats();
                await this.loadUsers();
            } else {
                const data = await response.json();
                throw new Error(data.error || 'Failed to delete user');
            }
        } catch (error) {
            console.error('Delete user error:', error);
            this.showNotification(error.message, 'error');
        }
    }

    // Utility methods
    showNotification(message, type = 'info') {
        if (window.crmApp) {
            window.crmApp.showNotification(message, type);
        }
    }

    formatDate(dateString) {
        if (window.crmApp) {
            return window.crmApp.formatDate(dateString);
        }
        return new Date(dateString).toLocaleDateString();
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// Initialize admin dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.adminDashboard = new AdminDashboard();
}); 