const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../db');

function verifyTelegramWebAppData(initData, botToken) {
  const urlParams = new URLSearchParams(initData);
  const hash = urlParams.get('hash');
  urlParams.delete('hash');
  
  const dataCheckString = Array.from(urlParams.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
  
  const secretKey = crypto
    .createHmac('sha256', 'WebAppData')
    .update(botToken)
    .digest();
  
  const calculatedHash = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');
  
  return calculatedHash === hash;
}

// Generate unique referral code (8 characters like X7TFGY2O)
async function generateUniqueReferralCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let attempts = 0;
  const maxAttempts = 10;
  
  while (attempts < maxAttempts) {
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    // Check if code already exists
    const result = await db.query(
      'SELECT id FROM users WHERE referral_code = $1',
      [code]
    );
    
    if (result.rows.length === 0) {
      return code;
    }
    
    attempts++;
  }
  
  // Fallback: use timestamp + random string if all attempts fail
  return 'REF' + Date.now().toString().slice(-5);
}

router.post('/telegram-login', async (req, res) => {
  try {
    const { initData } = req.body;
    
    if (!initData) {
      return res.status(400).json({ error: 'Missing initData' });
    }

    if (process.env.NODE_ENV === 'production') {
      const isValid = verifyTelegramWebAppData(initData, process.env.TELEGRAM_BOT_TOKEN);
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid Telegram data' });
      }
    }

    const urlParams = new URLSearchParams(initData);
    const userJson = urlParams.get('user');
    if (!userJson) {
      return res.status(400).json({ error: 'No user data' });
    }

    const telegramUser = JSON.parse(userJson);
    
    let user = await db.query(
      'SELECT * FROM users WHERE telegram_id = $1',
      [telegramUser.id.toString()]
    );

    if (user.rows.length === 0) {
      // Generate unique referral code for new user
      const referralCode = await generateUniqueReferralCode();
      
      const result = await db.query(`
        INSERT INTO users (telegram_id, username, first_name, plan, credits, wallet_balance, referral_code)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [
        telegramUser.id.toString(),
        telegramUser.username || `user${telegramUser.id}`,
        telegramUser.first_name || 'Student',
        'free',
        10,
        0.00,
        referralCode // Add unique referral code
      ]);
      user = result;
    } else {
      // Ensure existing users have a referral code
      if (!user.rows[0].referral_code) {
        const referralCode = await generateUniqueReferralCode();
        await db.query(
          'UPDATE users SET referral_code = $1 WHERE telegram_id = $2',
          [referralCode, telegramUser.id.toString()]
        );
        // Refresh user data
        user = await db.query(
          'SELECT * FROM users WHERE telegram_id = $1',
          [telegramUser.id.toString()]
        );
      }
    }

    const sessionToken = crypto.randomBytes(32).toString('hex');
    await db.query(
      'UPDATE users SET last_login = NOW(), session_token = $1 WHERE telegram_id = $2',
      [sessionToken, telegramUser.id.toString()]
    );

    res.json({
      success: true,
      user: user.rows[0],
      token: sessionToken
    });

  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

async function authenticateUser(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const result = await db.query(
      'SELECT * FROM users WHERE session_token = $1',
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = result.rows[0];
    next();
  } catch (error) {
    res.status(500).json({ error: 'Auth verification failed' });
  }
}

module.exports = router;
module.exports.authenticateUser = authenticateUser;
module.exports.generateUniqueReferralCode = generateUniqueReferralCode;