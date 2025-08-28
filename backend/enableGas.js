// backend/enableGas.js
require('dotenv').config();
const axios = require('axios');

const API = 'https://seal-app-qp9cc.ondigitalocean.app/api/v1';
const TOKEN = process.env.RAPYD_API_TOKEN || '4780dbd295559ed7f74a92759aa3bf64b521f674152a2db7a424244f6fc9d3c1';

const userIDs = [
  '588057ef-864d-4506-adb4-45a4de9ebc97', // MrOne
  'f51d958a-2b56-4cd1-a405-87b5f8897ca6', // MrTwo
  'ff2aaa7e-d6d6-463d-8e96-a3989bb0b7ef', // MrThree
  'e87199d1-7bcb-4f53-be15-22c1a87850f3', // MrFour
  '9113b7f1-37c1-4476-a97f-a6e73873f65a'  // MrFive
];

async function enableGas() {
  for (const userId of userIDs) {
    try {
      console.log(`🚀 Attempting to enable gas for user: ${userId}...`);

      const res = await axios.post(
        `${API}/enable-gas`,
        { userId },
        {
          headers: {
            'Authorization': `Bearer ${TOKEN}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log(`✅ Gas enabled for user ${userId}`);
      console.log('Response:', res.data.message || res.data);
    } catch (err) {
      if (err.response?.status === 401) {
        console.log(`❌ Unauthorized: Invalid API token`);
        console.log('Token preview:', TOKEN.substring(0, 10) + '...');
        break;
      } else if (err.response?.data) {
        console.error(`❌ API Error for ${userId}:`, err.response.data);
      } else {
        console.error(`❌ Network error for ${userId}:`, err.message);
      }
    }
  }
}

enableGas();