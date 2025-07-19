#!/usr/bin/env node

// Script to update API URLs for production deployment
const fs = require('fs');
const path = require('path');

console.log('🔧 Updating API URLs for production...\n');

// Get the backend URL from command line argument
const backendUrl = process.argv[2];

if (!backendUrl) {
    console.log('❌ Please provide your backend URL as an argument');
    console.log('Usage: node update-api-urls.js https://your-app.railway.app');
    console.log('\nExample:');
    console.log('node update-api-urls.js https://my-crm-backend.railway.app');
    process.exit(1);
}

// Remove trailing slash if present
const cleanBackendUrl = backendUrl.replace(/\/$/, '');
const apiUrl = `${cleanBackendUrl}/api`;

console.log(`🎯 Updating API URL to: ${apiUrl}\n`);

// Files to update
const filesToUpdate = [
    'frontend/js/main.js',
    'frontend/js/dashboard.js',
    'frontend/js/admin.js',
    'frontend/pages/login.html',
    'frontend/pages/register.html'
];

let updatedFiles = 0;

filesToUpdate.forEach(filePath => {
    try {
        if (!fs.existsSync(filePath)) {
            console.log(`⚠️  File not found: ${filePath}`);
            return;
        }

        let content = fs.readFileSync(filePath, 'utf8');
        let fileUpdated = false;

        // Update patterns
        const patterns = [
            // Pattern 1: this.apiBaseUrl = 'http://localhost:3000/api';
            {
                regex: /this\.apiBaseUrl\s*=\s*['"]http:\/\/localhost:3000\/api['"];?/g,
                replacement: `this.apiBaseUrl = '${apiUrl}';`
            },
            // Pattern 2: fetch('http://localhost:3000/api/auth/login'
            {
                regex: /fetch\(['"]http:\/\/localhost:3000\/api/g,
                replacement: `fetch('${apiUrl}`
            },
            // Pattern 3: fetch('http://localhost:3000/api/auth/register'
            {
                regex: /fetch\(['"]http:\/\/localhost:3000\/api/g,
                replacement: `fetch('${apiUrl}`
            },
            // Pattern 4: fetch('http://localhost:3000/api/auth/me'
            {
                regex: /fetch\(['"]http:\/\/localhost:3000\/api/g,
                replacement: `fetch('${apiUrl}`
            },
            // Pattern 5: fetch('http://localhost:3000/api/leads'
            {
                regex: /fetch\(['"]http:\/\/localhost:3000\/api/g,
                replacement: `fetch('${apiUrl}`
            }
        ];

        patterns.forEach(pattern => {
            if (pattern.regex.test(content)) {
                content = content.replace(pattern.regex, pattern.replacement);
                fileUpdated = true;
            }
        });

        if (fileUpdated) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`✅ Updated: ${filePath}`);
            updatedFiles++;
        } else {
            console.log(`ℹ️  No changes needed: ${filePath}`);
        }

    } catch (error) {
        console.log(`❌ Error updating ${filePath}:`, error.message);
    }
});

console.log(`\n📊 Summary:`);
console.log(`- Files checked: ${filesToUpdate.length}`);
console.log(`- Files updated: ${updatedFiles}`);
console.log(`- API URL: ${apiUrl}`);

if (updatedFiles > 0) {
    console.log(`\n🚀 Next steps:`);
    console.log(`1. Commit your changes:`);
    console.log(`   git add .`);
    console.log(`   git commit -m "Update API URLs for production"`);
    console.log(`   git push`);
    console.log(`\n2. Your frontend will automatically redeploy on Netlify/Vercel`);
    console.log(`\n3. Test your deployment:`);
    console.log(`   - Backend: ${cleanBackendUrl}/health`);
    console.log(`   - Frontend: Your Netlify/Vercel URL`);
} else {
    console.log(`\n⚠️  No files were updated. Make sure you're running this from the project root directory.`);
}

console.log(`\n🎉 Done!`); 