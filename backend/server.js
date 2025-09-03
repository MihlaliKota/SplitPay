const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const axios = require('axios');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_here';
const API_TOKEN = process.env.RAPYD_API_TOKEN;
const RAPYD_API = 'https://seal-app-qp9cc.ondigitalocean.app/api/v1';

if (!API_TOKEN) {
  console.error('❌ RAPYD_API_TOKEN is missing in .env');
  process.exit(1);
}

let db;

(async () => {
  db = await open({
    filename: './database.db',
    driver: sqlite3.Database,
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE,
      password TEXT,
      rapyd_user_id TEXT UNIQUE,
      payment_identifier TEXT
    )
  `);
  console.log('✅ SQLite database ready');
})();

async function rapyd(method, endpoint, data = null) {
  try {
    const res = await axios({
      method,
      url: `${RAPYD_API}${endpoint}`,
      data,
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (!res.data) return null;
    try {
      return typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
    } catch {
      return res.data;
    }
  } catch (err) {
    const msg = err.response?.data || err.message;
    throw new Error(typeof msg === 'object' ? JSON.stringify(msg) : msg);
  }
}


async function getUserIdFromToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const dbUser = await db.get('SELECT id FROM users WHERE email = ?', [decoded.email]);
    if (!dbUser) {
       throw new Error('User not found');
    }
    return dbUser.id;
  } catch (err) {
    throw new Error('Invalid or expired token');
  }
}


app.post('/signup', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  try {
    const existing = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    if (existing) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const rapydRes = await rapyd('POST', '/users', {
      email,
      firstName: email.split('@')[0],
      lastName: 'User',
    });

    const user = rapydRes.user || rapydRes;
    const rapydUserId = user.id;
    const paymentId = user.paymentIdentifier;

    if (!rapydUserId || !paymentId) {
      return res.status(500).json({ error: 'Failed to create wallet' });
    }

    await rapyd('POST', '/enable-gas', { userId: rapydUserId });

    const hashed = await bcrypt.hash(password, 10);

    await db.run(
      `INSERT INTO users (email, password, rapyd_user_id, payment_identifier) VALUES (?, ?, ?, ?)`,
      [email, hashed, rapydUserId, paymentId]
    );

    const token = jwt.sign({ email, rapydUserId }, JWT_SECRET, { expiresIn: '30d' });

    res.json({
      token,
      user: { email, paymentIdentifier: paymentId }
    });
  } catch (err) {
    console.error('Signup failed:', err.message);
    res.status(500).json({ error: 'Failed to create wallet: ' + err.message });
  }
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  try {
    const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { email, rapydUserId: user.rapyd_user_id },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      token,
      user: {
        email: user.email,
        paymentIdentifier: user.payment_identifier
      }
    });
  } catch (err) {
    console.error('Login failed:', err.message);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.get('/me', async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'No token' });

  const token = auth.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const dbUser = await db.get('SELECT * FROM users WHERE email = ?', [decoded.email]);
    if (!dbUser) return res.status(404).json({ error: 'User not found' });

    let balance = 0;
    try {
      const balanceRes = await rapyd('GET', `/${dbUser.rapyd_user_id}/balance`);
      if (balanceRes && Array.isArray(balanceRes.tokens)) {
        const zar = balanceRes.tokens.find(t => t.name === 'ZAR') || { balance: '0' };
        balance = parseFloat(zar.balance);
      }
    } catch (err) {
      console.warn('Balance fetch failed:', err.message);
    }

    res.json({
      user: { email: dbUser.email, paymentIdentifier: dbUser.payment_identifier },
      balance
    });
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
});

app.put('/me/password', async (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  const token = authHeader.split(' ')[1];

  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return res.status(400).json({ error: 'Old password and new password are required' });
  }

  if (newPassword.length < 8) { 
     return res.status(400).json({ error: 'New password must be at least 8 characters long' });
  }

  try {
    const userId = await getUserIdFromToken(token);

    const user = await db.get('SELECT password FROM users WHERE id = ?', [userId]);
    if (!user) {
       return res.status(404).json({ error: 'User not found (DB inconsistency)' });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    await db.run('UPDATE users SET password = ? WHERE id = ?', [hashedNewPassword, userId]);

    res.json({ message: 'Password updated successfully' });

  } catch (err) {
    if (err.message === 'Invalid or expired token' || err.message === 'User not found') {
       return res.status(401).json({ error: err.message });
    }
    console.error('Password update failed:', err.message);
    res.status(500).json({ error: 'Failed to update password' });
  }
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Backend running on http://localhost:${PORT}`);
});
