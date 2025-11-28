// ============================================
// FILE: routes/purchases.js
// PURPOSE: Handle all payment and subscription operations
// ============================================

const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
const db = require('../db');
const { authenticateUser } = require('./auth');

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// ============================================
// POST /api/purchases/create-checkout
// Create Stripe checkout session for buying a note
// ============================================
router.post('/create-checkout', authenticateUser, async (req, res) => {
  try {
    const { noteId } = req.body;

    // Validate input
    if (!noteId) {
      return res.status(400).json({ error: 'Note ID is required' });
    }

    console.log(`Creating checkout for note ${noteId} by user ${req.user.id}`);

    // Get note details from database
    const noteResult = await db.query(
      'SELECT * FROM notes WHERE id = $1 AND status = $2',
      [noteId, 'published']
    );

    if (noteResult.rows.length === 0) {
      return res.status(404).json({ error: 'Note not found or not available' });
    }

    const note = noteResult.rows[0];

    // Check if user already purchased this note
    const purchaseCheck = await db.query(
      'SELECT * FROM purchases WHERE note_id = $1 AND buyer_id = $2',
      [noteId, req.user.id]
    );

    if (purchaseCheck.rows.length > 0) {
      return res.status(400).json({ 
        error: 'You already own this note',
        alreadyPurchased: true 
      });
    }

    // Calculate fees
    const amount = parseFloat(note.price_usd);
    const platformFeePercent = 0.30; // 30% commission - CHANGE THIS VALUE
    const stripeFeePercent = 0.029;  // Stripe: 2.9%
    const stripeFeeFixed = 0.30;     // Stripe: $0.30
    
    const platformFee = amount * platformFeePercent;
    const stripeFee = (amount * stripeFeePercent) + stripeFeeFixed;
    const sellerEarnings = amount - platformFee - stripeFee;

    console.log(`Amount: $${amount}, Platform Fee: $${platformFee.toFixed(2)}, Seller Gets: $${sellerEarnings.toFixed(2)}`);

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: note.title,
              description: note.description.substring(0, 200),
              metadata: {
                note_id: note.id,
                seller_id: note.seller_id
              }
            },
            unit_amount: Math.round(amount * 100) // Convert to cents
          },
          quantity: 1
        }
      ],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/marketplace`,
      metadata: {
        note_id: noteId,
        buyer_id: req.user.id,
        seller_id: note.seller_id,
        amount: amount.toFixed(2),
        platform_fee: platformFee.toFixed(2),
        stripe_fee: stripeFee.toFixed(2),
        seller_earnings: sellerEarnings.toFixed(2)
      }
    });

    // Create pending purchase record in database
    await db.query(`
      INSERT INTO purchases (
        buyer_id, note_id, amount_usd, fee_usd, 
        stripe_payment_id, status
      )
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [
      req.user.id,
      noteId,
      amount,
      platformFee + stripeFee,
      session.id,
      'pending'
    ]);

    console.log(`✅ Checkout session created: ${session.id}`);

    res.json({
      success: true,
      sessionId: session.id,
      checkoutUrl: session.url
    });

  } catch (error) {
    console.error('Checkout creation error:', error);
    res.status(500).json({ 
      error: 'Failed to create checkout session',
      details: error.message 
    });
  }
});

// ============================================
// POST /api/purchases/create-subscription
// Create Pro or Elite subscription
// ============================================
router.post('/create-subscription', authenticateUser, async (req, res) => {
  try {
    const { plan } = req.body; // 'pro' or 'elite'

    // Validate plan
    if (!plan || !['pro', 'elite'].includes(plan)) {
      return res.status(400).json({ 
        error: 'Invalid plan. Choose "pro" or "elite"' 
      });
    }

    console.log(`Creating ${plan} subscription for user ${req.user.id}`);

    // Define subscription prices
    const prices = {
      pro: { 
        amount: 500,  // $5.00 in cents - CHANGE THIS
        priceId: process.env.STRIPE_PRICE_PRO,
        name: 'NoteX Pro'
      },
      elite: { 
        amount: 1500, // $15.00 in cents - CHANGE THIS
        priceId: process.env.STRIPE_PRICE_ELITE,
        name: 'NoteX Elite'
      }
    };

    const selectedPlan = prices[plan];

    // Check if price ID is configured
    if (!selectedPlan.priceId) {
      return res.status(500).json({ 
        error: 'Subscription price not configured. Please contact support.' 
      });
    }

    // Check if user already has active subscription
    const subCheck = await db.query(
      'SELECT * FROM subscriptions WHERE user_id = $1 AND status = $2',
      [req.user.id, 'active']
    );

    if (subCheck.rows.length > 0) {
      return res.status(400).json({ 
        error: 'You already have an active subscription',
        currentPlan: subCheck.rows[0].tier 
      });
    }

    // Create Stripe checkout session for subscription
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price: selectedPlan.priceId,
          quantity: 1
        }
      ],
      success_url: `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}`,
      metadata: {
        user_id: req.user.id,
        plan: plan
      }
    });

    console.log(`✅ Subscription checkout created: ${session.id}`);

    res.json({
      success: true,
      sessionId: session.id,
      checkoutUrl: session.url,
      plan: selectedPlan.name
    });

  } catch (error) {
    console.error('Subscription creation error:', error);
    res.status(500).json({ 
      error: 'Failed to create subscription',
      details: error.message 
    });
  }
});

// ============================================
// GET /api/purchases/my-purchases
// Get user's purchase history
// ============================================
router.get('/my-purchases', authenticateUser, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        p.*,
        n.title,
        n.description,
        n.file_url,
        n.thumbnail_url,
        n.subject,
        u.username as seller_name
      FROM purchases p
      JOIN notes n ON p.note_id = n.id
      JOIN users u ON n.seller_id = u.id
      WHERE p.buyer_id = $1 AND p.status = 'completed'
      ORDER BY p.created_at DESC
    `, [req.user.id]);

    res.json({
      success: true,
      purchases: result.rows,
      total: result.rows.length
    });

  } catch (error) {
    console.error('Fetch purchases error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch purchase history' 
    });
  }
});

// ============================================
// GET /api/purchases/verify/:sessionId
// Verify a Stripe checkout session
// ============================================
router.get('/verify/:sessionId', authenticateUser, async (req, res) => {
  try {
    const { sessionId } = req.params;

    // Retrieve session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === 'paid') {
      // Check if purchase exists in database
      const purchase = await db.query(
        'SELECT * FROM purchases WHERE stripe_payment_id = $1',
        [sessionId]
      );

      res.json({
        success: true,
        paid: true,
        purchase: purchase.rows[0] || null
      });
    } else {
      res.json({
        success: true,
        paid: false,
        status: session.payment_status
      });
    }

  } catch (error) {
    console.error('Verify session error:', error);
    res.status(500).json({ 
      error: 'Failed to verify payment' 
    });
  }
});

// ============================================
// GET /api/purchases/stats
// Get user's purchase statistics
// ============================================
router.get('/stats', authenticateUser, async (req, res) => {
  try {
    const stats = await db.query(`
      SELECT 
        COUNT(*) as total_purchases,
        SUM(amount_usd) as total_spent,
        MAX(created_at) as last_purchase
      FROM purchases
      WHERE buyer_id = $1 AND status = 'completed'
    `, [req.user.id]);

    res.json({
      success: true,
      stats: stats.rows[0]
    });

  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch statistics' 
    });
  }
});

module.exports = router;