#!/usr/bin/env node

// Script to update runtime configuration for DigitalOcean App Platform deployment
const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '../public/config.js');
const backendUrl = process.env.VUE_APP_API_URL;

if (backendUrl) {
  const configContent = `// Runtime configuration for the application
window.APP_CONFIG = {
  API_URL: '${backendUrl}'
};`;

  fs.writeFileSync(configPath, configContent);
  console.log(`✅ Configuration updated with API URL: ${backendUrl}`);
} else {
  console.log('⚠️  No backend URL found in environment variables');
} 