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
  telegram_id VARCHAR(50) UNIQUE,
  username VARCHAR(100),
  first_name VARCHAR(100),
  email VARCHAR(255),
  plan VARCHAR(20) DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'elite')),
  credits INTEGER DEFAULT 10,
  wallet_balance DECIMAL(10, 2) DEFAULT 0.00,
  session_token VARCHAR(255),
  referral_code VARCHAR(8) UNIQUE, -- ADDED FOR REFERRAL SYSTEM
  referrals_count INTEGER DEFAULT 0, -- ADDED FOR REFERRAL SYSTEM
  premium_until TIMESTAMP, -- ADDED FOR PREMIUM TRIALS
  last_quiz_date DATE, -- ADDED FOR DAILY QUIZ
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_telegram ON users(telegram_id);
CREATE INDEX IF NOT EXISTS idx_users_session ON users(session_token);
CREATE INDEX IF NOT EXISTS idx_users_plan ON users(plan);

-- ============================================
-- NOTES TABLE - Stores uploaded study notes
-- ============================================
CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) DEFAULT 'notes', -- ADDED FOR CONTENT TYPE
  genre VARCHAR(100), -- ADDED FOR NOVELS/B00KS
  subject VARCHAR(100),
  level VARCHAR(50) DEFAULT 'undergraduate',
  country VARCHAR(50),
  price_usd DECIMAL(10, 2) NOT NULL,
  pages INTEGER, -- ADDED FOR PAGE COUNT
  file_url TEXT NOT NULL,
  thumbnail_url TEXT,
  tags TEXT[],
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'published', 'rejected')),
  views INTEGER DEFAULT 0,
  purchase_count INTEGER DEFAULT 0, -- ADDED FOR PURCHASE TRACKING
  avg_rating DECIMAL(3,2) DEFAULT 0.00, -- ADDED FOR RATINGS
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notes_seller ON notes(seller_id);
CREATE INDEX IF NOT EXISTS idx_notes_subject ON notes(subject);
CREATE INDEX IF NOT EXISTS idx_notes_status ON notes(status);
CREATE INDEX IF NOT EXISTS idx_notes_price ON notes(price_usd);
CREATE INDEX IF NOT EXISTS idx_notes_created ON notes(created_at DESC);

-- ============================================
-- USER_ACTIVITIES TABLE - For gamification
-- ============================================
CREATE TABLE IF NOT EXISTS user_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  activity_type VARCHAR(100) NOT NULL,
  credits_earned INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activities_user ON user_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_type ON user_activities(activity_type);

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

CREATE INDEX IF NOT EXISTS idx_purchases_buyer ON purchases(buyer_id);
CREATE INDEX IF NOT EXISTS idx_purchases_note ON purchases(note_id);
CREATE INDEX IF NOT EXISTS idx_purchases_status ON purchases(status);

-- ============================================
-- AI_JOBS TABLE - Tracks AI usage & ad views
-- ============================================
CREATE TABLE IF NOT EXISTS ai_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  job_type VARCHAR(50) NOT NULL CHECK (job_type IN ('summary', 'flashcards', 'quiz', 'explain', 'rewarded_ad')),
  input_hash VARCHAR(255),
  output JSONB,
  cost_units INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_jobs_user ON ai_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_jobs_type ON ai_jobs(job_type);
CREATE INDEX IF NOT EXISTS idx_ai_jobs_created ON ai_jobs(created_at DESC);

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

CREATE INDEX IF NOT EXISTS idx_reviews_note ON reviews(note_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews(user_id);

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

CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred ON referrals(referred_id);





-- Add referral columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS referral_code VARCHAR(8) UNIQUE,
ADD COLUMN IF NOT EXISTS referrals_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS premium_until TIMESTAMP;

-- Create referrals table if it doesn't exist
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  referred_id UUID REFERENCES users(id) ON DELETE CASCADE,
  reward_credits INTEGER DEFAULT 5,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(referrer_id, referred_id)
);

-- Create index for referrals
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred ON referrals(referred_id);

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

CREATE OR REPLACE TRIGGER update_notes_updated_at 
  BEFORE UPDATE ON notes
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();