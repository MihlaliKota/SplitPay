// backend/mint.js
require('dotenv').config();
const axios = require('axios');

const RAPYD_API_URL = process.env.RAPYD_API_URL || 'https://seal-app-qp9cc.ondigitalocean.app/api/v1';
const API_TOKEN = process.env.RAPYD_API_TOKEN;

if (!API_TOKEN) {
  console.error('❌ RAPYD_API_TOKEN is missing in .env');
  process.exit(1);
}

async function mint() {
  const recipientPaymentId = 'fapae29Mm678UDtt3Z9T'; // Replace with your paymentIdentifier from createUser.js
  const amount = 100; // Amount to mint (LZAR)

  try {
    const response = await axios.post(
      `${RAPYD_API_URL}/mint`,
      {
        transactionAmount: amount,
        transactionRecipient: recipientPaymentId,
        transactionNotes: 'Test mint for MVP',
      },
      {
        headers: {
          'Authorization': `Bearer ${API_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('✅ Minted', amount, 'LZAR successfully!');
    console.log('Response:', response.data);
  } catch (err) {
    console.error('❌ Mint failed:', err.response?.data || err.message);
  }
}

mint();