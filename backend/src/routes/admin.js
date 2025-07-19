const express = require('express');
const { supabaseAdmin } = require('../config/supabase');
const { adminMiddleware } = require('../middleware/auth');

const router = express.Router();

// Apply admin middleware to all routes
router.use(adminMiddleware);

// Get all users with their lead counts
router.get('/users', async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        // Get users with pagination
        const { data: users, error: usersError, count } = await supabaseAdmin
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
                const { count: leadCount } = await supabaseAdmin
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
router.get('/stats', async (req, res) => {
    try {
        // Get total users
        const { count: totalUsers } = await supabaseAdmin
            .from('auth.users')
            .select('*', { count: 'exact', head: true });

        // Get total leads
        const { count: totalLeads } = await supabaseAdmin
            .from('leads')
            .select('*', { count: 'exact', head: true });

        // Get leads by status
        const { data: leadsByStatus } = await supabaseAdmin
            .from('leads')
            .select('status');

        const statusCounts = {
            new: 0,
            contacted: 0,
            qualified: 0,
            converted: 0
        };

        leadsByStatus?.forEach(lead => {
            statusCounts[lead.status]++;
        });

        // Get recent activity (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { count: recentLeads } = await supabaseAdmin
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', thirtyDaysAgo.toISOString());

        const { count: recentUsers } = await supabaseAdmin
            .from('auth.users')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', thirtyDaysAgo.toISOString());

        res.json({
            stats: {
                total_users: totalUsers || 0,
                total_leads: totalLeads || 0,
                leads_by_status: statusCounts,
                recent_activity: {
                    leads_last_30_days: recentLeads || 0,
                    users_last_30_days: recentUsers || 0
                }
            }
        });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ error: 'Failed to fetch statistics' });
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

module.exports = router; 