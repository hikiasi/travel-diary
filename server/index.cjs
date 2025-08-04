const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const pool = require('../db.cjs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../dist')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// JWT Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Routes

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const newUser = await pool.query(
      'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name',
      [email, passwordHash, name]
    );

    // Generate JWT
    const token = jwt.sign(
      { id: newUser.rows[0].id, email: newUser.rows[0].email, name: newUser.rows[0].name },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      user: {
        id: newUser.rows[0].id,
        email: newUser.rows[0].email,
        name: newUser.rows[0].name
      },
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (user.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.rows[0].password_hash);
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign(
      { 
        id: user.rows[0].id, 
        email: user.rows[0].email, 
        name: user.rows[0].name 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      user: {
        id: user.rows[0].id,
        email: user.rows[0].email,
        name: user.rows[0].name
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user profile
app.get('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const user = await pool.query(
      'SELECT id, email, name, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (user.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: user.rows[0] });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create travel
app.post('/api/travels', authenticateToken, async (req, res) => {
  try {
    const { title, description, location, cost, images, culturalSites, placesToVisit, ratings } = req.body;

    const newTravel = await pool.query(
      `INSERT INTO travels (user_id, title, description, location, cost, images, cultural_sites, places_to_visit, ratings) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
       RETURNING *`,
      [req.user.id, title, description, location, cost || 0, images || [], culturalSites || [], placesToVisit || [], ratings]
    );

    // Get user name for response
    const user = await pool.query('SELECT name FROM users WHERE id = $1', [req.user.id]);

    const travelWithUser = {
      ...newTravel.rows[0],
      userName: user.rows[0].name
    };

    res.json({ success: true, travel: travelWithUser });
  } catch (error) {
    console.error('Create travel error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all travels
app.get('/api/travels', async (req, res) => {
  try {
    const travels = await pool.query(
      `SELECT t.*, u.name as user_name 
       FROM travels t 
       JOIN users u ON t.user_id = u.id 
       ORDER BY t.created_at DESC`
    );

    const travelsWithUser = travels.rows.map(travel => ({
      ...travel,
      userName: travel.user_name,
      userId: travel.user_id
    }));

    res.json({ travels: travelsWithUser });
  } catch (error) {
    console.error('Get travels error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's travels
app.get('/api/travels/my', authenticateToken, async (req, res) => {
  try {
    const travels = await pool.query(
      `SELECT t.*, u.name as user_name 
       FROM travels t 
       JOIN users u ON t.user_id = u.id 
       WHERE t.user_id = $1 
       ORDER BY t.created_at DESC`,
      [req.user.id]
    );

    const travelsWithUser = travels.rows.map(travel => ({
      ...travel,
      userName: travel.user_name,
      userId: travel.user_id
    }));

    res.json({ travels: travelsWithUser });
  } catch (error) {
    console.error('Get user travels error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get travel by ID
app.get('/api/travels/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const travel = await pool.query(
      `SELECT t.*, u.name as user_name 
       FROM travels t 
       JOIN users u ON t.user_id = u.id 
       WHERE t.id = $1`,
      [id]
    );

    if (travel.rows.length === 0) {
      return res.status(404).json({ error: 'Travel not found' });
    }

    const travelWithUser = {
      ...travel.rows[0],
      userName: travel.rows[0].user_name,
      userId: travel.rows[0].user_id
    };

    res.json({ travel: travelWithUser });
  } catch (error) {
    console.error('Get travel error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update travel
app.put('/api/travels/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, location, cost, images, culturalSites, placesToVisit, ratings } = req.body;

    // Check if travel exists and belongs to user
    const existingTravel = await pool.query(
      'SELECT * FROM travels WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    if (existingTravel.rows.length === 0) {
      return res.status(404).json({ error: 'Travel not found or access denied' });
    }

    const updatedTravel = await pool.query(
      `UPDATE travels 
       SET title = $1, description = $2, location = $3, cost = $4, 
           images = $5, cultural_sites = $6, places_to_visit = $7, ratings = $8
       WHERE id = $9 AND user_id = $10 
       RETURNING *`,
      [title, description, location, cost || 0, images || [], culturalSites || [], placesToVisit || [], ratings, id, req.user.id]
    );

    // Get user name for response
    const user = await pool.query('SELECT name FROM users WHERE id = $1', [req.user.id]);

    const travelWithUser = {
      ...updatedTravel.rows[0],
      userName: user.rows[0].name
    };

    res.json({ success: true, travel: travelWithUser });
  } catch (error) {
    console.error('Update travel error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete travel
app.delete('/api/travels/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if travel exists and belongs to user
    const existingTravel = await pool.query(
      'SELECT * FROM travels WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    if (existingTravel.rows.length === 0) {
      return res.status(404).json({ error: 'Travel not found or access denied' });
    }

    await pool.query('DELETE FROM travels WHERE id = $1 AND user_id = $2', [id, req.user.id]);

    res.json({ success: true });
  } catch (error) {
    console.error('Delete travel error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Upload image
app.post('/api/upload-image', authenticateToken, upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Return the path to the uploaded file
    const imageUrl = `/uploads/${req.file.filename}`;
    
    res.json({ imageUrl });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Serve React app (only in production)
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 