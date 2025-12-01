// routes/referrals.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateUser } = require('./auth');

// Apply referral code
router.post('/apply', authenticateUser, async (req, res) => {
  try {
    const { referral_code } = req.body;
    const userId = req.user.id;

    if (!referral_code) {
      return res.status(400).json({ success: false, error: 'Referral code is required' });
    }

    // Can't use own referral code
    if (req.user.referral_code === referral_code) {
      return res.status(400).json({ success: false, error: 'Cannot use your own referral code' });
    }

    // Check if user already used a referral code
    const existingReferral = await db.query(
      'SELECT id FROM referrals WHERE referred_id = $1',
      [userId]
    );

    if (existingReferral.rows.length > 0) {
      return res.status(400).json({ success: false, error: 'You have already used a referral code' });
    }

    // Find referrer
    const referrerResult = await db.query(
      'SELECT id, username, referrals_count FROM users WHERE referral_code = $1',
      [referral_code]
    );

    if (referrerResult.rows.length === 0) {
      return res.status(400).json({ success: false, error: 'Invalid referral code' });
    }

    const referrer = referrerResult.rows[0];

    // Start transaction
    await db.query('BEGIN');

    try {
      // Create referral record
      await db.query(
        'INSERT INTO referrals (referrer_id, referred_id, reward_credits) VALUES ($1, $2, $3)',
        [referrer.id, userId, 5]
      );

      // Update referrer's count and add credits
      await db.query(
        'UPDATE users SET referrals_count = referrals_count + 1, credits = credits + 5 WHERE id = $1',
        [referrer.id]
      );

      // Give new user bonus credits
      await db.query(
        'UPDATE users SET credits = credits + 3 WHERE id = $1',
        [userId]
      );

      // Check if referrer reached 3 referrals (give premium)
      if (referrer.referrals_count + 1 >= 3) {
        const premiumUntil = new Date();
        premiumUntil.setDate(premiumUntil.getDate() + 7); // 7 days premium
        
        await db.query(
          'UPDATE users SET premium_until = $1, plan = $2 WHERE id = $3',
          [premiumUntil, 'pro', referrer.id]
        );
      }

      await db.query('COMMIT');

      // Get updated user data
      const updatedUser = await db.query(
        'SELECT * FROM users WHERE id = $1',
        [userId]
      );

      res.json({
        success: true,
        message: 'Referral applied successfully! +3 credits added.',
        user: updatedUser.rows[0],
        bonus: 3
      });

    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('Referral apply error:', error);
    res.status(500).json({ success: false, error: 'Failed to apply referral code' });
  }
});

// Get referral stats
router.get('/stats', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;

    const stats = await db.query(`
      SELECT 
        u.referrals_count,
        u.referral_code,
        COUNT(r.id) as successful_referrals,
        COALESCE(SUM(r.reward_credits), 0) as total_credits_earned
      FROM users u
      LEFT JOIN referrals r ON u.id = r.referrer_id
      WHERE u.id = $1
      GROUP BY u.id, u.referrals_count, u.referral_code
    `, [userId]);

    const referralsNeeded = Math.max(0, 3 - (stats.rows[0]?.referrals_count || 0));
    const isPremium = req.user.premium_until && new Date(req.user.premium_until) > new Date();

    res.json({
      success: true,
      stats: {
        referral_code: req.user.referral_code,
        referrals_count: stats.rows[0]?.referrals_count || 0,
        successful_referrals: stats.rows[0]?.successful_referrals || 0,
        total_credits_earned: stats.rows[0]?.total_credits_earned || 0,
        referrals_needed: referralsNeeded,
        has_premium: isPremium,
        premium_until: req.user.premium_until
      }
    });

  } catch (error) {
    console.error('Referral stats error:', error);
    res.status(500).json({ success: false, error: 'Failed to get referral stats' });
  }
});

// Generate referral link (Updated for Firebase)
router.get('/link', authenticateUser, (req, res) => {
  // For Firebase Hosting - use environment variable or common patterns
  const baseUrl = process.env.FRONTEND_URL || 
                  'https://notex-app.web.app'; // Common Firebase pattern
  
  const referralLink = `${baseUrl}?ref=${req.user.referral_code}`;
  
  res.json({
    success: true,
    referral_code: req.user.referral_code,
    referral_link: referralLink,
    instructions: 'Share this code with friends! They can enter it in the app.'
  });
});

module.exports = router;