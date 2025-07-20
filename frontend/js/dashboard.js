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
            // Add timeout to prevent hanging
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

            const response = await fetch('https://riseandshine-crm-production.up.railway.app/api/auth/me', {
                credentials: 'include',
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
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
            if (error.name === 'AbortError') {
                console.log('Auth check timed out, redirecting to login');
            }
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

        // Tab switching
        const tabButtons = document.querySelectorAll('.tab-button');
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tabName = button.dataset.tab;
                this.switchTab(tabName);
            });
        });

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

        // Leaderboard period filter
        const leaderboardPeriod = document.getElementById('leaderboardPeriod');
        if (leaderboardPeriod) {
            leaderboardPeriod.addEventListener('change', () => {
                this.loadLeaderboard();
            });
        }

        // Modal events
        this.setupModalEvents();
    }

    setupModalEvents() {
        const leadModal = document.getElementById('leadModal');
        const deleteModal = document.getElementById('deleteModal');
        const profileModal = document.getElementById('profileModal');
        const leadForm = document.getElementById('leadForm');

        // Close modal buttons
        document.getElementById('closeModal')?.addEventListener('click', () => this.closeLeadModal());
        document.getElementById('closeDeleteModal')?.addEventListener('click', () => this.closeDeleteModal());
        document.getElementById('closeProfileModal')?.addEventListener('click', () => this.closeProfileModal());
        document.getElementById('cancelModal')?.addEventListener('click', () => this.closeLeadModal());
        document.getElementById('cancelDelete')?.addEventListener('click', () => this.closeDeleteModal());

        // Form submission
        if (leadForm) {
            leadForm.addEventListener('submit', (e) => this.handleLeadSubmit(e));
        }

        // Modal backdrop clicks - prevent closing when clicking inside modal
        leadModal?.addEventListener('click', (e) => {
            if (e.target === leadModal) {
                // Don't close modal, just prevent form clearing
                e.preventDefault();
                e.stopPropagation();
            }
        });

        deleteModal?.addEventListener('click', (e) => {
            if (e.target === deleteModal) this.closeDeleteModal();
        });

        profileModal?.addEventListener('click', (e) => {
            if (e.target === profileModal) this.closeProfileModal();
        });
    }

    async loadStats() {
        try {
            const localToken = localStorage.getItem('authToken');
            const headers = {};
            if (localToken) {
                headers['Authorization'] = `Bearer ${localToken}`;
            }

            const response = await fetch('https://riseandshine-crm-production.up.railway.app/api/leads/stats', {
                credentials: 'include',
                headers
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
        document.getElementById('totalQualifiedThisMonth').textContent = this.stats.total_qualified_this_month || 0;
        document.getElementById('qualifiedLeads').textContent = this.stats.qualified || 0;
        document.getElementById('disqualifiedLeads').textContent = this.stats.disqualified || 0;
        document.getElementById('callbackLeads').textContent = this.stats.callback || 0;
        document.getElementById('inventoryLeads').textContent = this.stats.inventory || 0;
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}Tab`).classList.add('active');

        // Load content based on tab
        if (tabName === 'leads') {
            this.loadLeads();
        } else if (tabName === 'leaderboard') {
            this.loadLeaderboard();
        }
    }

    async loadLeads() {
        try {
            const params = new URLSearchParams({
                page: this.currentPage,
                limit: this.itemsPerPage,
                ...this.currentFilters
            });

            const localToken = localStorage.getItem('authToken');
            const headers = {};
            if (localToken) {
                headers['Authorization'] = `Bearer ${localToken}`;
            }

            const response = await fetch(`https://riseandshine-crm-production.up.railway.app/api/leads?${params}`, {
                credentials: 'include',
                headers
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

    async loadLeaderboard() {
        try {
            const period = document.getElementById('leaderboardPeriod')?.value || 'current_month';
            const params = new URLSearchParams({ period });

            const response = await fetch(`https://riseandshine-crm-production.up.railway.app/api/leads/leaderboard?${params}`, {
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                this.renderLeaderboardTable(data.leaderboard);
            }
        } catch (error) {
            console.error('Failed to load leaderboard:', error);
            this.showNotification('Failed to load leaderboard', 'error');
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
                <td>${this.escapeHtml(lead.phone_number || lead.contact || '-')}</td>
                <td>${this.escapeHtml(lead.campaign_name || lead.source || '-')}</td>
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

    renderLeaderboardTable(leaderboard) {
        const tbody = document.getElementById('leaderboardTableBody');
        if (!tbody) return;

        tbody.innerHTML = '';

        if (!leaderboard || leaderboard.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                        No leaderboard data available.
                    </td>
                </tr>
            `;
            return;
        }

        leaderboard.forEach((user, index) => {
            const row = document.createElement('tr');
            const rank = index + 1;
            const rankClass = rank <= 3 ? `rank-${rank}` : '';
            
            row.innerHTML = `
                <td class="${rankClass}">
                    ${rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank}
                </td>
                <td>${this.escapeHtml(user.email)}</td>
                <td>${user.qualified_leads || 0}</td>
                <td>${user.disqualified_leads || 0}</td>
                <td>${user.duplicate_leads || 0}</td>
                <td>${user.callback_leads || 0}</td>
                <td>${user.total_leads || 0}</td>
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

    async openLeadModal(leadId = null) {
        const modal = document.getElementById('leadModal');
        const modalTitle = document.getElementById('modalTitle');
        const form = document.getElementById('leadForm');
        const leadIdInput = document.getElementById('leadId');

        // Load campaigns for dropdown
        await this.loadCampaigns();

        if (leadId) {
            // Edit mode
            const lead = this.leads.find(l => l.id === leadId);
            if (lead) {
                modalTitle.textContent = 'Edit Lead';
                this.populateLeadForm(lead);
            }
        } else {
            // Add mode
            modalTitle.textContent = 'Add New Lead';
            leadIdInput.value = '';
            form.reset();
        }

        modal.classList.remove('hidden');
    }

    async loadCampaigns() {
        try {
            const localToken = localStorage.getItem('authToken');
            const headers = {};
            if (localToken) {
                headers['Authorization'] = `Bearer ${localToken}`;
            }

            const response = await fetch('https://riseandshine-crm-production.up.railway.app/api/admin/campaigns', {
                credentials: 'include',
                headers
            });
            
            if (response.ok) {
                const data = await response.json();
                const campaignSelect = document.getElementById('leadCampaign');
                if (campaignSelect) {
                    // Keep the first option (Select Campaign)
                    campaignSelect.innerHTML = '<option value="">Select Campaign</option>';
                    
                    // Add campaign options
                    data.campaigns.forEach(campaign => {
                        const option = document.createElement('option');
                        option.value = campaign.id;
                        option.textContent = campaign.name;
                        campaignSelect.appendChild(option);
                    });
                }
            }
        } catch (error) {
            console.error('Failed to load campaigns:', error);
        }
    }

    populateLeadForm(lead) {
        const leadIdInput = document.getElementById('leadId');
        leadIdInput.value = lead.id;
        
        // Basic Information
        document.getElementById('leadName').value = lead.name || '';
        document.getElementById('leadPhone').value = lead.phone_number || '';
        document.getElementById('leadCampaign').value = lead.campaign_id || '';
        document.getElementById('leadListed').value = lead.listed || '';
        
        // Property Details
        document.getElementById('leadAP').value = lead.ap || '';
        document.getElementById('leadMV').value = lead.mv || '';
        document.getElementById('leadBedrooms').value = lead.bedrooms || '';
        document.getElementById('leadBathrooms').value = lead.bathrooms || '';
        document.getElementById('leadCondition').value = lead.condition_rating || '';
        document.getElementById('leadOccupancy').value = lead.occupancy || '';
        document.getElementById('leadRepairs').value = lead.repairs_needed || '';
        
        // Deal Information
        document.getElementById('leadReason').value = lead.reason || '';
        document.getElementById('leadClosing').value = lead.closing || '';
        
        // Location
        document.getElementById('leadAddress').value = lead.address || '';
        
        // Additional Information
        document.getElementById('leadAdditionalInfo').value = lead.additional_info || '';
        
        // Status
        document.getElementById('leadStatus').value = lead.status || 'new';
    }

    closeLeadModal() {
        const modal = document.getElementById('leadModal');
        modal.classList.add('hidden');
    }

    async handleLeadSubmit(e) {
        e.preventDefault();
        
        // Clear previous validation errors
        this.clearValidationErrors();
        
        const formData = new FormData(e.target);
        const leadId = formData.get('leadId');
        
        // Validate required fields
        const requiredFields = [
            'name', 'phoneNumber', 'campaign', 'listed', 'ap', 'mv', 'bedrooms', 
            'bathrooms', 'condition', 'occupancy', 'repairsNeeded', 
            'reason', 'closing', 'address', 'additionalInfo'
        ];
        
        let hasErrors = false;
        requiredFields.forEach(field => {
            const value = formData.get(field);
            if (!value || value.trim() === '') {
                this.highlightError(field);
                hasErrors = true;
            }
        });
        
        if (hasErrors) {
            this.showNotification('Please fill in all required fields', 'error');
            return;
        }
        
        const leadData = {
            name: formData.get('name'),
            phone_number: formData.get('phoneNumber'),
            campaign_id: formData.get('campaign'),
            listed: formData.get('listed'),
            ap: parseFloat(formData.get('ap')),
            mv: parseFloat(formData.get('mv')),
            repairs_needed: formData.get('repairsNeeded'),
            bedrooms: parseInt(formData.get('bedrooms')),
            bathrooms: parseFloat(formData.get('bathrooms')),
            condition_rating: parseInt(formData.get('condition')),
            occupancy: formData.get('occupancy'),
            reason: formData.get('reason'),
            closing: formData.get('closing'),
            address: formData.get('address'),
            additional_info: formData.get('additionalInfo')
        };

        try {
            const url = leadId 
                ? `https://riseandshine-crm-production.up.railway.app/api/leads/${leadId}`
                : 'https://riseandshine-crm-production.up.railway.app/api/leads';
            
            const method = leadId ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(leadData)
            });

            const data = await response.json();

            if (response.ok) {
                let message = leadId ? 'Lead updated successfully!' : 'Lead created successfully!';
                
                // Show duplicate notification if applicable
                if (!leadId && data.isDuplicate) {
                    message = `Lead created but marked as duplicate (${data.duplicateCount} existing leads with same phone number)`;
                    this.showNotification(message, 'warning');
                } else {
                    this.showNotification(message, 'success');
                }
                
                this.closeLeadModal();
                await this.loadStats();
                await this.loadLeads();
            } else {
                throw new Error(data.error || 'Failed to save lead');
            }
        } catch (error) {
            console.error('Lead save error:', error);
            this.showNotification(error.message, 'error');
        }
    }

    async checkForDuplicates(phoneNumber) {
        try {
            const response = await fetch('https://riseandshine-crm-production.up.railway.app/api/leads/check-duplicate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ phone_number: phoneNumber })
            });

            if (response.ok) {
                return await response.json();
            }
            return { isDuplicate: false, duplicates: [] };
        } catch (error) {
            console.error('Duplicate check error:', error);
            return { isDuplicate: false, duplicates: [] };
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

    showProfileModal() {
        const modal = document.getElementById('profileModal');
        const content = document.getElementById('profileContent');
        
        if (this.currentUser) {
            content.innerHTML = `
                <div style="margin-bottom: 1.5rem;">
                    <h3 style="margin-bottom: 1rem; color: var(--primary-color);">User Information</h3>
                    <div style="background: var(--bg-secondary); padding: 1rem; border-radius: 8px; border: 1px solid var(--border-color);">
                        <p style="margin: 0.5rem 0; color: var(--text-primary);"><strong style="color: var(--primary-color);">Email:</strong> ${this.currentUser.email}</p>
                        <p style="margin: 0.5rem 0; color: var(--text-primary);"><strong style="color: var(--primary-color);">User ID:</strong> ${this.currentUser.id}</p>
                        <p style="margin: 0.5rem 0; color: var(--text-primary);"><strong style="color: var(--primary-color);">Admin Status:</strong> <span style="color: ${this.currentUser.isAdmin ? 'var(--accent-success)' : 'var(--text-secondary)'}">${this.currentUser.isAdmin ? 'Yes' : 'No'}</span></p>
                        <p style="margin: 0.5rem 0; color: var(--text-primary);"><strong style="color: var(--primary-color);">Created:</strong> ${this.formatDate(this.currentUser.created_at)}</p>
                    </div>
                </div>
                ${this.currentUser.isAdmin ? `
                <div class="form-actions" style="display: flex; gap: 1rem;">
                    <button onclick="dashboard.editProfile()" class="btn btn-primary">Edit Profile</button>
                </div>
                ` : ''}
            `;
        }
        
        modal.classList.remove('hidden');
    }

    closeProfileModal() {
        const modal = document.getElementById('profileModal');
        modal.classList.add('hidden');
    }

    editProfile() {
        // For now, just show a message. Can be expanded later
        this.showNotification('Profile editing feature coming soon!', 'info');
    }

    highlightError(fieldName) {
        const fieldMap = {
            'name': 'leadName',
            'phoneNumber': 'leadPhone',
            'campaign': 'leadCampaign',
            'listed': 'leadListed',
            'ap': 'leadAP',
            'mv': 'leadMV',
            'bedrooms': 'leadBedrooms',
            'bathrooms': 'leadBathrooms',
            'condition': 'leadCondition',
            'occupancy': 'leadOccupancy',
            'repairsNeeded': 'leadRepairs',
            'reason': 'leadReason',
            'closing': 'leadClosing',
            'address': 'leadAddress',
            'additionalInfo': 'leadAdditionalInfo'
        };
        
        const elementId = fieldMap[fieldName];
        if (elementId) {
            const element = document.getElementById(elementId);
            if (element) {
                element.style.borderColor = 'var(--accent-danger)';
                element.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.1)';
            }
        }
    }

    clearValidationErrors() {
        const formElements = document.querySelectorAll('#leadForm .form-input, #leadForm select, #leadForm textarea');
        formElements.forEach(element => {
            element.style.borderColor = '';
            element.style.boxShadow = '';
        });
    }

    async confirmDelete() {
        if (!this.leadToDelete) return;

        try {
            const response = await fetch(`https://riseandshine-crm-production.up.railway.app/api/leads/${this.leadToDelete}`, {
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
            const response = await fetch('https://riseandshine-crm-production.up.railway.app/api/leads/export', {
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