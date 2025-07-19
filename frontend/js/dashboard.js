// Dashboard functionality
class Dashboard {
    constructor() {
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.currentFilters = {
            search: '',
            status: ''
        };
        this.leads = [];
        this.stats = {};
        this.init();
    }

    async init() {
        await this.checkAuth();
        this.setupEventListeners();
        await this.loadStats();
        await this.loadLeads();
    }

    async checkAuth() {
        try {
            const response = await fetch('http://localhost:3000/api/auth/me', {
                credentials: 'include'
            });
            
            if (!response.ok) {
                window.location.href = 'login.html';
                return;
            }
            
            const data = await response.json();
            this.currentUser = data.user;
            
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
        // Add lead button
        const addLeadBtn = document.getElementById('addLeadBtn');
        if (addLeadBtn) {
            addLeadBtn.addEventListener('click', () => this.openLeadModal());
        }

        // Export button
        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportLeads());
        }

        // Search and filter
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', this.debounce(() => {
                this.currentFilters.search = searchInput.value;
                this.currentPage = 1;
                this.loadLeads();
            }, 300));
        }

        const statusFilter = document.getElementById('statusFilter');
        if (statusFilter) {
            statusFilter.addEventListener('change', () => {
                this.currentFilters.status = statusFilter.value;
                this.currentPage = 1;
                this.loadLeads();
            });
        }

        // Modal events
        this.setupModalEvents();
    }

    setupModalEvents() {
        const leadModal = document.getElementById('leadModal');
        const deleteModal = document.getElementById('deleteModal');
        const leadForm = document.getElementById('leadForm');

        // Close modal buttons
        document.getElementById('closeModal')?.addEventListener('click', () => this.closeLeadModal());
        document.getElementById('closeDeleteModal')?.addEventListener('click', () => this.closeDeleteModal());
        document.getElementById('cancelModal')?.addEventListener('click', () => this.closeLeadModal());
        document.getElementById('cancelDelete')?.addEventListener('click', () => this.closeDeleteModal());

        // Form submission
        if (leadForm) {
            leadForm.addEventListener('submit', (e) => this.handleLeadSubmit(e));
        }

        // Modal backdrop clicks
        leadModal?.addEventListener('click', (e) => {
            if (e.target === leadModal) this.closeLeadModal();
        });

        deleteModal?.addEventListener('click', (e) => {
            if (e.target === deleteModal) this.closeDeleteModal();
        });
    }

    async loadStats() {
        try {
            const response = await fetch('http://localhost:3000/api/leads/stats', {
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                this.stats = data.stats;
                this.updateStatsDisplay();
            }
        } catch (error) {
            console.error('Failed to load stats:', error);
        }
    }

    updateStatsDisplay() {
        document.getElementById('totalLeads').textContent = this.stats.total || 0;
        document.getElementById('newLeads').textContent = this.stats.new || 0;
        document.getElementById('contactedLeads').textContent = this.stats.contacted || 0;
        document.getElementById('qualifiedLeads').textContent = this.stats.qualified || 0;
        document.getElementById('convertedLeads').textContent = this.stats.converted || 0;
    }

    async loadLeads() {
        try {
            const params = new URLSearchParams({
                page: this.currentPage,
                limit: this.itemsPerPage,
                ...this.currentFilters
            });

            const response = await fetch(`http://localhost:3000/api/leads?${params}`, {
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                this.leads = data.leads;
                this.renderLeadsTable();
                this.renderPagination(data.pagination);
            }
        } catch (error) {
            console.error('Failed to load leads:', error);
            this.showNotification('Failed to load leads', 'error');
        }
    }

    renderLeadsTable() {
        const tbody = document.getElementById('leadsTableBody');
        if (!tbody) return;

        tbody.innerHTML = '';

        if (this.leads.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                        No leads found. <button onclick="dashboard.openLeadModal()" class="btn btn-primary" style="margin-left: 0.5rem;">Add your first lead</button>
                    </td>
                </tr>
            `;
            return;
        }

        this.leads.forEach(lead => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${this.escapeHtml(lead.name)}</td>
                <td>${this.escapeHtml(lead.contact)}</td>
                <td>${this.escapeHtml(lead.source)}</td>
                <td><span class="status-badge status-${lead.status}">${lead.status}</span></td>
                <td>${this.formatDate(lead.created_at)}</td>
                <td>
                    <button onclick="dashboard.editLead('${lead.id}')" class="btn btn-secondary" style="padding: 0.25rem 0.5rem; font-size: 0.75rem; margin-right: 0.5rem;">Edit</button>
                    <button onclick="dashboard.deleteLead('${lead.id}')" class="btn btn-danger" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;">Delete</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    renderPagination(pagination) {
        const paginationContainer = document.getElementById('pagination');
        if (!paginationContainer) return;

        if (pagination.totalPages <= 1) {
            paginationContainer.innerHTML = '';
            return;
        }

        let paginationHTML = '';
        
        // Previous button
        if (pagination.page > 1) {
            paginationHTML += `<button onclick="dashboard.goToPage(${pagination.page - 1})" class="btn btn-outline" style="margin-right: 0.5rem;">Previous</button>`;
        }

        // Page numbers
        for (let i = 1; i <= pagination.totalPages; i++) {
            if (i === pagination.page) {
                paginationHTML += `<button class="btn btn-primary" style="margin: 0 0.25rem;">${i}</button>`;
            } else {
                paginationHTML += `<button onclick="dashboard.goToPage(${i})" class="btn btn-outline" style="margin: 0 0.25rem;">${i}</button>`;
            }
        }

        // Next button
        if (pagination.page < pagination.totalPages) {
            paginationHTML += `<button onclick="dashboard.goToPage(${pagination.page + 1})" class="btn btn-outline" style="margin-left: 0.5rem;">Next</button>`;
        }

        paginationContainer.innerHTML = paginationHTML;
    }

    goToPage(page) {
        this.currentPage = page;
        this.loadLeads();
    }

    openLeadModal(leadId = null) {
        const modal = document.getElementById('leadModal');
        const modalTitle = document.getElementById('modalTitle');
        const form = document.getElementById('leadForm');
        const leadIdInput = document.getElementById('leadId');

        if (leadId) {
            // Edit mode
            const lead = this.leads.find(l => l.id === leadId);
            if (lead) {
                modalTitle.textContent = 'Edit Lead';
                leadIdInput.value = lead.id;
                document.getElementById('leadName').value = lead.name;
                document.getElementById('leadContact').value = lead.contact;
                document.getElementById('leadSource').value = lead.source;
                document.getElementById('leadStatus').value = lead.status;
            }
        } else {
            // Add mode
            modalTitle.textContent = 'Add New Lead';
            leadIdInput.value = '';
            form.reset();
        }

        modal.classList.remove('hidden');
    }

    closeLeadModal() {
        const modal = document.getElementById('leadModal');
        modal.classList.add('hidden');
    }

    async handleLeadSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const leadId = formData.get('leadId');
        const leadData = {
            name: formData.get('name'),
            contact: formData.get('contact'),
            source: formData.get('source'),
            status: formData.get('status')
        };

        try {
            const url = leadId 
                ? `http://localhost:3000/api/leads/${leadId}`
                : 'http://localhost:3000/api/leads';
            
            const method = leadId ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(leadData)
            });

            if (response.ok) {
                this.showNotification(
                    leadId ? 'Lead updated successfully!' : 'Lead created successfully!',
                    'success'
                );
                this.closeLeadModal();
                await this.loadStats();
                await this.loadLeads();
            } else {
                const data = await response.json();
                throw new Error(data.error || 'Failed to save lead');
            }
        } catch (error) {
            console.error('Lead save error:', error);
            this.showNotification(error.message, 'error');
        }
    }

    editLead(leadId) {
        this.openLeadModal(leadId);
    }

    deleteLead(leadId) {
        this.leadToDelete = leadId;
        const modal = document.getElementById('deleteModal');
        modal.classList.remove('hidden');
        
        // Setup confirm delete button
        const confirmBtn = document.getElementById('confirmDelete');
        confirmBtn.onclick = () => this.confirmDelete();
    }

    closeDeleteModal() {
        const modal = document.getElementById('deleteModal');
        modal.classList.add('hidden');
        this.leadToDelete = null;
    }

    async confirmDelete() {
        if (!this.leadToDelete) return;

        try {
            const response = await fetch(`http://localhost:3000/api/leads/${this.leadToDelete}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (response.ok) {
                this.showNotification('Lead deleted successfully!', 'success');
                this.closeDeleteModal();
                await this.loadStats();
                await this.loadLeads();
            } else {
                const data = await response.json();
                throw new Error(data.error || 'Failed to delete lead');
            }
        } catch (error) {
            console.error('Delete error:', error);
            this.showNotification(error.message, 'error');
        }
    }

    async exportLeads() {
        try {
            const response = await fetch('http://localhost:3000/api/leads/export', {
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                
                // Create CSV content
                const csvContent = [
                    ['Name', 'Contact', 'Source', 'Status', 'Created At'],
                    ...data.data.map(lead => [
                        lead.name,
                        lead.contact,
                        lead.source,
                        lead.status,
                        lead.created_at
                    ])
                ].map(row => row.join(',')).join('\n');

                // Download file
                const blob = new Blob([csvContent], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = data.filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);

                this.showNotification('Leads exported successfully!', 'success');
            } else {
                const data = await response.json();
                throw new Error(data.error || 'Failed to export leads');
            }
        } catch (error) {
            console.error('Export error:', error);
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

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new Dashboard();
}); 