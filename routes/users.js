// routes/users.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateUser } = require('./auth');

// GET /api/users/dashboard - User dashboard data
router.get('/dashboard', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user stats
    const stats = await db.query(`
      SELECT 
        (SELECT COUNT(*) FROM purchases WHERE buyer_id = $1) as purchases_count,
        (SELECT COUNT(*) FROM notes WHERE seller_id = $1) as notes_count,
        (SELECT SUM(amount_usd - fee_usd) FROM purchases WHERE note_id IN 
          (SELECT id FROM notes WHERE seller_id = $1)) as total_earnings,
        (SELECT COUNT(*) FROM ai_jobs WHERE user_id = $1) as ai_uses
    `, [userId]);

    // Get recent purchases
    const recentPurchases = await db.query(`
      SELECT p.*, n.title, n.thumbnail_url
      FROM purchases p
      JOIN notes n ON p.note_id = n.id
      WHERE p.buyer_id = $1 AND p.status = 'completed'
      ORDER BY p.created_at DESC
      LIMIT 5
    `, [userId]);

    // Get selling stats (if seller)
    const sellingStats = await db.query(`
      SELECT n.id, n.title, 
        (SELECT COUNT(*) FROM purchases WHERE note_id = n.id) as sales,
        (SELECT SUM(amount_usd - fee_usd) FROM purchases WHERE note_id = n.id) as earnings
      FROM notes n
      WHERE n.seller_id = $1 AND n.status = 'published'
      ORDER BY n.created_at DESC
      LIMIT 5
    `, [userId]);

    res.json({
      success: true,
      user: {
        id: req.user.id,
        username: req.user.username,
        plan: req.user.plan,
        credits: req.user.credits,
        wallet_balance: req.user.wallet_balance
      },
      stats: stats.rows[0],
      recentPurchases: recentPurchases.rows,
      sellingNotes: sellingStats.rows
    });

  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to load dashboard' });
  }
});

// GET /api/users/profile - Get user profile
router.get('/profile', authenticateUser, async (req, res) => {
  try {
    res.json({
      success: true,
      user: {
        id: req.user.id,
        telegram_id: req.user.telegram_id,
        username: req.user.username,
        first_name: req.user.first_name,
        email: req.user.email,
        plan: req.user.plan,
        credits: req.user.credits,
        wallet_balance: parseFloat(req.user.wallet_balance),
        created_at: req.user.created_at
      }
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Failed to load profile' });
  }
});

// PUT /api/users/profile - Update profile
router.put('/profile', authenticateUser, async (req, res) => {
  try {
    const { email, username } = req.body;
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (email) {
      updates.push(`email = $${paramIndex}`);
      values.push(email);
      paramIndex++;
    }

    if (username) {
      updates.push(`username = $${paramIndex}`);
      values.push(username);
      paramIndex++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }

    values.push(req.user.id);
    
    const result = await db.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    res.json({
      success: true,
      user: result.rows[0]
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// POST /api/users/add-credits - Add credits (rewarded ad)
router.post('/add-credits', authenticateUser, async (req, res) => {
  try {
    const { type, amount = 1 } = req.body;

    if (type !== 'rewarded_ad') {
      return res.status(400).json({ error: 'Invalid credit type' });
    }

    // Check cooldown (max 5 ads per day)
    const today = new Date().toISOString().split('T')[0];
    const adCount = await db.query(`
      SELECT COUNT(*) as count FROM ai_jobs 
      WHERE user_id = $1 AND job_type = 'rewarded_ad' 
      AND created_at::date = $2
    `, [req.user.id, today]);

    if (parseInt(adCount.rows[0].count) >= 5) {
      return res.status(429).json({ error: 'Daily ad limit reached' });
    }

    // Add credits
    await db.query(
      'UPDATE users SET credits = credits + $1 WHERE id = $2',
      [amount, req.user.id]
    );

    // Log the ad view
    await db.query(`
      INSERT INTO ai_jobs (user_id, job_type, input_hash, output)
      VALUES ($1, 'rewarded_ad', $2, $3)
    `, [req.user.id, new Date().toISOString(), JSON.stringify({ credits: amount })]);

    res.json({
      success: true,
      credits: req.user.credits + amount,
      message: `+${amount} credit added!`
    });

  } catch (error) {
    console.error('Add credits error:', error);
    res.status(500).json({ error: 'Failed to add credits' });
  }
});

// POST /api/users/request-payout - Request seller payout
router.post('/request-payout', authenticateUser, async (req, res) => {
  try {
    const { amount, method } = req.body;
    
    const minPayout = 20.00; // Minimum $20 payout
    
    if (!amount || parseFloat(amount) < minPayout) {
      return res.status(400).json({ 
        error: `Minimum payout is $${minPayout}` 
      });
    }

    if (parseFloat(req.user.wallet_balance) < parseFloat(amount)) {
      return res.status(400).json({ 
        error: 'Insufficient balance' 
      });
    }

    // Create payout request
    const result = await db.query(`
      INSERT INTO payouts (seller_id, amount_usd, method, status)
      VALUES ($1, $2, $3, 'pending')
      RETURNING *
    `, [req.user.id, amount, method || 'paypal']);

    // Deduct from wallet (pending)
    await db.query(
      'UPDATE users SET wallet_balance = wallet_balance - $1 WHERE id = $2',
      [amount, req.user.id]
    );

    res.json({
      success: true,
      payout: result.rows[0],
      message: 'Payout request submitted. Processing takes 3-5 business days.'
    });

  } catch (error) {
    console.error('Payout error:', error);
    res.status(500).json({ error: 'Failed to request payout' });
  }
});

// GET /api/users/referrals - Get referral stats
router.get('/referrals', authenticateUser, async (req, res) => {
  try {
    const referrals = await db.query(`
      SELECT r.*, u.username as referred_username
      FROM referrals r
      JOIN users u ON r.referred_id = u.id
      WHERE r.referrer_id = $1
      ORDER BY r.created_at DESC
    `, [req.user.id]);

    const stats = await db.query(`
      SELECT 
        COUNT(*) as total_referrals,
        SUM(reward_credits) as total_credits_earned
      FROM referrals
      WHERE referrer_id = $1
    `, [req.user.id]);

    res.json({
      success: true,
      referralCode: req.user.telegram_id, // Simple referral code
      referrals: referrals.rows,
      stats: stats.rows[0]
    });

  } catch (error) {
    console.error('Referrals error:', error);
    res.status(500).json({ error: 'Failed to fetch referrals' });
  }
});

module.exports = router;