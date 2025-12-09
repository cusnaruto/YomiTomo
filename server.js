const express = require('express');
const session = require('express-session');
const path = require('path');
const multer = require('multer');
const bcrypt = require('bcrypt');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));
app.use(session({
  secret: 'yomitomo-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const fs = require('fs');
    const dir = './uploads';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// Auth middleware
const requireAdmin = (req, res, next) => {
  if (!req.session.adminId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

// ===== ADMIN ROUTES =====

// Admin login
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  
  db.get('SELECT * FROM admin_users WHERE username = ?', [username], async (err, user) => {
    if (err || !user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const match = await bcrypt.compare(password, user.password_hash);
    if (match) {
      req.session.adminId = user.id;
      res.json({ success: true, message: 'Logged in successfully' });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  });
});

// Admin logout
app.post('/api/admin/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

// Check admin status
app.get('/api/admin/status', (req, res) => {
  res.json({ isAdmin: !!req.session.adminId });
});

// Create admin user (only for initial setup)
app.post('/api/admin/create', async (req, res) => {
  const { username, password } = req.body;
  
  // Check if any admin exists
  db.get('SELECT COUNT(*) as count FROM admin_users', async (err, result) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    // Only allow creation if no admins exist or if already an admin
    if (result.count > 0 && !req.session.adminId) {
      return res.status(403).json({ error: 'Admin already exists' });
    }
    
    const hash = await bcrypt.hash(password, 10);
    db.run('INSERT INTO admin_users (username, password_hash) VALUES (?, ?)', 
      [username, hash], 
      (err) => {
        if (err) {
          return res.status(500).json({ error: 'Failed to create admin' });
        }
        res.json({ success: true });
      }
    );
  });
});

// Create manga
app.post('/api/admin/manga', requireAdmin, upload.single('cover'), (req, res) => {
  const { title, description, author } = req.body;
  const coverImage = req.file ? `/uploads/${req.file.filename}` : null;
  
  db.run(
    'INSERT INTO manga (title, description, cover_image, author) VALUES (?, ?, ?, ?)',
    [title, description, coverImage, author],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to create manga' });
      }
      res.json({ id: this.lastID, title, description, coverImage, author });
    }
  );
});

// Update manga
app.put('/api/admin/manga/:id', requireAdmin, upload.single('cover'), (req, res) => {
  const { id } = req.params;
  const { title, description, author } = req.body;
  
  let query = 'UPDATE manga SET title = ?, description = ?, author = ?, updated_at = CURRENT_TIMESTAMP';
  let params = [title, description, author];
  
  if (req.file) {
    query += ', cover_image = ?';
    params.push(`/uploads/${req.file.filename}`);
  }
  
  query += ' WHERE id = ?';
  params.push(id);
  
  db.run(query, params, (err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to update manga' });
    }
    res.json({ success: true });
  });
});

// Delete manga
app.delete('/api/admin/manga/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  
  db.run('DELETE FROM manga WHERE id = ?', [id], (err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to delete manga' });
    }
    res.json({ success: true });
  });
});

// Create chapter
app.post('/api/admin/chapter', requireAdmin, upload.array('pages', 100), (req, res) => {
  const { manga_id, chapter_number, title } = req.body;
  
  db.run(
    'INSERT INTO chapters (manga_id, chapter_number, title) VALUES (?, ?, ?)',
    [manga_id, chapter_number, title],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to create chapter' });
      }
      
      const chapterId = this.lastID;
      
      // Insert pages
      if (req.files && req.files.length > 0) {
        const stmt = db.prepare('INSERT INTO chapter_pages (chapter_id, page_number, image_path) VALUES (?, ?, ?)');
        req.files.forEach((file, index) => {
          stmt.run(chapterId, index + 1, `/uploads/${file.filename}`);
        });
        stmt.finalize();
      }
      
      res.json({ id: chapterId, manga_id, chapter_number, title });
    }
  );
});

// Update chapter
app.put('/api/admin/chapter/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const { chapter_number, title } = req.body;
  
  db.run(
    'UPDATE chapters SET chapter_number = ?, title = ? WHERE id = ?',
    [chapter_number, title, id],
    (err) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to update chapter' });
      }
      res.json({ success: true });
    }
  );
});

// Delete chapter
app.delete('/api/admin/chapter/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  
  db.run('DELETE FROM chapters WHERE id = ?', [id], (err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to delete chapter' });
    }
    res.json({ success: true });
  });
});

// ===== USER ROUTES =====

// Get all manga
app.get('/api/manga', (req, res) => {
  db.all('SELECT * FROM manga ORDER BY updated_at DESC', (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch manga' });
    }
    res.json(rows);
  });
});

// Get single manga with chapters
app.get('/api/manga/:id', (req, res) => {
  const { id } = req.params;
  
  db.get('SELECT * FROM manga WHERE id = ?', [id], (err, manga) => {
    if (err || !manga) {
      return res.status(404).json({ error: 'Manga not found' });
    }
    
    db.all(
      'SELECT * FROM chapters WHERE manga_id = ? ORDER BY chapter_number',
      [id],
      (err, chapters) => {
        if (err) {
          return res.status(500).json({ error: 'Failed to fetch chapters' });
        }
        res.json({ ...manga, chapters });
      }
    );
  });
});

// Get chapter with pages and comments
app.get('/api/chapter/:id', (req, res) => {
  const { id } = req.params;
  
  db.get('SELECT c.*, m.title as manga_title, m.id as manga_id FROM chapters c JOIN manga m ON c.manga_id = m.id WHERE c.id = ?', 
    [id], 
    (err, chapter) => {
      if (err || !chapter) {
        return res.status(404).json({ error: 'Chapter not found' });
      }
      
      db.all(
        'SELECT * FROM chapter_pages WHERE chapter_id = ? ORDER BY page_number',
        [id],
        (err, pages) => {
          if (err) {
            return res.status(500).json({ error: 'Failed to fetch pages' });
          }
          
          db.all(
            'SELECT * FROM comments WHERE chapter_id = ? ORDER BY created_at DESC',
            [id],
            (err, comments) => {
              if (err) {
                return res.status(500).json({ error: 'Failed to fetch comments' });
              }
              res.json({ ...chapter, pages, comments });
            }
          );
        }
      );
    }
  );
});

// Post comment
app.post('/api/comment', (req, res) => {
  const { chapter_id, username, comment } = req.body;
  
  if (!username || !comment) {
    return res.status(400).json({ error: 'Username and comment are required' });
  }
  
  db.run(
    'INSERT INTO comments (chapter_id, username, comment) VALUES (?, ?, ?)',
    [chapter_id, username, comment],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to post comment' });
      }
      res.json({ id: this.lastID, chapter_id, username, comment, created_at: new Date().toISOString() });
    }
  );
});

// Serve HTML pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/manga/:id', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'manga.html'));
});

app.get('/read/:id', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'reader.html'));
});

app.listen(PORT, () => {
  console.log(`YomiTomo server running on http://localhost:${PORT}`);
});
