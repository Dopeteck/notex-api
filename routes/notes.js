// routes/notes.js
// Handles: List notes, upload notes, download purchased notes

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db');
const { authenticateUser } = require('./auth');

// --------------------------
// 1. Multer setup must come first
// --------------------------
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024 // 25MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, JPG, PNG allowed'));
    }
  }
});

// --------------------------
// 2. File storage folder (Railway volume)
// --------------------------
const FILES_DIR = process.env.FILES_DIR || '/data/files';
if (!fs.existsSync(FILES_DIR)) {
  fs.mkdirSync(FILES_DIR, { recursive: true });
}

// --------------------------
// 3. Routes using `upload`
// --------------------------
router.post('/upload', authenticateUser, upload.single('file'), async (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).json({ error: 'No file uploaded' });

  const filename = `${Date.now()}-${file.originalname}`;
  const savePath = path.join(FILES_DIR, filename);

  // Write file to disk
  fs.writeFileSync(savePath, file.buffer);

  // Save file info in database
  const { title, description, subject, level, price_usd, tags } = req.body;
  const result = await db.query(
    `INSERT INTO notes (seller_id, title, description, subject, level, price_usd, savePath, tags, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
    [
      req.user.id,
      title,
      description,
      subject,
      level || 'undergraduate',
      parseFloat(price_usd),
      savePath,
      tags ? tags.split(',') : [],
      'pending'
    ]
  );
  res.json({ success: true, note: result.rows[0] });
});

// GET /api/notes - List all published notes with filters
router.get('/', async (req, res) => {
  try {
    const {
      search,
      subject,
      level,
      min_price,
      max_price,
      sort = 'created_at',
      order = 'DESC',
      page = 1,
      limit = 20
    } = req.query;

    let query = `
      SELECT n.*, u.username as seller_name,
        (SELECT AVG(rating) FROM reviews WHERE note_id = n.id) as avg_rating,
        (SELECT COUNT(*) FROM purchases WHERE note_id = n.id) as purchase_count
      FROM notes n
      JOIN users u ON n.seller_id = u.id
      WHERE n.status = 'published'
    `;
    
    const params = [];
    let paramIndex = 1;

    // Add search filter
    if (search) {
      query += ` AND (n.title ILIKE $${paramIndex} OR n.description ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Add subject filter
    if (subject) {
      query += ` AND n.subject = $${paramIndex}`;
      params.push(subject);
      paramIndex++;
    }

    // Add level filter
    if (level) {
      query += ` AND n.level = $${paramIndex}`;
      params.push(level);
      paramIndex++;
    }

    // Add price filters
    if (min_price) {
      query += ` AND n.price_usd >= $${paramIndex}`;
      params.push(min_price);
      paramIndex++;
    }

    if (max_price) {
      query += ` AND n.price_usd <= $${paramIndex}`;
      params.push(max_price);
      paramIndex++;
    }

    // Add sorting
    const validSorts = ['created_at', 'price_usd', 'purchase_count', 'avg_rating'];
    const sortField = validSorts.includes(sort) ? sort : 'created_at';
    const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    query += ` ORDER BY ${sortField} ${sortOrder}`;
    
    // Add pagination
    const offset = (page - 1) * limit;
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await db.query(query, params);

    res.json({
      success: true,
      notes: result.rows,
      page: parseInt(page),
      limit: parseInt(limit)
    });

  } catch (error) {
    console.error('List notes error:', error);
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

// GET /api/notes/:id - Get single note details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(`
      SELECT n.*, u.username as seller_name, u.id as seller_id,
        (SELECT AVG(rating) FROM reviews WHERE note_id = n.id) as avg_rating,
        (SELECT COUNT(*) FROM reviews WHERE note_id = n.id) as review_count,
        (SELECT COUNT(*) FROM purchases WHERE note_id = n.id) as purchase_count
      FROM notes n
      JOIN users u ON n.seller_id = u.id
      WHERE n.id = $1 AND n.status = 'published'
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }

    res.json({
      success: true,
      note: result.rows[0]
    });

  } catch (error) {
    console.error('Get note error:', error);
    res.status(500).json({ error: 'Failed to fetch note' });
  }
});

// POST /api/notes/upload - Upload new note for sale
router.post('/upload', authenticateUser, upload.single('file'), async (req, res) => {
  try {
    const { title, description, subject, level, price_usd, tags } = req.body;
    const file = req.file;

    // Validate required fields
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (!title || !description || !subject || !price_usd) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate price
    const price = parseFloat(price_usd);
    if (price < 0.99) {
      return res.status(400).json({ error: 'Minimum price is $0.99' });
    }
    if (price > 99.99) {
      return res.status(400).json({ error: 'Maximum price is $99.99' });
    }




    // Insert note into database
    const result = await db.query(`
      INSERT INTO notes (
        seller_id, title, description, subject, level, 
        price_usd, file_url, tags, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [
      req.user.id,
      title,
      description,
      subject,
      level || 'undergraduate',
      price,
      fileUrl,
      tags ? tags.split(',') : [],
      'pending' // Requires admin approval
    ]);

    res.json({
      success: true,
      note: result.rows[0],
      message: 'Note submitted for review. You will be notified when approved.'
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// GET /api/notes/:id/download - Generate signed download URL for purchased note
router.get('/:id/download', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user purchased this note
    const purchaseCheck = await db.query(
      'SELECT * FROM purchases WHERE note_id = $1 AND buyer_id = $2 AND status = $3',
      [id, req.user.id, 'completed']
    );

    if (purchaseCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Purchase required to download' });
    }

    // Get note file URL
    const noteResult = await db.query(
      'SELECT file_url FROM notes WHERE id = $1',
      [id]
    );

    if (noteResult.rows.length === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }

    const filePath = path.join(__dirname, '..', noteResult.rows[0].file_url);

if (!fs.existsSync(filePath)) {
  return res.status(404).json({ error: 'File not found' });
}

res.download(filePath);


    res.json({
      success: true,
      downloadUrl: signedUrl,
      expiresIn: 3600
    });

  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Download failed' });
  }
});

// GET /api/notes/seller/my-notes - Get seller's uploaded notes
router.get('/seller/my-notes', authenticateUser, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT n.*,
        (SELECT COUNT(*) FROM purchases WHERE note_id = n.id AND status = 'completed') as sales_count,
        (SELECT SUM(amount_usd - fee_usd) FROM purchases WHERE note_id = n.id AND status = 'completed') as total_earnings
      FROM notes n
      WHERE n.seller_id = $1
      ORDER BY n.created_at DESC
    `, [req.user.id]);

    res.json({
      success: true,
      notes: result.rows
    });

  } catch (error) {
    console.error('My notes error:', error);
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

module.exports = router;