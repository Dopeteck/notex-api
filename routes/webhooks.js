// ============================================
// FILE: routes/webhooks.js
// PURPOSE: Handle Stripe payment webhooks
// LOCATION: Save as routes/webhooks.js
// ============================================

const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
const db = require('../db');

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// ============================================
// POST /webhooks/stripe
// Main webhook endpoint - Stripe sends events here
// ============================================
router.post('/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  console.log('📨 Received Stripe webhook');

  try {
    // Verify webhook signature to ensure it's from Stripe
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    
    console.log(`✅ Webhook verified: ${event.type}`);
  } catch (err) {
    console.error('❌ Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    // Handle different Stripe event types
    switch (event.type) {
      
      // When checkout session is completed (payment successful)
      case 'checkout.session.completed':
        console.log('💳 Processing checkout.session.completed');
        await handleCheckoutCompleted(event.data.object);
        break;

      // When subscription invoice is paid
      case 'invoice.paid':
        console.log('💰 Processing invoice.paid');
        await handleInvoicePaid(event.data.object);
        break;

      // When subscription payment fails
      case 'invoice.payment_failed':
        console.log('⚠️  Processing invoice.payment_failed');
        await handlePaymentFailed(event.data.object);
        break;

      // When subscription is canceled
      case 'customer.subscription.deleted':
        console.log('❌ Processing customer.subscription.deleted');
        await handleSubscriptionDeleted(event.data.object);
        break;

      // When subscription is updated
      case 'customer.subscription.updated':
        console.log('🔄 Processing customer.subscription.updated');
        await handleSubscriptionUpdated(event.data.object);
        break;

      default:
        console.log(`ℹ️  Unhandled event type: ${event.type}`);
    }

    // Always respond with 200 to acknowledge receipt
    res.json({ received: true });

  } catch (error) {
    console.error('💥 Webhook handler error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// ============================================
// FUNCTION: handleCheckoutCompleted
// Called when user completes payment
// Updates database and adds money to seller wallet
// ============================================
async function handleCheckoutCompleted(session) {
  const metadata = session.metadata;
  
  console.log('📋 Session metadata:', metadata);

  // ========================================
  // HANDLE NOTE PURCHASE
  // ========================================
  if (metadata.note_id) {
    console.log(`🛒 Processing note purchase: ${metadata.note_id}`);

    try {
      // 1. Update purchase status to completed
      const updateResult = await db.query(
        `UPDATE purchases 
         SET status = 'completed', 
             stripe_payment_id = $1,
             created_at = NOW()
         WHERE stripe_payment_id = $2`,
        [session.payment_intent, session.id]
      );

      console.log(`✅ Purchase updated: ${updateResult.rowCount} row(s)`);

      // 2. Calculate seller earnings
      const amount = parseFloat(metadata.amount || 0);
      const platformFee = parseFloat(metadata.platform_fee || 0);
      const stripeFee = parseFloat(metadata.stripe_fee || 0);
      const sellerEarnings = parseFloat(metadata.seller_earnings || (amount - platformFee - stripeFee));

      console.log(`💵 Amount: $${amount}, Seller gets: $${sellerEarnings.toFixed(2)}`);

      // 3. Add earnings to seller's wallet (THIS UPDATES AUTOMATICALLY!)
      const walletResult = await db.query(
        'UPDATE users SET wallet_balance = wallet_balance + $1 WHERE id = $2 RETURNING wallet_balance',
        [sellerEarnings, metadata.seller_id]
      );

      if (walletResult.rows.length > 0) {
        console.log(`✅ Seller wallet updated: New balance $${walletResult.rows[0].wallet_balance}`);
      }

      // 4. Log the transaction
      await db.query(
        `INSERT INTO ai_jobs (user_id, job_type, input_hash, output, cost_units)
         VALUES ($1, 'purchase_completed', $2, $3, $4)`,
        [
          metadata.buyer_id,
          session.id,
          JSON.stringify({
            note_id: metadata.note_id,
            amount: amount,
            seller_earnings: sellerEarnings
          }),
          0
        ]
      );

      console.log(`✅ Note purchase completed successfully!`);
      console.log(`   - Note ID: ${metadata.note_id}`);
      console.log(`   - Buyer: ${metadata.buyer_id}`);
      console.log(`   - Seller: ${metadata.seller_id}`);
      console.log(`   - Seller earned: $${sellerEarnings.toFixed(2)}`);

    } catch (error) {
      console.error('❌ Error processing note purchase:', error);
      throw error;
    }
  }

  // ========================================
  // HANDLE SUBSCRIPTION
  // ========================================
  if (metadata.plan) {
    console.log(`⭐ Processing subscription: ${metadata.plan}`);

    try {
      const subscriptionId = session.subscription;
      
      // 1. Create or update subscription record
      await db.query(`
        INSERT INTO subscriptions (
          user_id, 
          stripe_subscription_id, 
          tier, 
          status, 
          started_at
        )
        VALUES ($1, $2, $3, 'active', NOW())
        ON CONFLICT (user_id) 
        DO UPDATE SET 
          stripe_subscription_id = $2,
          tier = $3,
          status = 'active',
          started_at = NOW()
      `, [metadata.user_id, subscriptionId, metadata.plan]);

      console.log(`✅ Subscription record created/updated`);

      // 2. Update user plan to pro/elite
      await db.query(
        'UPDATE users SET plan = $1 WHERE id = $2',
        [metadata.plan, metadata.user_id]
      );

      console.log(`✅ User plan updated to: ${metadata.plan}`);

      // 3. If Pro or Elite, give unlimited credits (set to 9999)
      await db.query(
        'UPDATE users SET credits = 9999 WHERE id = $1',
        [metadata.user_id]
      );

      console.log(`✅ Subscription activated successfully!`);
      console.log(`   - User: ${metadata.user_id}`);
      console.log(`   - Plan: ${metadata.plan}`);
      console.log(`   - Subscription ID: ${subscriptionId}`);

    } catch (error) {
      console.error('❌ Error processing subscription:', error);
      throw error;
    }
  }
}

// ============================================
// FUNCTION: handleInvoicePaid
// Called when recurring subscription invoice is paid
// ============================================
async function handleInvoicePaid(invoice) {
  const subscriptionId = invoice.subscription;
  
  if (!subscriptionId) {
    console.log('ℹ️  Invoice not related to subscription, skipping');
    return;
  }

  try {
    // Mark subscription as active
    await db.query(
      'UPDATE subscriptions SET status = $1 WHERE stripe_subscription_id = $2',
      ['active', subscriptionId]
    );

    console.log(`✅ Subscription renewed: ${subscriptionId}`);

  } catch (error) {
    console.error('❌ Error handling invoice paid:', error);
    throw error;
  }
}

// ============================================
// FUNCTION: handlePaymentFailed
// Called when subscription payment fails
// ============================================
async function handlePaymentFailed(invoice) {
  const subscriptionId = invoice.subscription;
  
  if (!subscriptionId) {
    console.log('ℹ️  Invoice not related to subscription, skipping');
    return;
  }

  try {
    // Mark subscription as past_due
    await db.query(
      'UPDATE subscriptions SET status = $1 WHERE stripe_subscription_id = $2',
      ['past_due', subscriptionId]
    );

    console.log(`⚠️  Subscription payment failed: ${subscriptionId}`);
    console.log(`   Status changed to: past_due`);

  } catch (error) {
    console.error('❌ Error handling payment failure:', error);
    throw error;
  }
}

// ============================================
// FUNCTION: handleSubscriptionDeleted
// Called when subscription is canceled
// ============================================
async function handleSubscriptionDeleted(subscription) {
  try {
    // 1. Mark subscription as canceled
    await db.query(
      'UPDATE subscriptions SET status = $1, canceled_at = NOW() WHERE stripe_subscription_id = $2',
      ['canceled', subscription.id]
    );

    console.log(`✅ Subscription canceled: ${subscription.id}`);

    // 2. Get user who owned this subscription
    const subResult = await db.query(
      'SELECT user_id FROM subscriptions WHERE stripe_subscription_id = $1',
      [subscription.id]
    );

    if (subResult.rows.length > 0) {
      const userId = subResult.rows[0].user_id;

      // 3. Downgrade user to free plan
      await db.query(
        'UPDATE users SET plan = $1, credits = $2 WHERE id = $3',
        ['free', 10, userId]  // Reset to free plan with 10 credits
      );

      console.log(`✅ User downgraded to free plan: ${userId}`);
    }

  } catch (error) {
    console.error('❌ Error handling subscription deletion:', error);
    throw error;
  }
}

// ============================================
// FUNCTION: handleSubscriptionUpdated
// Called when subscription is modified
// ============================================
async function handleSubscriptionUpdated(subscription) {
  try {
    const status = subscription.status;

    // Update subscription status
    await db.query(
      'UPDATE subscriptions SET status = $1 WHERE stripe_subscription_id = $2',
      [status, subscription.id]
    );

    console.log(`✅ Subscription updated: ${subscription.id}`);
    console.log(`   New status: ${status}`);

    // If subscription becomes inactive, downgrade user
    if (['canceled', 'unpaid', 'incomplete_expired'].includes(status)) {
      const subResult = await db.query(
        'SELECT user_id FROM subscriptions WHERE stripe_subscription_id = $1',
        [subscription.id]
      );

      if (subResult.rows.length > 0) {
        await db.query(
          'UPDATE users SET plan = $1, credits = $2 WHERE id = $3',
          ['free', 10, subResult.rows[0].user_id]
        );

        console.log(`✅ User downgraded due to subscription status: ${status}`);
      }
    }

  } catch (error) {
    console.error('❌ Error handling subscription update:', error);
    throw error;
  }
}

// ============================================
// GET /webhooks/test
// Test endpoint to verify webhooks are working
// ============================================
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Webhooks endpoint is working!',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;