# NoteX Backend API

AI-powered study assistant and notes marketplace for Telegram.

## Features

- ✅ Telegram WebApp authentication
- ✅ AI study tools (Gemini API)
- ✅ Notes marketplace with file uploads
- ✅ Stripe payments & subscriptions
- ✅ Google Cloud Storage for files
- ✅ PostgreSQL database

## Quick Start

### Prerequisites
- Node.js 18+
- Google Cloud account
- Telegram Bot
- Gemini API key
- Stripe account

### Installation

```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your keys

# Run locally
npm run dev

# Deploy to Google Cloud
npm run deploy
```

### Environment Variables

See `.env.example` for all required variables.

### Database Setup

```bash
# Connect to Cloud SQL
./cloud_sql_proxy -instances=CONNECTION_NAME=tcp:5432

# Run schema
psql -h 127.0.0.1 -U notex -d notex_db -f schema.sql
```

## API Endpoints

### Authentication
- `POST /api/auth/telegram-login` - Login with Telegram

### AI Features
- `POST /api/ai/summarize` - Summarize text
- `POST /api/ai/flashcards` - Generate flashcards
- `POST /api/ai/quiz` - Create quiz
- `POST /api/ai/explain` - Explain concepts

### Notes Marketplace
- `GET /api/notes` - List notes
- `GET /api/notes/:id` - Get note details
- `POST /api/notes/upload` - Upload note
- `GET /api/notes/:id/download` - Download purchased note

### Purchases
- `POST /api/purchases/create-checkout` - Create Stripe checkout
- `POST /api/purchases/create-subscription` - Subscribe to Pro/Elite
- `GET /api/purchases/my-purchases` - User's purchases

### Users
- `GET /api/users/dashboard` - User dashboard
- `POST /api/users/request-payout` - Request seller payout

### Webhooks
- `POST /webhooks/stripe` - Stripe payment webhooks

## Deployment

### Google App Engine
```bash
gcloud app deploy
```

### Google Cloud Run (Alternative)
```bash
gcloud run deploy notex-api \
  --source . \
  --region us-central1 \
  --allow-unauthenticated
```

## Cost Estimates

- First 1000 users: $0-8/month
- 10K users: ~$80/month
- Gemini API: FREE (1.5M tokens/day)

## License

MIT