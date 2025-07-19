const express = require('express');
const { supabase } = require('../config/supabase');
const { authMiddleware } = require('../middleware/auth');
const { validateLead } = require('../middleware/validation');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

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

// Create new lead
router.post('/', validateLead, async (req, res) => {
    try {
        const { name, contact, source = 'website', status = 'new' } = req.body;

        const { data, error } = await supabase
            .from('leads')
            .insert({
                user_id: req.user.id,
                name,
                contact,
                source,
                status
            })
            .select()
            .single();

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        res.status(201).json({ lead: data });
    } catch (error) {
        console.error('Create lead error:', error);
        res.status(500).json({ error: 'Failed to create lead' });
    }
});

// Update lead
router.put('/:id', validateLead, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, contact, source, status } = req.body;

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
            .from('leads')
            .update({
                name,
                contact,
                source,
                status,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .eq('user_id', req.user.id)
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

// Get lead statistics for user
router.get('/stats', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('leads')
            .select('status')
            .eq('user_id', req.user.id);

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        const stats = {
            total: data.length,
            new: data.filter(lead => lead.status === 'new').length,
            contacted: data.filter(lead => lead.status === 'contacted').length,
            qualified: data.filter(lead => lead.status === 'qualified').length,
            converted: data.filter(lead => lead.status === 'converted').length
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