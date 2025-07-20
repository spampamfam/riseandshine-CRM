class AdminPanel {
    constructor() {
        this.apiBaseUrl = 'https://riseandshine-crm-production.up.railway.app/api';
        this.currentUser = null;
        this.init();
    }

    async init() {
        await this.checkAuth();
        this.setupEventListeners();
        this.loadContent();
    }

    async checkAuth() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/auth/me`, {
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                this.currentUser = data.user;
                
                // Check admin status
                await this.checkAdminStatus();
                
                if (!this.currentUser.isAdmin) {
                    window.location.href = 'dashboard.html';
                }
            } else {
                window.location.href = 'login.html';
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            window.location.href = 'login.html';
        }
    }

    async checkAdminStatus() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/admin/my-status`, {
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                this.currentUser.isAdmin = data.isAdmin;
            }
        } catch (error) {
            console.error('Admin status check failed:', error);
            this.currentUser.isAdmin = false;
        }
    }

    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.admin-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                this.switchTab(tab.dataset.tab);
            });
        });

        // Campaign modal
        document.getElementById('addCampaignBtn')?.addEventListener('click', () => {
            this.openCampaignModal();
        });

        document.getElementById('closeCampaignModal')?.addEventListener('click', () => {
            this.closeCampaignModal();
        });

        document.getElementById('cancelCampaignModal')?.addEventListener('click', () => {
            this.closeCampaignModal();
        });

        // Campaign form
        document.getElementById('campaignForm')?.addEventListener('submit', (e) => {
            this.handleCampaignSubmit(e);
        });

        // Modal backdrop clicks
        document.getElementById('campaignModal')?.addEventListener('click', (e) => {
            if (e.target === document.getElementById('campaignModal')) {
                this.closeCampaignModal();
            }
        });
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.admin-tab').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update tab content
        document.querySelectorAll('.admin-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(tabName).classList.add('active');

        // Load content based on tab
        if (tabName === 'campaigns') {
            this.loadCampaigns();
        } else if (tabName === 'users') {
            this.loadUsers();
        }
    }

    loadContent() {
        this.loadCampaigns();
    }

    async loadCampaigns() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/admin/campaigns`, {
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                this.renderCampaigns(data.campaigns);
            } else {
                throw new Error('Failed to load campaigns');
            }
        } catch (error) {
            console.error('Failed to load campaigns:', error);
            this.showNotification('Failed to load campaigns', 'error');
        }
    }

    renderCampaigns(campaigns) {
        const container = document.getElementById('campaignList');
        if (!container) return;

        if (!campaigns || campaigns.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                    No campaigns found. <button onclick="adminPanel.openCampaignModal()" class="btn btn-primary" style="margin-left: 0.5rem;">Add your first campaign</button>
                </div>
            `;
            return;
        }

        container.innerHTML = campaigns.map(campaign => `
            <div class="campaign-item">
                <div class="campaign-info">
                    <div class="campaign-name">${this.escapeHtml(campaign.name)}</div>
                    <div class="campaign-description">${this.escapeHtml(campaign.description || 'No description')}</div>
                </div>
                <div class="campaign-actions">
                    <button onclick="adminPanel.editCampaign('${campaign.id}')" class="btn btn-secondary" style="margin-right: 0.5rem;">Edit</button>
                    <button onclick="adminPanel.deleteCampaign('${campaign.id}')" class="btn btn-danger">Delete</button>
                </div>
            </div>
        `).join('');
    }

    async loadUsers() {
        try {
            console.log('Loading users...');
            const response = await fetch(`${this.apiBaseUrl}/admin/users`, {
                credentials: 'include'
            });
            
            console.log('Users response status:', response.status);
            
            if (response.ok) {
                const data = await response.json();
                console.log('Users data:', data);
                this.renderUsers(data.users);
            } else {
                const errorData = await response.json().catch(() => ({}));
                console.error('Users response error:', errorData);
                throw new Error(errorData.error || 'Failed to load users');
            }
        } catch (error) {
            console.error('Failed to load users:', error);
            this.showNotification('Failed to load users: ' + error.message, 'error');
        }
    }

    renderUsers(users) {
        const tbody = document.getElementById('usersTableBody');
        if (!tbody) return;

        if (!users || users.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                        No users found.
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = users.map(user => `
            <tr>
                <td>${this.escapeHtml(user.email)}</td>
                <td>${this.escapeHtml(user.name || 'N/A')}</td>
                <td>
                    <span class="status-badge ${user.is_admin ? 'status-qualified' : 'status-new'}">
                        ${user.is_admin ? 'Admin' : 'User'}
                    </span>
                </td>
                <td>${user.leads_count || 0}</td>
                <td>${this.formatDate(user.created_at)}</td>
                <td>
                    <button onclick="adminPanel.toggleAdminStatus('${user.id}', ${!user.is_admin})" class="btn btn-secondary" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;">
                        ${user.is_admin ? 'Remove Admin' : 'Make Admin'}
                    </button>
                </td>
            </tr>
        `).join('');
    }

    openCampaignModal(campaignId = null) {
        const modal = document.getElementById('campaignModal');
        const modalTitle = document.getElementById('campaignModalTitle');
        const form = document.getElementById('campaignForm');
        const campaignIdInput = document.getElementById('campaignId');

        if (campaignId) {
            // Edit mode
            modalTitle.textContent = 'Edit Campaign';
            // Load campaign data
            this.loadCampaignData(campaignId);
        } else {
            // Add mode
            modalTitle.textContent = 'Add Campaign';
            form.reset();
            campaignIdInput.value = '';
        }

        modal.classList.remove('hidden');
    }

    closeCampaignModal() {
        const modal = document.getElementById('campaignModal');
        modal.classList.add('hidden');
    }

    async handleCampaignSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const campaignId = formData.get('campaignId');
        
        const campaignData = {
            name: formData.get('name'),
            description: formData.get('description') || null
        };

        try {
            const url = campaignId ? 
                `${this.apiBaseUrl}/admin/campaigns/${campaignId}` : 
                `${this.apiBaseUrl}/admin/campaigns`;
            
            const method = campaignId ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(campaignData)
            });

            if (response.ok) {
                this.showNotification(`Campaign ${campaignId ? 'updated' : 'created'} successfully!`, 'success');
                this.closeCampaignModal();
                this.loadCampaigns();
            } else {
                const data = await response.json();
                throw new Error(data.error || 'Failed to save campaign');
            }
        } catch (error) {
            console.error('Campaign save error:', error);
            this.showNotification(error.message || 'Failed to save campaign', 'error');
        }
    }

    async toggleAdminStatus(userId, makeAdmin) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/admin/users/${userId}/admin-status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ isAdmin: makeAdmin })
            });

            if (response.ok) {
                this.showNotification(`User ${makeAdmin ? 'promoted to admin' : 'removed from admin'} successfully!`, 'success');
                this.loadUsers();
            } else {
                const data = await response.json();
                throw new Error(data.error || 'Failed to update admin status');
            }
        } catch (error) {
            console.error('Admin status update error:', error);
            this.showNotification(error.message || 'Failed to update admin status', 'error');
        }
    }

    async loadCampaignData(campaignId) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/admin/campaigns/${campaignId}`, {
                credentials: 'include'
            });
            
            if (response.ok) {
                const campaign = await response.json();
                this.populateCampaignForm(campaign);
            }
        } catch (error) {
            console.error('Failed to load campaign data:', error);
        }
    }

    populateCampaignForm(campaign) {
        document.getElementById('campaignId').value = campaign.id;
        document.getElementById('campaignName').value = campaign.name;
        document.getElementById('campaignDescription').value = campaign.description || '';
    }

    editCampaign(campaignId) {
        this.openCampaignModal(campaignId);
    }

    async deleteCampaign(campaignId) {
        if (!confirm('Are you sure you want to delete this campaign?')) {
            return;
        }

        try {
            const response = await fetch(`${this.apiBaseUrl}/admin/campaigns/${campaignId}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (response.ok) {
                this.showNotification('Campaign deleted successfully!', 'success');
                this.loadCampaigns();
            } else {
                const data = await response.json();
                throw new Error(data.error || 'Failed to delete campaign');
            }
        } catch (error) {
            console.error('Campaign delete error:', error);
            this.showNotification(error.message || 'Failed to delete campaign', 'error');
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize admin panel
const adminPanel = new AdminPanel(); 