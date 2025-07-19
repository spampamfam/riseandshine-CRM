// Debug script to test authentication flow
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

console.log('🔍 Debugging Authentication Flow...\n');

// Check environment variables
console.log('📋 Environment Check:');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? '✅ Set' : '❌ Missing');
console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '✅ Set' : '❌ Missing');

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    console.log('\n❌ Cannot proceed - missing environment variables');
    process.exit(1);
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function testAuthFlow() {
    try {
        console.log('\n🔐 Testing Authentication Flow...');
        
        // Test 1: Check if we can connect to Supabase
        console.log('\n1️⃣ Testing Supabase connection...');
        const { data: testData, error: testError } = await supabase.from('leads').select('count', { count: 'exact', head: true });
        
        if (testError) {
            console.log('❌ Supabase connection failed:', testError.message);
            return;
        }
        console.log('✅ Supabase connection successful');
        
        // Test 2: List existing users
        console.log('\n2️⃣ Checking existing users...');
        const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
        
        if (usersError) {
            console.log('⚠️ Cannot list users (might need service role key):', usersError.message);
        } else {
            console.log(`✅ Found ${users.users.length} users in the system`);
            users.users.forEach(user => {
                console.log(`   - ${user.email} (${user.id}) - Confirmed: ${user.email_confirmed_at ? 'Yes' : 'No'}`);
            });
        }
        
        // Test 3: Test registration (if no users exist)
        console.log('\n3️⃣ Testing user registration...');
        
        const testEmail = 'debug-test@example.com';
        const testPassword = 'password123';
        
        // First, try to sign up
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: testEmail,
            password: testPassword
        });
        
        if (signUpError) {
            console.log('❌ Sign up failed:', signUpError.message);
            
            if (signUpError.message.includes('already registered')) {
                console.log('ℹ️ User already exists, testing login...');
                
                // Test login with existing user
                const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                    email: testEmail,
                    password: testPassword
                });
                
                if (signInError) {
                    console.log('❌ Login failed:', signInError.message);
                } else {
                    console.log('✅ Login successful');
                    console.log('   User ID:', signInData.user.id);
                    console.log('   Email confirmed:', signInData.user.email_confirmed_at ? 'Yes' : 'No');
                    console.log('   Session token:', signInData.session ? 'Present' : 'Missing');
                }
            }
        } else {
            console.log('✅ Sign up successful');
            console.log('   User ID:', signUpData.user.id);
            console.log('   Email confirmed:', signUpData.user.email_confirmed_at ? 'Yes' : 'No');
            console.log('   Session token:', signUpData.session ? 'Present' : 'Missing');
            
            if (!signUpData.user.email_confirmed_at) {
                console.log('⚠️ Email not confirmed - this might be the issue!');
                console.log('💡 Check your email for confirmation link or check Supabase dashboard');
            }
        }
        
        // Test 4: Check database schema
        console.log('\n4️⃣ Checking database schema...');
        const { data: schemaCheck, error: schemaError } = await supabase
            .from('leads')
            .select('*')
            .limit(1);
        
        if (schemaError) {
            console.log('❌ Database schema issue:', schemaError.message);
            if (schemaError.message.includes('relation "leads" does not exist')) {
                console.log('💡 Run the database schema in Supabase SQL Editor');
            }
        } else {
            console.log('✅ Database schema is correct');
        }
        
    } catch (error) {
        console.log('❌ Error during auth flow test:', error.message);
    }
}

async function checkUserStatus(email) {
    if (!email) {
        console.log('\n📧 To check a specific user, run: node debug-auth.js <email>');
        return;
    }
    
    try {
        console.log(`\n🔍 Checking status for user: ${email}`);
        
        // Try to get user by email (this might not work with anon key)
        const { data: userData, error: userError } = await supabase.auth.admin.getUserByEmail(email);
        
        if (userError) {
            console.log('❌ Cannot get user details:', userError.message);
            console.log('💡 This might be because we need the service role key');
        } else {
            console.log('✅ User found:');
            console.log('   ID:', userData.user.id);
            console.log('   Email confirmed:', userData.user.email_confirmed_at ? 'Yes' : 'No');
            console.log('   Created at:', userData.user.created_at);
            console.log('   Last sign in:', userData.user.last_sign_in_at);
        }
        
    } catch (error) {
        console.log('❌ Error checking user status:', error.message);
    }
}

// Main execution
async function main() {
    await testAuthFlow();
    
    // Check specific user if email provided
    const email = process.argv[2];
    if (email) {
        await checkUserStatus(email);
    }
    
    console.log('\n📋 Summary:');
    console.log('1. Check if users exist in Supabase Auth');
    console.log('2. Verify email confirmation status');
    console.log('3. Test login with correct credentials');
    console.log('4. Check database schema is imported');
    console.log('5. Verify JWT_SECRET is set correctly');
    
    console.log('\n💡 Common Issues:');
    console.log('- Email not confirmed (check spam folder)');
    console.log('- Wrong password');
    console.log('- User doesn\'t exist in Supabase Auth');
    console.log('- Database schema not imported');
    console.log('- JWT_SECRET mismatch');
}

main().catch(console.error); 