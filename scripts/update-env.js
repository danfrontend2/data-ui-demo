const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load .env file
const envConfig = dotenv.config().parsed;

// Create env.js content
const envJsContent = `window._env_ = ${JSON.stringify(envConfig, null, 2)};`;

// Write to public/env.js
fs.writeFileSync(
  path.resolve(__dirname, '../public/env.js'),
  envJsContent
);

console.log('env.js has been updated with current .env values'); 