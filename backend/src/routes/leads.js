const express = require('express');
const { supabase } = require('../config/supabase');
const { authMiddleware } = require('../middleware/auth');
const { validateLead } = require('../middleware/validation');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Check for duplicate phone numbers
router.post('/check-duplicate', async (req, res) => {
    try {
        const { phone_number } = req.body;
        
        if (!phone_number) {
            return res.status(400).json({ error: 'Phone number is required' });
        }

        // Check for duplicates across all users (for admin) or just current user
        let query = supabase
            .from('leads')
            .select('id, name, phone_number, created_at, user_id')
            .eq('phone_number', phone_number);

        // If not admin, only check current user's leads
        if (!req.user.isAdmin) {
            query = query.eq('user_id', req.user.id);
        }

        const { data: duplicates, error } = await query;

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        res.json({ 
            isDuplicate: duplicates.length > 0,
            duplicates: duplicates
        });
    } catch (error) {
        console.error('Check duplicate error:', error);
        res.status(500).json({ error: 'Failed to check for duplicates' });
    }
});

// Get leaderboard
router.get('/leaderboard', async (req, res) => {
    try {
        const { period = 'current_month' } = req.query;
        
        let dateFilter = '';
        if (period === 'current_month') {
            dateFilter = "created_at >= date_trunc('month', now())";
        } else if (period === 'last_month') {
            dateFilter = "created_at >= date_trunc('month', now() - interval '1 month') AND created_at < date_trunc('month', now())";
        }

        const { data, error } = await supabase.rpc('get_leaderboard', {
            date_filter: dateFilter
        });

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        res.json({ leaderboard: data });
    } catch (error) {
        console.error('Leaderboard error:', error);
        res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
});

// Get user's leads with pagination
router.get('/', async (req, res) => {
    try {
        const { page = 1, limit = 10, status, search } = req.query;
        const offset = (page - 1) * limit;
        
        let query = supabase
            .from('leads')
            .select('*', { count: 'exact' })
            .eq('user_id', req.user.id)
            .order('created_at', { ascending: false });

        // Apply filters
        if (status) {
            query = query.eq('status', status);
        }
        
        if (search) {
            query = query.or(`name.ilike.%${search}%,contact.ilike.%${search}%`);
        }

        // Apply pagination
        const { data: leads, error, count } = await query
            .range(offset, offset + limit - 1);

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        res.json({
            leads,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: count,
                totalPages: Math.ceil(count / limit)
            }
        });
    } catch (error) {
        console.error('Get leads error:', error);
        res.status(500).json({ error: 'Failed to fetch leads' });
    }
});

// Create new lead with duplicate checking
router.post('/', validateLead, async (req, res) => {
    try {
        const { name, phone_number, campaign_id, ap, mv, repairs_needed, bedrooms, bathrooms, condition_rating, occupancy, reason, closing, address, additional_info } = req.body;

        // Check for duplicate phone number
        const { data: duplicates } = await supabase
            .from('leads')
            .select('id, name, phone_number, created_at, user_id')
            .eq('phone_number', phone_number);

        let status = 'new';
        if (duplicates && duplicates.length > 0) {
            status = 'duplicate';
        }

        const { data, error } = await supabase
            .from('leads')
            .insert({
                user_id: req.user.id,
                name,
                phone_number,
                campaign_id,
                ap,
                mv,
                repairs_needed,
                bedrooms,
                bathrooms,
                condition_rating,
                occupancy,
                reason,
                closing,
                address,
                additional_info,
                status
            })
            .select()
            .single();

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        res.status(201).json({ 
            lead: data,
            isDuplicate: status === 'duplicate',
            duplicateCount: duplicates ? duplicates.length : 0
        });
    } catch (error) {
        console.error('Create lead error:', error);
        res.status(500).json({ error: 'Failed to create lead' });
    }
});

// Update lead
router.put('/:id', validateLead, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, phone_number, campaign_id, ap, mv, repairs_needed, bedrooms, bathrooms, condition_rating, occupancy, reason, closing, address, additional_info, status } = req.body;

        // Verify lead belongs to user (unless admin)
        let query = supabase
            .from('leads')
            .select('id, user_id')
            .eq('id', id);

        if (!req.user.isAdmin) {
            query = query.eq('user_id', req.user.id);
        }

        const { data: existingLead } = await query.single();

        if (!existingLead) {
            return res.status(404).json({ error: 'Lead not found' });
        }

        const updateData = {
            name,
            phone_number,
            campaign_id,
            ap,
            mv,
            repairs_needed,
            bedrooms,
            bathrooms,
            condition_rating,
            occupancy,
            reason,
            closing,
            address,
            additional_info,
            updated_at: new Date().toISOString()
        };

        // Only allow status update if admin
        if (req.user.isAdmin && status) {
            updateData.status = status;
        }

        const { data, error } = await supabase
            .from('leads')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        res.json({ lead: data });
    } catch (error) {
        console.error('Update lead error:', error);
        res.status(500).json({ error: 'Failed to update lead' });
    }
});

// Delete lead
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Verify lead belongs to user
        const { data: existingLead } = await supabase
            .from('leads')
            .select('id')
            .eq('id', id)
            .eq('user_id', req.user.id)
            .single();

        if (!existingLead) {
            return res.status(404).json({ error: 'Lead not found' });
        }

        const { error } = await supabase
            .from('leads')
            .delete()
            .eq('id', id)
            .eq('user_id', req.user.id);

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        res.json({ message: 'Lead deleted successfully' });
    } catch (error) {
        console.error('Delete lead error:', error);
        res.status(500).json({ error: 'Failed to delete lead' });
    }
});

// Get lead notes
router.get('/:id/notes', async (req, res) => {
    try {
        const { id } = req.params;

        // Verify lead belongs to user
        const { data: existingLead } = await supabase
            .from('leads')
            .select('id')
            .eq('id', id)
            .eq('user_id', req.user.id)
            .single();

        if (!existingLead) {
            return res.status(404).json({ error: 'Lead not found' });
        }

        const { data: notes, error } = await supabase
            .from('lead_notes')
            .select(`
                *,
                auth.users(email)
            `)
            .eq('lead_id', id)
            .order('created_at', { ascending: false });

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        res.json({ notes });
    } catch (error) {
        console.error('Get lead notes error:', error);
        res.status(500).json({ error: 'Failed to fetch lead notes' });
    }
});

// Add note to lead
router.post('/:id/notes', async (req, res) => {
    try {
        const { id } = req.params;
        const { note_text, note_type = 'general' } = req.body;

        // Verify lead belongs to user
        const { data: existingLead } = await supabase
            .from('leads')
            .select('id')
            .eq('id', id)
            .eq('user_id', req.user.id)
            .single();

        if (!existingLead) {
            return res.status(404).json({ error: 'Lead not found' });
        }

        const { data, error } = await supabase
            .from('lead_notes')
            .insert({
                lead_id: id,
                user_id: req.user.id,
                note_text,
                note_type
            })
            .select()
            .single();

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        res.status(201).json({ note: data });
    } catch (error) {
        console.error('Add note error:', error);
        res.status(500).json({ error: 'Failed to add note' });
    }
});

// Admin: Update lead status and add note
router.put('/:id/admin-update', async (req, res) => {
    try {
        const { id } = req.params;
        const { status, note_text } = req.body;

        // Check if user is admin
        const { data: adminCheck, error: adminError } = await supabase
            .rpc('is_admin', { user_uuid: req.user.id });

        if (adminError || !adminCheck) {
            return res.status(403).json({ error: 'Admin access required' });
        }

        // Verify lead exists
        const { data: existingLead } = await supabase
            .from('leads')
            .select('id, user_id')
            .eq('id', id)
            .single();

        if (!existingLead) {
            return res.status(404).json({ error: 'Lead not found' });
        }

        // Update lead status
        const { data: updatedLead, error: updateError } = await supabase
            .from('leads')
            .update({
                status,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (updateError) {
            return res.status(500).json({ error: updateError.message });
        }

        // Add admin note if provided
        let note = null;
        if (note_text) {
            const { data: noteData, error: noteError } = await supabase
                .from('lead_notes')
                .insert({
                    lead_id: id,
                    user_id: req.user.id,
                    note_text,
                    note_type: 'admin_note',
                    is_admin_note: true
                })
                .select()
                .single();

            if (!noteError) {
                note = noteData;
            }
        }

        res.json({ 
            lead: updatedLead, 
            note,
            message: 'Lead status updated successfully' 
        });
    } catch (error) {
        console.error('Admin update error:', error);
        res.status(500).json({ error: 'Failed to update lead' });
    }
});

// Get lead statistics for user
router.get('/stats', async (req, res) => {
    try {
        const { data, error } = await supabase
            .rpc('get_lead_stats', { user_uuid: req.user.id });

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        const stats = data[0] || {
            total_qualified_this_month: 0,
            leads_today: 0,
            qualified: 0,
            disqualified: 0,
            callback: 0,
            inventory: 0
        };

        res.json({ stats });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});

// Export leads to CSV
router.get('/export', async (req, res) => {
    try {
        const { data: leads, error } = await supabase
            .from('leads')
            .select('*')
            .eq('user_id', req.user.id)
            .order('created_at', { ascending: false });

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        const csvWriter = createCsvWriter({
            path: `leads_${req.user.id}_${Date.now()}.csv`,
            header: [
                { id: 'name', title: 'Name' },
                { id: 'contact', title: 'Contact' },
                { id: 'source', title: 'Source' },
                { id: 'status', title: 'Status' },
                { id: 'created_at', title: 'Created At' }
            ]
        });

        await csvWriter.writeRecords(leads);

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=leads_${Date.now()}.csv`);
        
        // For simplicity, we'll return JSON with CSV data
        // In production, you'd stream the file
        const csvData = leads.map(lead => ({
            name: lead.name,
            contact: lead.contact,
            source: lead.source,
            status: lead.status,
            created_at: new Date(lead.created_at).toLocaleDateString()
        }));

        res.json({ 
            message: 'CSV export ready',
            data: csvData,
            filename: `leads_${Date.now()}.csv`
        });
    } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({ error: 'Failed to export leads' });
    }
});

module.exports = router; 