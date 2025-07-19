// Test script to check backend connection and environment variables
require('dotenv').config();

console.log('🔍 Testing CRM Backend Configuration...\n');

// Check environment variables
console.log('📋 Environment Variables Check:');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? '✅ Set' : '❌ Missing');
console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '✅ Set' : '❌ Missing');
console.log('PORT:', process.env.PORT || '3000 (default)');
console.log('NODE_ENV:', process.env.NODE_ENV || 'development (default)');
console.log('CORS_ORIGIN:', process.env.CORS_ORIGIN || 'http://localhost:8080 (default)');

// Test Supabase connection
async function testSupabaseConnection() {
    try {
        const { createClient } = require('@supabase/supabase-js');
        
        if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
            console.log('\n❌ Cannot test Supabase connection - missing environment variables');
            return;
        }

        console.log('\n🔗 Testing Supabase Connection...');
        
        const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
        
        // Test basic connection
        const { data, error } = await supabase.from('leads').select('count', { count: 'exact', head: true });
        
        if (error) {
            console.log('❌ Supabase connection failed:', error.message);
            
            if (error.message.includes('Invalid API key')) {
                console.log('💡 Tip: Check your SUPABASE_ANON_KEY in .env file');
            } else if (error.message.includes('relation "leads" does not exist')) {
                console.log('💡 Tip: Run the database schema in Supabase SQL Editor');
            }
        } else {
            console.log('✅ Supabase connection successful');
            console.log('✅ Database schema appears to be set up correctly');
        }
        
    } catch (error) {
        console.log('❌ Error testing Supabase connection:', error.message);
    }
}

// Test server startup
async function testServerStartup() {
    try {
        console.log('\n🚀 Testing Server Startup...');
        
        const app = require('./src/server');
        
        // Test if server can start (without actually starting it)
        console.log('✅ Server configuration is valid');
        
    } catch (error) {
        console.log('❌ Server startup test failed:', error.message);
    }
}

// Run tests
async function runTests() {
    await testSupabaseConnection();
    await testServerStartup();
    
    console.log('\n📋 Summary:');
    console.log('1. Check all environment variables are set');
    console.log('2. Verify Supabase connection works');
    console.log('3. Ensure database schema is imported');
    console.log('4. Start server with: npm run dev');
    console.log('5. Test health endpoint: http://localhost:3000/health');
}

runTests().catch(console.error); 