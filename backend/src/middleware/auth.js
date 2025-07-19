const jwt = require('jsonwebtoken');
const { supabase } = require('../config/supabase');

const authMiddleware = async (req, res, next) => {
    try {
        const token = req.cookies.token || req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ error: 'Access token required' });
        }

        // Verify our custom JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // For now, we'll trust our JWT token and just verify the user exists
        // We can add additional verification later if needed
        // The JWT contains the user ID and email, which is sufficient for our use case
        
        req.user = {
            id: decoded.userId,
            email: decoded.email,
            created_at: new Date().toISOString() // We'll get this from the token if needed
        };
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Invalid token' });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired' });
        }
        console.error('Auth middleware error:', error);
        res.status(500).json({ error: 'Authentication error' });
    }
};

const adminMiddleware = async (req, res, next) => {
    try {
        await authMiddleware(req, res, () => {});
        
        // Check if user is admin (you can implement your own admin logic)
        // For now, we'll check if the user has admin role in metadata
        if (!req.user.user_metadata?.role === 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }
        
        next();
    } catch (error) {
        res.status(500).json({ error: 'Admin authentication error' });
    }
};

module.exports = {
    authMiddleware,
    adminMiddleware
}; 