const fs = require('fs');
const path = require('path');

// Copy env.js.template to env.js if env.js doesn't exist
const envJsPath = path.resolve(__dirname, '../public/env.js');
const envJsTemplatePath = path.resolve(__dirname, '../public/env.js.template');

if (!fs.existsSync(envJsPath) && fs.existsSync(envJsTemplatePath)) {
  console.log('Creating env.js from template...');
  fs.copyFileSync(envJsTemplatePath, envJsPath);
  console.log('env.js created successfully');
}

console.log('Environment prepared for Netlify deployment'); 