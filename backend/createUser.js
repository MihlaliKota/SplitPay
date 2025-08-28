// backend/createUser.js
require('dotenv').config();
const axios = require('axios');

const RAPYD_API_URL = process.env.RAPYD_API_URL || 'https://seal-app-qp9cc.ondigitalocean.app/api/v1';
const API_TOKEN = process.env.RAPYD_API_TOKEN;

if (!API_TOKEN) {
  console.error('❌ RAPYD_API_TOKEN is missing in .env');
  process.exit(1);
}

async function createUser() {
  const email = `user+${Date.now()}@example.com`;

  console.log('🚀 Creating user in Rapyd...');
  console.log('📧 Using email:', email);
  console.log('📍 API URL:', `${RAPYD_API_URL}/users`);
  console.log('🔐 Token preview:', API_TOKEN.substring(0, 10) + '...');

  try {
    const response = await axios.post(
      `${RAPYD_API_URL}/users`,
      {
        email,
        firstName: 'Test',
        lastName: 'User',
      },
      {
        headers: {
          'Authorization': `Bearer ${API_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    // ✅ Extract user from { user: { ... } }
    const userData = response.data.user;

    if (!userData) {
      console.error('❌ No user object in response');
      return;
    }

    console.log('\n✅ User created successfully!');
    console.log('🔑 User ID (Rapyd):       ', userData.id);
    console.log('📱 Payment Identifier:    ', userData.paymentIdentifier);
    console.log('🔐 Public Key:            ', userData.publicKey);
    console.log('📧 Email:                 ', userData.email);

    console.log('\n📋 Copy-paste into server.js:');
    console.log(`
let currentUser = {
  localId: 'user_123',
  email: '${userData.email}',
  rapyd_user_id: '${userData.id}',
  paymentIdentifier: '${userData.paymentIdentifier}',
  publicKey: '${userData.publicKey}'
};
    `);

  } catch (err) {
    console.log('\n❌ Request failed!');

    if (err.response) {
      console.log('🚨 Status:', err.response.status);
      console.log('💡 Status Text:', err.response.statusText);
      console.log('📄 Response Data:', JSON.stringify(err.response.data, null, 2));
    } else {
      console.log('🚨 Error:', err.message);
    }

    if (err.response?.status === 401) {
      console.log('\n🔐 Authorization Error: Check your RAPYD_API_TOKEN — it may be invalid or expired.');
    }
  }
}

createUser();

console.log('✅ Running enable-gas...');

await axios.post(
  `${RAPYD_API_URL}/enable-gas`,
  { userId: userData.id },
  {
    headers: { 'Authorization': `Bearer ${API_TOKEN}` }
  }
);

console.log('⛽ Gas enabled for user!');