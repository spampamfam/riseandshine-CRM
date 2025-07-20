const express = require('express');
const { supabase } = require('../config/supabase');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Check if user is admin
const checkAdminStatus = async (req, res, next) => {
    try {
        const { data, error } = await supabase
            .rpc('is_admin', { user_uuid: req.user.id });

        if (error || !data) {
            return res.status(403).json({ error: 'Admin access required' });
        }

        next();
    } catch (error) {
        console.error('Admin check error:', error);
        res.status(403).json({ error: 'Admin access required' });
    }
};

// Get all users with their lead counts
router.get('/users', authMiddleware, checkAdminStatus, async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        // Get users with pagination
        const { data: users, error: usersError, count } = await supabase
            .from('auth.users')
            .select('id, email, created_at', { count: 'exact' })
            .range(offset, offset + limit - 1)
            .order('created_at', { ascending: false });

        if (usersError) {
            return res.status(500).json({ error: usersError.message });
        }

        // Get lead counts for each user
        const usersWithLeadCounts = await Promise.all(
            users.map(async (user) => {
                const { count: leadCount } = await supabase
                    .from('leads')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', user.id);

                return {
                    ...user,
                    lead_count: leadCount || 0
                };
            })
        );

        res.json({
            users: usersWithLeadCounts,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: count,
                totalPages: Math.ceil(count / limit)
            }
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Get system statistics
router.get('/stats', authMiddleware, checkAdminStatus, async (req, res) => {
    try {
        const { data: stats, error } = await supabase
            .rpc('get_admin_stats');

        if (error) {
            return res.status(500).json({ error: 'Failed to fetch stats' });
        }

        res.json({ stats: stats[0] });
    } catch (error) {
        console.error('Get admin stats error:', error);
        res.status(500).json({ error: 'Failed to get stats' });
    }
});

// Get all leads for admin
router.get('/leads', authMiddleware, checkAdminStatus, async (req, res) => {
    try {
        const { data: leads, error } = await supabase
            .rpc('get_all_leads_for_admin');

        if (error) {
            return res.status(500).json({ error: 'Failed to fetch leads' });
        }

        res.json({ leads });
    } catch (error) {
        console.error('Get admin leads error:', error);
        res.status(500).json({ error: 'Failed to get leads' });
    }
});

// Get current user's admin status
router.get('/my-status', authMiddleware, async (req, res) => {
    try {
        const { data, error } = await supabase
            .rpc('is_admin', { user_uuid: req.user.id });

        if (error) {
            return res.status(500).json({ error: 'Failed to check admin status' });
        }

        res.json({ isAdmin: data });
    } catch (error) {
        console.error('Check admin status error:', error);
        res.status(500).json({ error: 'Failed to check admin status' });
    }
});

// Get all users with admin status
router.get('/users-with-admin-status', authMiddleware, checkAdminStatus, async (req, res) => {
    try {
        const { data: users, error: usersError } = await supabase
            .from('auth.users')
            .select('id, email, created_at');

        if (usersError) {
            return res.status(500).json({ error: 'Failed to fetch users' });
        }

        // Get admin status for each user
        const usersWithAdminStatus = await Promise.all(
            users.map(async (user) => {
                const { data: adminRole } = await supabase
                    .from('admin_roles')
                    .select('is_admin')
                    .eq('user_id', user.id)
                    .single();

                return {
                    ...user,
                    isAdmin: adminRole?.is_admin || false
                };
            })
        );

        res.json({ users: usersWithAdminStatus });
    } catch (error) {
        console.error('Get users with admin status error:', error);
        res.status(500).json({ error: 'Failed to get users' });
    }
});

// Toggle admin status for a user
router.post('/toggle-admin/:userId', authMiddleware, checkAdminStatus, async (req, res) => {
    try {
        const { userId } = req.params;
        const { isAdmin } = req.body;

        // Check if user exists
        const { data: user, error: userError } = await supabase
            .from('auth.users')
            .select('id, email')
            .eq('id', userId)
            .single();

        if (userError || !user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Prevent removing your own admin status
        if (userId === req.user.id && !isAdmin) {
            return res.status(400).json({ error: 'Cannot remove your own admin status' });
        }

        // Upsert admin role
        const { data, error } = await supabase
            .from('admin_roles')
            .upsert({
                user_id: userId,
                is_admin: isAdmin
            }, {
                onConflict: 'user_id'
            });

        if (error) {
            return res.status(500).json({ error: 'Failed to update admin status' });
        }

        res.json({
            message: `Admin status updated for ${user.email}`,
            isAdmin,
            user: {
                id: user.id,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Toggle admin error:', error);
        res.status(500).json({ error: 'Failed to toggle admin status' });
    }
});

// Bulk update admin status
router.post('/bulk-update-admin', authMiddleware, checkAdminStatus, async (req, res) => {
    try {
        const { updates } = req.body; // Array of { userId, isAdmin }

        if (!Array.isArray(updates)) {
            return res.status(400).json({ error: 'Updates must be an array' });
        }

        const results = [];

        for (const update of updates) {
            const { userId, isAdmin } = update;

            // Prevent removing your own admin status
            if (userId === req.user.id && !isAdmin) {
                results.push({
                    userId,
                    success: false,
                    error: 'Cannot remove your own admin status'
                });
                continue;
            }

            const { error } = await supabase
                .from('admin_roles')
                .upsert({
                    user_id: userId,
                    is_admin: isAdmin
                }, {
                    onConflict: 'user_id'
                });

            if (error) {
                results.push({
                    userId,
                    success: false,
                    error: error.message
                });
            } else {
                results.push({
                    userId,
                    success: true,
                    isAdmin
                });
            }
        }

        res.json({ results });
    } catch (error) {
        console.error('Bulk update admin error:', error);
        res.status(500).json({ error: 'Failed to bulk update admin status' });
    }
});

// Get user details with leads
router.get('/users/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        // Get user details
        const { data: user, error: userError } = await supabaseAdmin
            .from('auth.users')
            .select('id, email, created_at')
            .eq('id', userId)
            .single();

        if (userError || !user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Get user's leads
        const { data: leads, error: leadsError, count } = await supabaseAdmin
            .from('leads')
            .select('*', { count: 'exact' })
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (leadsError) {
            return res.status(500).json({ error: leadsError.message });
        }

        // Get lead statistics for this user
        const { data: allUserLeads } = await supabaseAdmin
            .from('leads')
            .select('status')
            .eq('user_id', userId);

        const userStats = {
            total: allUserLeads?.length || 0,
            new: allUserLeads?.filter(lead => lead.status === 'new').length || 0,
            contacted: allUserLeads?.filter(lead => lead.status === 'contacted').length || 0,
            qualified: allUserLeads?.filter(lead => lead.status === 'qualified').length || 0,
            converted: allUserLeads?.filter(lead => lead.status === 'converted').length || 0
        };

        res.json({
            user,
            leads,
            stats: userStats,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: count,
                totalPages: Math.ceil(count / limit)
            }
        });
    } catch (error) {
        console.error('Get user details error:', error);
        res.status(500).json({ error: 'Failed to fetch user details' });
    }
});

// Delete user (admin only)
router.delete('/users/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        // Verify user exists
        const { data: user } = await supabaseAdmin
            .from('auth.users')
            .select('id')
            .eq('id', userId)
            .single();

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Delete user's leads first (cascade should handle this, but explicit for safety)
        await supabaseAdmin
            .from('leads')
            .delete()
            .eq('user_id', userId);

        // Delete user from auth
        const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

// Get all leads with user information
router.get('/all-leads', authMiddleware, checkAdminStatus, async (req, res) => {
    try {
        const { data, error } = await supabase
            .rpc('get_all_leads');

        if (error) {
            return res.status(500).json({ error: 'Failed to fetch leads' });
        }

        res.json({ leads: data });
    } catch (error) {
        console.error('Get all leads error:', error);
        res.status(500).json({ error: 'Failed to get leads' });
    }
});

// Get recent leads
router.get('/recent-leads', authMiddleware, checkAdminStatus, async (req, res) => {
    try {
        const { data, error } = await supabase
            .rpc('get_all_leads')
            .limit(10);

        if (error) {
            return res.status(500).json({ error: 'Failed to fetch recent leads' });
        }

        res.json({ leads: data });
    } catch (error) {
        console.error('Get recent leads error:', error);
        res.status(500).json({ error: 'Failed to get recent leads' });
    }
});

// Get lead details
router.get('/leads/:leadId', authMiddleware, checkAdminStatus, async (req, res) => {
    try {
        const { leadId } = req.params;

        const { data, error } = await supabase
            .from('leads')
            .select(`
                *,
                campaigns(name),
                auth.users(email)
            `)
            .eq('id', leadId)
            .single();

        if (error || !data) {
            return res.status(404).json({ error: 'Lead not found' });
        }

        res.json({
            ...data,
            campaign_name: data.campaigns?.name,
            user_email: data.users?.email
        });
    } catch (error) {
        console.error('Get lead details error:', error);
        res.status(500).json({ error: 'Failed to get lead details' });
    }
});

// Campaign management routes
router.get('/campaigns', authMiddleware, checkAdminStatus, async (req, res) => {
    try {
        const { data, error } = await supabase
            .rpc('get_campaigns');

        if (error) {
            return res.status(500).json({ error: 'Failed to fetch campaigns' });
        }

        res.json({ campaigns: data });
    } catch (error) {
        console.error('Get campaigns error:', error);
        res.status(500).json({ error: 'Failed to get campaigns' });
    }
});

router.post('/campaigns', authMiddleware, checkAdminStatus, async (req, res) => {
    try {
        const { name, description } = req.body;

        const { data, error } = await supabase
            .from('campaigns')
            .insert({ name, description })
            .select()
            .single();

        if (error) {
            return res.status(500).json({ error: 'Failed to create campaign' });
        }

        res.json({ campaign: data });
    } catch (error) {
        console.error('Create campaign error:', error);
        res.status(500).json({ error: 'Failed to create campaign' });
    }
});

router.put('/campaigns/:campaignId', authMiddleware, checkAdminStatus, async (req, res) => {
    try {
        const { campaignId } = req.params;
        const { name, description } = req.body;

        const { data, error } = await supabase
            .from('campaigns')
            .update({ name, description })
            .eq('id', campaignId)
            .select()
            .single();

        if (error) {
            return res.status(500).json({ error: 'Failed to update campaign' });
        }

        res.json({ campaign: data });
    } catch (error) {
        console.error('Update campaign error:', error);
        res.status(500).json({ error: 'Failed to update campaign' });
    }
});

router.delete('/campaigns/:campaignId', authMiddleware, checkAdminStatus, async (req, res) => {
    try {
        const { campaignId } = req.params;

        const { error } = await supabase
            .from('campaigns')
            .delete()
            .eq('id', campaignId);

        if (error) {
            return res.status(500).json({ error: 'Failed to delete campaign' });
        }

        res.json({ message: 'Campaign deleted successfully' });
    } catch (error) {
        console.error('Delete campaign error:', error);
        res.status(500).json({ error: 'Failed to delete campaign' });
    }
});

// Form management routes
router.get('/form-structure', authMiddleware, checkAdminStatus, async (req, res) => {
    try {
        const { data, error } = await supabase
            .rpc('get_form_structure');

        if (error) {
            return res.status(500).json({ error: 'Failed to fetch form structure' });
        }

        res.json({ structure: data });
    } catch (error) {
        console.error('Get form structure error:', error);
        res.status(500).json({ error: 'Failed to get form structure' });
    }
});

router.post('/form-fields', authMiddleware, checkAdminStatus, async (req, res) => {
    try {
        const { fieldName, fieldType, fieldLabel, fieldPlaceholder, fieldRequired, fieldOptions } = req.body;

        const { data, error } = await supabase
            .from('form_fields')
            .insert({
                field_name: fieldName,
                field_type: fieldType,
                field_label: fieldLabel,
                field_placeholder: fieldPlaceholder,
                is_required: fieldRequired,
                field_options: fieldOptions
            })
            .select()
            .single();

        if (error) {
            return res.status(500).json({ error: 'Failed to create field' });
        }

        res.json({ field: data });
    } catch (error) {
        console.error('Create field error:', error);
        res.status(500).json({ error: 'Failed to create field' });
    }
});

router.put('/form-fields/:fieldName', authMiddleware, checkAdminStatus, async (req, res) => {
    try {
        const { fieldName } = req.params;
        const { fieldType, fieldLabel, fieldPlaceholder, fieldRequired, fieldOptions } = req.body;

        const { data, error } = await supabase
            .from('form_fields')
            .update({
                field_type: fieldType,
                field_label: fieldLabel,
                field_placeholder: fieldPlaceholder,
                is_required: fieldRequired,
                field_options: fieldOptions
            })
            .eq('field_name', fieldName)
            .select()
            .single();

        if (error) {
            return res.status(500).json({ error: 'Failed to update field' });
        }

        res.json({ field: data });
    } catch (error) {
        console.error('Update field error:', error);
        res.status(500).json({ error: 'Failed to update field' });
    }
});

router.delete('/form-fields/:fieldName', authMiddleware, checkAdminStatus, async (req, res) => {
    try {
        const { fieldName } = req.params;

        const { error } = await supabase
            .from('form_fields')
            .delete()
            .eq('field_name', fieldName);

        if (error) {
            return res.status(500).json({ error: 'Failed to delete field' });
        }

        res.json({ message: 'Field deleted successfully' });
    } catch (error) {
        console.error('Delete field error:', error);
        res.status(500).json({ error: 'Failed to delete field' });
    }
});

module.exports = router; 