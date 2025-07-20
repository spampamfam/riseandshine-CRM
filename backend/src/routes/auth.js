const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { supabase } = require('../config/supabase');
const { authMiddleware } = require('../middleware/auth');
const { validateRegistration, validateLogin } = require('../middleware/validation');

const router = express.Router();

// Register new user
router.post('/register', validateRegistration, async (req, res) => {
    try {
        const { name, nationalId, email, phoneNumber, password } = req.body;

        // Check if user already exists
        const { data: existingUser } = await supabase
            .from('auth.users')
            .select('id')
            .eq('email', email)
            .single();

        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Create user in Supabase Auth
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: `${process.env.CORS_ORIGIN}/login`
            }
        });

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        // Store additional user data in a custom table
        const { error: profileError } = await supabase
            .from('user_profiles')
            .insert({
                user_id: data.user.id,
                name,
                national_id: nationalId,
                phone_number: phoneNumber,
                email
            });

        if (profileError) {
            console.error('Profile creation error:', profileError);
            // Don't fail registration if profile creation fails
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: data.user.id, email: data.user.email },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        // Set JWT cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.status(201).json({
            message: 'User registered successfully',
            user: {
                id: data.user.id,
                email: data.user.email,
                name,
                nationalId,
                phoneNumber
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// Login user
router.post('/login', validateLogin, async (req, res) => {
    try {
        const { email, password, rememberMe } = req.body;
        
        console.log('🔐 Login attempt for:', email);
        console.log('🔐 Environment:', process.env.NODE_ENV);

        // Authenticate with Supabase
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            console.log('🔐 Supabase auth error:', error);
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        console.log('🔐 Supabase auth successful for user:', data.user.id);

        // Generate JWT token
        const token = jwt.sign(
            { userId: data.user.id, email: data.user.email },
            process.env.JWT_SECRET,
            { expiresIn: rememberMe ? '30d' : (process.env.JWT_EXPIRES_IN || '7d') }
        );

        console.log('🔐 JWT token generated');

        // Set JWT cookie
        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: rememberMe ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000
        };
        
        console.log('🔐 Setting cookie with options:', cookieOptions);
        res.cookie('token', token, cookieOptions);

        console.log('🔐 Login successful, sending response');
        res.json({
            message: 'Login successful',
            user: {
                id: data.user.id,
                email: data.user.email
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Logout user
router.post('/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ message: 'Logout successful' });
});

// Get current user
router.get('/me', async (req, res) => {
    try {
        console.log('🔍 /me endpoint called');
        console.log('🔍 Cookies:', req.cookies);
        console.log('🔍 Headers:', req.headers.authorization);
        
        const token = req.cookies.token || req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            console.log('🔍 No token provided');
            return res.status(401).json({ error: 'No token provided' });
        }

        console.log('🔍 Token found, length:', token.length);

        // Verify our custom JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('🔍 Token decoded:', { userId: decoded.userId, email: decoded.email });
        
        // Get user data from Supabase
        const { data: user, error } = await supabase
            .from('auth.users')
            .select('id, email, created_at')
            .eq('id', decoded.userId)
            .single();

        if (error || !user) {
            console.log('🔍 User not found in Supabase:', error);
            return res.status(401).json({ error: 'User not found' });
        }

        console.log('🔍 User found:', user);
        res.json({
            user: {
                id: user.id,
                email: user.email,
                created_at: user.created_at
            }
        });
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            console.log('🔍 JWT verification failed:', error.message);
            return res.status(401).json({ error: 'Invalid token' });
        }
        if (error.name === 'TokenExpiredError') {
            console.log('🔍 Token expired');
            return res.status(401).json({ error: 'Token expired' });
        }
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Failed to get user data' });
    }
});

// Test endpoint to check cookies
router.get('/test-cookie', (req, res) => {
    console.log('🍪 Test cookie endpoint called');
    console.log('🍪 All cookies:', req.cookies);
    console.log('🍪 Token cookie:', req.cookies.token);
    
    res.cookie('test', 'test-value', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 60 * 1000 // 1 minute
    });
    
    res.json({ 
        message: 'Test cookie set',
        cookies: req.cookies,
        environment: process.env.NODE_ENV
    });
});

module.exports = router; 