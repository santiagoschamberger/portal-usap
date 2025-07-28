const path = require('path');

// Load environment variables from root directory
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

console.log('🔍 Environment Variables Debug:');
console.log('Current working directory:', process.cwd());
console.log('Script directory:', __dirname);
console.log('Expected .env path:', path.join(__dirname, '../../.env'));
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? '✅ Set' : '❌ Not set');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Not set');
console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? '✅ Set' : '❌ Not set');

// List all environment variables that start with SUPABASE
console.log('\n🔗 All SUPABASE variables:');
Object.keys(process.env)
  .filter(key => key.startsWith('SUPABASE'))
  .forEach(key => {
    console.log(`${key}: ${process.env[key] ? '✅ Set' : '❌ Not set'}`);
  }); 