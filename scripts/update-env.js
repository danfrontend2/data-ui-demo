const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load .env file
const envConfig = dotenv.config().parsed || {};

// Combine with process.env (for Netlify environment variables)
const envVars = {
  REACT_APP_OPENAI_API_KEY: process.env.REACT_APP_OPENAI_API_KEY || envConfig.REACT_APP_OPENAI_API_KEY || '',
  REACT_APP_OPENAI_ORG_ID: process.env.REACT_APP_OPENAI_ORG_ID || envConfig.REACT_APP_OPENAI_ORG_ID || '',
  REACT_APP_OPENAI_MODEL: process.env.REACT_APP_OPENAI_MODEL || envConfig.REACT_APP_OPENAI_MODEL || '',
  REACT_APP_OPENAI_MODEL_S: process.env.REACT_APP_OPENAI_MODEL_S || envConfig.REACT_APP_OPENAI_MODEL_S || ''
};

// Create env.js content
const envJsContent = `window._env_ = ${JSON.stringify(envVars, null, 2)};`;

// Write to public/env.js
fs.writeFileSync(
  path.resolve(__dirname, '../public/env.js'),
  envJsContent
);

console.log('env.js has been updated with current environment values'); 