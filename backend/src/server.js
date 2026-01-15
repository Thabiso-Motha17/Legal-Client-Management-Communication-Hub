import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from './db.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ==================== MIDDLEWARE ====================
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// ==================== AUTH ROUTES ====================
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password, full_name, phone, role, law_firm_id } = req.body;
    
    // Check if user exists
    const existingUser = await pool.query(
      'SELECT * FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );
    
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash, full_name, phone, role, law_firm_id) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING id, username, email, full_name, role, law_firm_id, created_at`,
      [username, email, hashedPassword, full_name, phone, role, law_firm_id]
    );

    const user = result.rows[0];
    
    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, lawFirmId: user.law_firm_id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      token,
      user
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND is_active = true',
      [email]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = result.rows[0];
    
    // Check password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    await pool.query(
      'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, lawFirmId: user.law_firm_id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Remove password from response
    const { password_hash, ...userWithoutPassword } = user;

    res.json({
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, username, email, full_name, role, law_firm_id, phone, is_active, last_login_at, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ user: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== LAW FIRMS ====================
app.get('/api/law-firms', authenticateToken, async (req, res) => {
  try {
    let query = 'SELECT * FROM law_firms';
    const params = [];

    // If not system-admin, only show their law firm
    if (req.user.role !== 'system-admin' && req.user.lawFirmId) {
      query += ' WHERE id = $1';
      params.push(req.user.lawFirmId);
    }

    query += ' ORDER BY name';
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/law-firms/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check access
    if (req.user.role !== 'system-admin' && req.user.lawFirmId != id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await pool.query('SELECT * FROM law_firms WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Law firm not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/law-firms', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'system-admin') {
      return res.status(403).json({ error: 'System admin access required' });
    }

    const { 
      name, email, phone, address, city, state, country, 
      website, logo_url, description 
    } = req.body;

    const result = await pool.query(
      `INSERT INTO law_firms (
        name, email, phone, address, city, state, country, 
        website, logo_url, description
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
       RETURNING *`,
      [name, email, phone, address, city, state, country, website, logo_url, description]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== USERS ====================
app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    let query = `
      SELECT id, username, email, full_name, role, law_firm_id, 
             phone, is_active, last_login_at, created_at 
      FROM users 
    `;
    const params = [];

    // Admin/Associate can only see users from their law firm
    if (req.user.role === 'admin' || req.user.role === 'associate') {
      query += ' WHERE law_firm_id = $1';
      params.push(req.user.lawFirmId);
    } else if (req.user.role === 'client') {
      // Clients can only see themselves
      query += ' WHERE id = $1';
      params.push(req.user.id);
    }
    // System-admin can see all

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/users/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check access
    if (req.user.role !== 'system-admin' && req.user.id != id) {
      const userCheck = await pool.query(
        'SELECT law_firm_id FROM users WHERE id = $1',
        [id]
      );
      if (userCheck.rows[0]?.law_firm_id !== req.user.lawFirmId) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const result = await pool.query(
      `SELECT id, username, email, full_name, role, law_firm_id, 
              phone, is_active, last_login_at, created_at 
       FROM users WHERE id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== CASES ====================
app.get('/api/cases', authenticateToken, async (req, res) => {
  try {
    let query = `
      SELECT c.*, 
        u.full_name as assigned_to_name,
        u2.full_name as added_by_name
      FROM cases c
      LEFT JOIN users u ON c.assigned_to_user_id = u.id
      LEFT JOIN users u2 ON c.added_by_user_id = u2.id
      WHERE 1=1
    `;
    const params = [];

    // Filter by law firm
    if (req.user.role !== 'system-admin') {
      if (req.user.role === 'client') {
        // Clients see cases with their name
        query += ' AND c.client_name = (SELECT full_name FROM users WHERE id = $1)';
        params.push(req.user.id);
      } else {
        // Admin/Associate see their law firm's cases
        query += ' AND c.law_firm_id = $1';
        params.push(req.user.lawFirmId);
      }
    }

    // Add filters from query params
    if (req.query.status) {
      params.push(req.query.status);
      query += ` AND c.status = $${params.length}`;
    }
    if (req.query.priority) {
      params.push(req.query.priority);
      query += ` AND c.priority = $${params.length}`;
    }
    if (req.query.search) {
      params.push(`%${req.query.search}%`);
      query += ` AND (c.title ILIKE $${params.length} OR c.client_name ILIKE $${params.length} OR c.case_number ILIKE $${params.length})`;
    }

    query += ' ORDER BY c.date_opened DESC';
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/cases/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`
      SELECT c.*, 
        u.full_name as assigned_to_name,
        u.email as assigned_to_email,
        u2.full_name as added_by_name,
        lf.name as law_firm_name
      FROM cases c
      LEFT JOIN users u ON c.assigned_to_user_id = u.id
      LEFT JOIN users u2 ON c.added_by_user_id = u2.id
      LEFT JOIN law_firms lf ON c.law_firm_id = lf.id
      WHERE c.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Case not found' });
    }

    const caseData = result.rows[0];
    
    // Check access
    if (req.user.role === 'client' && caseData.client_name !== req.user.full_name) {
      return res.status(403).json({ error: 'Access denied' });
    }
    if ((req.user.role === 'admin' || req.user.role === 'associate') && 
        caseData.law_firm_id !== req.user.lawFirmId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Get documents for this case
    const documents = await pool.query(
      `SELECT d.*, u.full_name as uploaded_by_name 
       FROM documents d 
       LEFT JOIN users u ON d.uploaded_by_user_id = u.id 
       WHERE d.case_id = $1 
       ORDER BY d.uploaded_at DESC`,
      [id]
    );

    // Get notes for this case
    const notes = await pool.query(
      `SELECT n.*, u.full_name as user_name 
       FROM notes n 
       LEFT JOIN users u ON n.user_id = u.id 
       WHERE n.case_id = $1 AND (n.is_private = false OR n.user_id = $2)
       ORDER BY n.created_at DESC`,
      [id, req.user.id]
    );

    res.json({
      ...caseData,
      documents: documents.rows,
      notes: notes.rows
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/cases', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'associate') {
      return res.status(403).json({ error: 'Admin/Associate access required' });
    }

    const { 
      file_number, case_number, title, client_name, case_type,
      status = 'Active', priority = 'medium', 
      assigned_to_user_id, deadline, description 
    } = req.body;

    // Check if file number exists
    const existingFile = await pool.query(
      'SELECT id FROM cases WHERE file_number = $1',
      [file_number]
    );
    if (existingFile.rows.length > 0) {
      return res.status(400).json({ error: 'File number already exists' });
    }

    // Check if case number exists
    const existingCase = await pool.query(
      'SELECT id FROM cases WHERE case_number = $1',
      [case_number]
    );
    if (existingCase.rows.length > 0) {
      return res.status(400).json({ error: 'Case number already exists' });
    }

    const result = await pool.query(
      `INSERT INTO cases (
        file_number, case_number, title, client_name, case_type, status, priority,
        law_firm_id, assigned_to_user_id, added_by_user_id, deadline, description
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) 
       RETURNING *`,
      [
        file_number, case_number, title, client_name, case_type, status, priority,
        req.user.lawFirmId, assigned_to_user_id, req.user.id, deadline, description
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/cases/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check access
    const caseCheck = await pool.query(
      'SELECT law_firm_id FROM cases WHERE id = $1',
      [id]
    );
    if (caseCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Case not found' });
    }
    if (caseCheck.rows[0].law_firm_id !== req.user.lawFirmId && req.user.role !== 'system-admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Build update query
    const keys = Object.keys(updateData);
    if (keys.length === 0) {
      return res.status(400).json({ error: 'No update data provided' });
    }

    const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(', ');
    const values = [...Object.values(updateData), id];

    const result = await pool.query(
      `UPDATE cases 
       SET ${setClause}, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $${keys.length + 1} 
       RETURNING *`,
      values
    );

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== CLIENTS ====================
app.get('/api/clients', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'associate') {
      return res.status(403).json({ error: 'Access denied' });
    }

    let query = `
      SELECT c.*, 
        u.full_name as assigned_associate_name,
        u.email as assigned_associate_email
      FROM clients c
      LEFT JOIN users u ON c.assigned_associate_id = u.id
      WHERE u.law_firm_id = $1
    `;
    const params = [req.user.lawFirmId];

    if (req.query.status) {
      params.push(req.query.status);
      query += ` AND c.status = $${params.length}`;
    }
    if (req.query.search) {
      params.push(`%${req.query.search}%`);
      query += ` AND (c.name ILIKE $${params.length} OR c.email ILIKE $${params.length} OR c.company ILIKE $${params.length})`;
    }

    query += ' ORDER BY c.joined_date DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/clients', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'associate') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { name, email, phone, company, client_type, assigned_associate_id } = req.body;

    // Check if client exists
    const existingClient = await pool.query(
      'SELECT id FROM clients WHERE email = $1',
      [email]
    );
    if (existingClient.rows.length > 0) {
      return res.status(400).json({ error: 'Client with this email already exists' });
    }

    const result = await pool.query(
      `INSERT INTO clients (name, email, phone, company, client_type, assigned_associate_id, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'active') 
       RETURNING *`,
      [name, email, phone, company, client_type, assigned_associate_id]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== DOCUMENTS ====================
app.get('/api/documents', authenticateToken, async (req, res) => {
  try {
    let query = `
      SELECT d.*, 
        u.full_name as uploaded_by_name,
        c.title as case_title,
        c.file_number
      FROM documents d
      LEFT JOIN users u ON d.uploaded_by_user_id = u.id
      LEFT JOIN cases c ON d.case_id = c.id
      WHERE 1=1
    `;
    const params = [];

    // Filter by law firm
    if (req.user.role !== 'system-admin') {
      query += ' AND d.law_firm_id = $1';
      params.push(req.user.lawFirmId);
    }

    if (req.query.case_id) {
      params.push(req.query.case_id);
      query += ` AND d.case_id = $${params.length}`;
    }
    if (req.query.status) {
      params.push(req.query.status);
      query += ` AND d.status = $${params.length}`;
    }

    query += ' ORDER BY d.uploaded_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/documents', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'associate') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { 
      name, case_id, document_type, description, 
      version = 1, status = 'Draft' 
    } = req.body;

    // For file upload, you'd typically use multer, but here's a simple base64 approach
    // In production, use multer for file handling
    let fileBuffer = null;
    if (req.body.file_data) {
      fileBuffer = Buffer.from(req.body.file_data, 'base64');
    }

    const result = await pool.query(
      `INSERT INTO documents (
        name, case_id, document_type, description, version, status,
        law_firm_id, uploaded_by_user_id, file_name, file_path, file_size, file_type, mime_type
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) 
       RETURNING *`,
      [
        name, case_id, document_type, description, version, status,
        req.user.lawFirmId, req.user.id,
        req.body.file_name || name,
        req.body.file_path || '/uploads/' + Date.now() + '_' + name,
        req.body.file_size || (fileBuffer ? fileBuffer.length : 0),
        req.body.file_type || 'pdf',
        req.body.mime_type || 'application/pdf'
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== NOTES ====================
app.get('/api/notes', authenticateToken, async (req, res) => {
  try {
    let query = `
      SELECT n.*, 
        c.title as case_title,
        c.file_number
      FROM notes n
      LEFT JOIN cases c ON n.case_id = c.id
      WHERE n.user_id = $1
    `;
    const params = [req.user.id];

    if (req.query.case_id) {
      params.push(req.query.case_id);
      query += ` AND n.case_id = $${params.length}`;
    }
    if (req.query.is_archived !== undefined) {
      params.push(req.query.is_archived === 'true');
      query += ` AND n.is_archived = $${params.length}`;
    }
    if (req.query.is_pinned !== undefined) {
      params.push(req.query.is_pinned === 'true');
      query += ` AND n.is_pinned = $${params.length}`;
    }
    if (req.query.search) {
      params.push(`%${req.query.search}%`);
      query += ` AND (n.title ILIKE $${params.length} OR n.content ILIKE $${params.length})`;
    }

    query += ' ORDER BY n.is_pinned DESC, n.created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/notes', authenticateToken, async (req, res) => {
  try {
    const { title, content, case_id, category, tags, is_private = false } = req.body;

    const wordCount = content.trim().split(/\s+/).length;
    const characterCount = content.length;

    const result = await pool.query(
      `INSERT INTO notes (
        title, content, user_id, case_id, category, tags, 
        is_private, word_count, character_count
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
       RETURNING *`,
      [
        title, content, req.user.id, case_id || null,
        category || 'Uncategorized',
        tags ? JSON.stringify(Array.isArray(tags) ? tags : [tags]) : '[]',
        is_private, wordCount, characterCount
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== STATS ====================
app.get('/api/stats/law-firm/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check access
    if (req.user.role !== 'system-admin' && req.user.lawFirmId != id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await pool.query(
      `SELECT 
        member_count,
        case_count,
        storage_used_mb,
        (SELECT COUNT(*) FROM cases WHERE law_firm_id = $1 AND status = 'Active') as active_cases,
        (SELECT COUNT(*) FROM cases WHERE law_firm_id = $1 AND status = 'Closed') as closed_cases,
        (SELECT COUNT(*) FROM cases WHERE law_firm_id = $1 AND priority = 'high') as high_priority_cases,
        (SELECT COUNT(*) FROM users WHERE law_firm_id = $1 AND role = 'associate') as associate_count,
        (SELECT COUNT(*) FROM users WHERE law_firm_id = $1 AND role = 'admin') as admin_count
       FROM law_firms WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Law firm not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== HEALTH CHECK ====================
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      database: 'Connected'
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'ERROR', 
      database: 'Connection failed',
      error: error.message 
    });
  }
});

// ==================== ERROR HANDLING ====================
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// ==================== START SERVER ====================
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
}); 