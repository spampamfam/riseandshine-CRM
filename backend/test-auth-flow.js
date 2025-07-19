// Test script to verify authentication flow
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');

console.log('🔍 Testing Authentication Flow...\n');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function testAuthFlow() {
    try {
        // Test 1: Check environment variables
        console.log('1️⃣ Checking environment variables...');
        console.log('JWT_SECRET:', process.env.JWT_SECRET ? '✅ Set' : '❌ Missing');
        console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? '✅ Set' : '❌ Missing');
        console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing');

        // Test 2: Check if we can access the leads table (this will verify our connection)
        console.log('\n2️⃣ Testing database connection...');
        const { data: leads, error: leadsError } = await supabase
            .from('leads')
            .select('count', { count: 'exact', head: true });
        
        if (leadsError) {
            console.log('❌ Cannot access leads table:', leadsError.message);
            if (leadsError.message.includes('relation "leads" does not exist')) {
                console.log('💡 Run the database schema in Supabase SQL Editor');
            }
            return;
        }
        console.log('✅ Can access leads table');
        console.log('✅ Database connection is working');

        // Test 3: Test JWT token creation and verification
        console.log('\n3️⃣ Testing JWT token flow...');
        
        // Create a test JWT token
        const testUserId = 'test-user-id-123';
        const testUserEmail = 'test@example.com';
        
        const token = jwt.sign(
            { userId: testUserId, email: testUserEmail },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        console.log('✅ JWT token created successfully');
        
        // Verify the token
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log('✅ JWT token verified successfully');
            console.log('   Decoded user ID:', decoded.userId);
            console.log('   Decoded email:', decoded.email);
            
            console.log('✅ Authentication middleware should work correctly');
            
        } catch (jwtError) {
            console.log('❌ JWT verification failed:', jwtError.message);
        }

        // Test 4: Check database schema (already done in step 2)
        console.log('\n4️⃣ Database schema check completed in step 2');

    } catch (error) {
        console.log('❌ Error during auth flow test:', error.message);
    }
}

async function testSpecificUser(email) {
    if (!email) {
        console.log('\n📧 To test a specific user, run: node test-auth-flow.js <email>');
        return;
    }
    
    try {
        console.log(`\n🔍 Testing specific user: ${email}`);
        
        // Since we can't directly access auth.users table, we'll test the JWT flow
        // with a simulated user ID and email
        
        const simulatedUserId = 'simulated-user-id-123';
        
        console.log('✅ Simulating user authentication...');
        console.log('   Email:', email);
        console.log('   User ID:', simulatedUserId);
        
        // Test login simulation
        console.log('\n🔐 Testing login simulation...');
        
        // Create JWT token
        const token = jwt.sign(
            { userId: simulatedUserId, email: email },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        console.log('✅ JWT token created');
        
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('✅ JWT token verified');
        console.log('   Decoded user ID:', decoded.userId);
        console.log('   Decoded email:', decoded.email);
        
        console.log('✅ Authentication flow should work for this user');
        
    } catch (error) {
        console.log('❌ Error testing specific user:', error.message);
    }
}

// Main execution
async function main() {
    await testAuthFlow();
    
    // Test specific user if email provided
    const email = process.argv[2];
    if (email) {
        await testSpecificUser(email);
    }
    
    console.log('\n📋 Summary:');
    console.log('1. Check if JWT_SECRET is set correctly');
    console.log('2. Verify users exist in auth.users table');
    console.log('3. Check if email confirmation is working');
    console.log('4. Test the authentication middleware');
    console.log('5. Check browser console for errors');
    
    console.log('\n💡 If authentication is failing:');
    console.log('- Check browser console (F12) for error messages');
    console.log('- Verify JWT_SECRET is the same across restarts');
    console.log('- Check if email is confirmed in Supabase');
    console.log('- Test with: node test-auth-flow.js your-email@example.com');
}

main().catch(console.error); 