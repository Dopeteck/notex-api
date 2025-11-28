-- ============================================
-- NoteX Complete Database Schema
-- PostgreSQL 15+
-- Run this file to create all tables
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS TABLE - Stores all user accounts
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  telegram_id VARCHAR(50) UNIQUE NOT NULL,
  username VARCHAR(100),
  first_name VARCHAR(100),
  email VARCHAR(255),
  plan VARCHAR(20) DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'elite')),
  credits INTEGER DEFAULT 10,  -- AI credits - CHANGE DEFAULT HERE
  wallet_balance DECIMAL(10, 2) DEFAULT 0.00,  -- Seller earnings
  session_token VARCHAR(255),
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_telegram ON users(telegram_id);
CREATE INDEX idx_users_session ON users(session_token);
CREATE INDEX idx_users_plan ON users(plan);

-- ============================================
-- NOTES TABLE - Stores uploaded study notes
-- ============================================
CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  subject VARCHAR(100),
  level VARCHAR(50) DEFAULT 'undergraduate',
  country VARCHAR(50),
  price_usd DECIMAL(10, 2) NOT NULL,
  file_url TEXT NOT NULL,
  thumbnail_url TEXT,
  tags TEXT[],
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'published', 'rejected')),
  views INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notes_seller ON notes(seller_id);
CREATE INDEX idx_notes_subject ON notes(subject);
CREATE INDEX idx_notes_status ON notes(status);
CREATE INDEX idx_notes_price ON notes(price_usd);
CREATE INDEX idx_notes_created ON notes(created_at DESC);

-- ============================================
-- PURCHASES TABLE - Tracks note purchases
-- ============================================
CREATE TABLE IF NOT EXISTS purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  buyer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  note_id UUID REFERENCES notes(id) ON DELETE CASCADE,
  amount_usd DECIMAL(10, 2) NOT NULL,
  fee_usd DECIMAL(10, 2) DEFAULT 0,
  stripe_payment_id VARCHAR(255),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'refunded')),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_purchases_buyer ON purchases(buyer_id);
CREATE INDEX idx_purchases_note ON purchases(note_id);
CREATE INDEX idx_purchases_status ON purchases(status);
CREATE UNIQUE INDEX idx_purchases_unique ON purchases(buyer_id, note_id) WHERE status = 'completed';

-- ============================================
-- SUBSCRIPTIONS TABLE - Tracks Pro/Elite subs
-- ============================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  stripe_subscription_id VARCHAR(255) UNIQUE,
  tier VARCHAR(20) CHECK (tier IN ('pro', 'elite')),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'canceled')),
  started_at TIMESTAMP DEFAULT NOW(),
  canceled_at TIMESTAMP
);

CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

-- ============================================
-- AI_JOBS TABLE - Tracks AI usage & ad views
-- ============================================
CREATE TABLE IF NOT EXISTS ai_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  job_type VARCHAR(50) NOT NULL CHECK (job_type IN ('summary', 'flashcards', 'quiz', 'explain', 'rewarded_ad')),
  input_hash VARCHAR(255),
  output JSONB,
  cost_units INTEGER DEFAULT 1,  -- Credits consumed
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ai_jobs_user ON ai_jobs(user_id);
CREATE INDEX idx_ai_jobs_type ON ai_jobs(job_type);
CREATE INDEX idx_ai_jobs_created ON ai_jobs(created_at DESC);

-- ============================================
-- REVIEWS TABLE - Note ratings & reviews
-- ============================================
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  note_id UUID REFERENCES notes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(note_id, user_id)
);

CREATE INDEX idx_reviews_note ON reviews(note_id);
CREATE INDEX idx_reviews_user ON reviews(user_id);

-- ============================================
-- ADS TABLE - Ad campaigns tracking
-- ============================================
CREATE TABLE IF NOT EXISTS ads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner VARCHAR(255),
  placement VARCHAR(50) CHECK (placement IN ('home_banner', 'sponsored_slot', 'rewarded')),
  creative_url TEXT,
  target_url TEXT,
  pricing_usd DECIMAL(10, 2),
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  start_at TIMESTAMP,
  end_at TIMESTAMP,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'ended')),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ads_placement ON ads(placement);
CREATE INDEX idx_ads_status ON ads(status);
CREATE INDEX idx_ads_dates ON ads(start_at, end_at);

-- ============================================
-- PAYOUTS TABLE - Seller payout requests
-- ============================================
CREATE TABLE IF NOT EXISTS payouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID REFERENCES users(id) ON DELETE CASCADE,
  amount_usd DECIMAL(10, 2) NOT NULL,
  method VARCHAR(50),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  processed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_payouts_seller ON payouts(seller_id);
CREATE INDEX idx_payouts_status ON payouts(status);

-- ============================================
-- REFERRALS TABLE - Referral tracking
-- ============================================
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  referred_id UUID REFERENCES users(id) ON DELETE CASCADE,
  reward_credits INTEGER DEFAULT 5,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(referrer_id, referred_id)
);

CREATE INDEX idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX idx_referrals_referred ON referrals(referred_id);

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update updated_at on notes
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_notes_updated_at 
  BEFORE UPDATE ON notes
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SAMPLE SEED DATA (for testing)
-- ============================================

-- Insert demo users
INSERT INTO users (telegram_id, username, first_name, plan, credits, wallet_balance) VALUES
('demo123', 'demo_student', 'Demo User', 'free', 10, 0.00),
('seller001', 'top_seller', 'Sarah Chen', 'pro', 100, 45.50),
('seller002', 'math_genius', 'John Smith', 'free', 5, 12.30)
ON CONFLICT (telegram_id) DO NOTHING;

-- Insert sample notes
INSERT INTO notes (seller_id, title, description, subject, level, price_usd, file_url, tags, status) 
SELECT 
  (SELECT id FROM users WHERE telegram_id = 'seller001'),
  'Calculus I - Complete Notes',
  'Comprehensive calculus notes covering limits, derivatives, integrals, and applications. Perfect for first-year students.',
  'Mathematics',
  'undergraduate',
  4.99,
  'gs://notex-files/sample-calculus.pdf',
  ARRAY['calculus', 'derivatives', 'integrals'],
  'published'
WHERE NOT EXISTS (SELECT 1 FROM notes WHERE title = 'Calculus I - Complete Notes');

INSERT INTO notes (seller_id, title, description, subject, level, price_usd, file_url, tags, status)
SELECT
  (SELECT id FROM users WHERE telegram_id = 'seller001'),
  'Organic Chemistry - Reaction Mechanisms',
  'Detailed notes on organic chemistry mechanisms with arrow-pushing diagrams and practice problems.',
  'Chemistry',
  'undergraduate',
  6.99,
  'gs://notex-files/sample-chemistry.pdf',
  ARRAY['chemistry', 'organic', 'mechanisms'],
  'published'
WHERE NOT EXISTS (SELECT 1 FROM notes WHERE title = 'Organic Chemistry - Reaction Mechanisms');

INSERT INTO notes (seller_id, title, description, subject, level, price_usd, file_url, tags, status)
SELECT
  (SELECT id FROM users WHERE telegram_id = 'seller002'),
  'Data Structures & Algorithms',
  'Complete guide to DSA with Python code examples, time complexity analysis, and interview questions.',
  'Computer Science',
  'undergraduate',
  5.49,
  'gs://notex-files/sample-dsa.pdf',
  ARRAY['programming', 'algorithms', 'python'],
  'published'
WHERE NOT EXISTS (SELECT 1 FROM notes WHERE title = 'Data Structures & Algorithms');

-- Insert sample review
INSERT INTO reviews (note_id, user_id, rating, comment)
SELECT
  (SELECT id FROM notes WHERE title = 'Calculus I - Complete Notes'),
  (SELECT id FROM users WHERE telegram_id = 'demo123'),
  5,
  'Excellent notes! Very clear explanations and helped me ace my exam.'
WHERE NOT EXISTS (
  SELECT 1 FROM reviews 
  WHERE note_id = (SELECT id FROM notes WHERE title = 'Calculus I - Complete Notes')
  AND user_id = (SELECT id FROM users WHERE telegram_id = 'demo123')
);

-- ============================================
-- VERIFICATION QUERIES (run these to check)
-- ============================================

-- Check if tables created successfully
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- Check sample data
-- SELECT * FROM users;
-- SELECT * FROM notes;

-- ============================================
-- DONE! Database is ready
-- ============================================