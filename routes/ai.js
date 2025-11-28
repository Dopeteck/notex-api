const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const db = require('../db');
const { authenticateUser } = require('./auth');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function checkCredits(req, res, next) {
  const user = req.user;
  
  if (user.plan === 'pro' || user.plan === 'elite') {
    return next();
  }
  
  if (user.credits <= 0) {
    return res.status(403).json({ 
      error: 'No credits remaining',
      upgrade: true 
    });
  }
  
  next();
}

async function deductCredit(userId) {
  await db.query(
    'UPDATE users SET credits = credits - 1 WHERE id = $1',
    [userId]
  );
}

async function logAIJob(userId, jobType, inputHash, output, costUnits = 1) {
  await db.query(`
    INSERT INTO ai_jobs (user_id, job_type, input_hash, output, cost_units)
    VALUES ($1, $2, $3, $4, $5)
  `, [userId, jobType, inputHash, JSON.stringify(output), costUnits]);
}

router.post('/summarize', authenticateUser, checkCredits, async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text || text.length < 50) {
      return res.status(400).json({ error: 'Text too short (min 50 chars)' });
    }

    if (text.length > 50000) {
      return res.status(400).json({ error: 'Text too long (max 50k chars)' });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    
    const prompt = `You are a study assistant. Summarize the following text in clear bullet points. Focus on key concepts, important facts, and main ideas. Keep it concise and student-friendly.\n\nText:\n${text}`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const summary = response.text();

    await deductCredit(req.user.id);
    
    const inputHash = require('crypto').createHash('md5').update(text.substring(0, 1000)).digest('hex');
    await logAIJob(req.user.id, 'summary', inputHash, { summary });

    res.json({
      success: true,
      summary,
      creditsRemaining: req.user.credits - 1
    });

  } catch (error) {
    console.error('Summarize error:', error);
    res.status(500).json({ error: 'AI processing failed' });
  }
});

router.post('/flashcards', authenticateUser, checkCredits, async (req, res) => {
  try {
    const { text, count = 5 } = req.body;
    
    if (!text || text.length < 50) {
      return res.status(400).json({ error: 'Text too short' });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    
    const prompt = `Create ${count} flashcards from this text. Format each as:
Q: [Question]
A: [Answer]

Make questions test understanding, not just memorization. Keep answers concise.

Text:
${text}`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const flashcardsText = response.text();
    
    const flashcards = flashcardsText.split('\n\n').map((card, idx) => {
      const lines = card.split('\n');
      const question = lines.find(l => l.startsWith('Q:'))?.replace('Q:', '').trim();
      const answer = lines.find(l => l.startsWith('A:'))?.replace('A:', '').trim();
      return question && answer ? { id: idx + 1, question, answer } : null;
    }).filter(Boolean);

    await deductCredit(req.user.id);
    
    const inputHash = require('crypto').createHash('md5').update(text.substring(0, 1000)).digest('hex');
    await logAIJob(req.user.id, 'flashcards', inputHash, { flashcards });

    res.json({
      success: true,
      flashcards,
      count: flashcards.length,
      creditsRemaining: req.user.credits - 1
    });

  } catch (error) {
    console.error('Flashcards error:', error);
    res.status(500).json({ error: 'AI processing failed' });
  }
});

router.post('/quiz', authenticateUser, checkCredits, async (req, res) => {
  try {
    const { text, count = 5 } = req.body;
    
    if (!text || text.length < 50) {
      return res.status(400).json({ error: 'Text too short' });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    
    const prompt = `Create a ${count}-question quiz from this text. Include multiple choice and true/false questions.

Format each question as JSON:
{
  "question": "Question text?",
  "type": "multiple_choice" or "true_false",
  "options": ["A", "B", "C", "D"],
  "correct": "B",
  "explanation": "Brief explanation"
}

Return ONLY a JSON array, no other text.

Text:
${text}`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let quizText = response.text().trim();
    
    quizText = quizText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    let quiz;
    try {
      quiz = JSON.parse(quizText);
    } catch (parseError) {
      quiz = [{
        question: "Sample question from your text?",
        type: "multiple_choice",
        options: ["Option A", "Option B", "Option C", "Option D"],
        correct: "A",
        explanation: "Quiz generation in progress"
      }];
    }

    await deductCredit(req.user.id);
    
    const inputHash = require('crypto').createHash('md5').update(text.substring(0, 1000)).digest('hex');
    await logAIJob(req.user.id, 'quiz', inputHash, { quiz });

    res.json({
      success: true,
      quiz,
      count: quiz.length,
      creditsRemaining: req.user.credits - 1
    });

  } catch (error) {
    console.error('Quiz error:', error);
    res.status(500).json({ error: 'AI processing failed' });
  }
});

router.post('/explain', authenticateUser, checkCredits, async (req, res) => {
  try {
    const { text, question } = req.body;
    
    if (!text && !question) {
      return res.status(400).json({ error: 'Provide text or question' });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    
    const prompt = question 
      ? `Explain this concept to a student in simple terms: ${question}\n\nContext: ${text || 'General explanation'}`
      : `Explain this text in simple, student-friendly language:\n${text}`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const explanation = response.text();

    await deductCredit(req.user.id);
    
    const inputHash = require('crypto').createHash('md5').update((text || question).substring(0, 1000)).digest('hex');
    await logAIJob(req.user.id, 'explain', inputHash, { explanation });

    res.json({
      success: true,
      explanation,
      creditsRemaining: req.user.credits - 1
    });

  } catch (error) {
    console.error('Explain error:', error);
    res.status(500).json({ error: 'AI processing failed' });
  }
});

module.exports = router;