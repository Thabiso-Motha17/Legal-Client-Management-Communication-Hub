import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from './db.js';
import dotenv from 'dotenv';
// At the top of your file
import { Buffer } from 'buffer';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ==================== MIDDLEWARE ====================
const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    console.log('Auth header received:', authHeader ? 'Yes' : 'No');
    console.log('Token extracted:', token ? 'Yes (starts with ' + token.substring(0, 20) + '...)' : 'No');

    if (!token) {
      console.error('No token provided');
      return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, decoded) => {
      if (err) {
        console.error('JWT verification error:', err.message);
        return res.status(403).json({ error: 'Invalid or expired token' });
      }

      // Log the decoded token for debugging
      console.log('Decoded token:', decoded);

      // Ensure the decoded token has the required fields
      if (!decoded || !decoded.id || !decoded.role) {
        console.error('Token missing required fields:', decoded);
        return res.status(403).json({ error: 'Invalid token structure' });
      }

      // Attach user info to request with proper field names
      req.user = {
        id: decoded.id,
        userId: decoded.id, // Add userId alias for compatibility
        role: decoded.role,
        lawFirmId: decoded.lawFirmId || decoded.law_firm_id || null,
        email: decoded.email || '',
        full_name: decoded.full_name || '',
        // Add any other fields you need
      };

      console.log(`Authenticated user: ID=${req.user.id}, Role=${req.user.role}, LawFirmID=${req.user.lawFirmId}`);
      next();
    });
  } catch (error) {
    console.error('Authentication middleware error:', error);
    return res.status(500).json({ error: 'Authentication failed' });
  }
};

// Helper function for dynamic updates
const buildUpdateQuery = (table, id, data, allowedColumns) => {
  const keys = Object.keys(data).filter(key => allowedColumns.includes(key));
  if (keys.length === 0) {
    throw new Error('No valid update data provided');
  }

  const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(', ');
  const values = keys.map(key => data[key]);
  values.push(id);

  return {
    query: `UPDATE ${table} SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = $${keys.length + 1} RETURNING *`,
    values
  };
};

// ==================== AUTH ROUTES ====================
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password, full_name, phone, role, law_firm_id, permissions } = req.body;
    
    console.log('Registration attempt:', { username, email, role, law_firm_id, permissions });
    
    // Validate input
    if (!username || !email || !password || !full_name || !role) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate role
    if (!['admin', 'associate', 'client'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Validate permissions
    const validPermissions = ['full access', 'limited access', 'no access'];
    if (permissions && !validPermissions.includes(permissions)) {
      return res.status(400).json({ error: 'Invalid permissions value' });
    }

    // Check if user exists
    const existingUser = await pool.query(
      'SELECT * FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );
    
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // 🔴 FIXED: Only associates must have law_firm_id
    if (role === 'associate') {
      if (!law_firm_id) {
        return res.status(400).json({ error: 'Associates must have a law firm' });
      }
      // Verify law firm exists
      const lawFirmCheck = await pool.query(
        'SELECT id FROM law_firms WHERE id = $1',
        [law_firm_id]
      );
      if (lawFirmCheck.rows.length === 0) {
        return res.status(400).json({ error: 'Invalid law firm' });
      }
    } else {
      // 🔴 FIXED: Admin and client cannot have law_firm_id
      if (law_firm_id) {
        return res.status(400).json({ error: `${role}s cannot be assigned to a law firm` });
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user - Only set law_firm_id for associates
    const result = await pool.query(
      `INSERT INTO users (username, email, password, full_name, phone, role, law_firm_id, permissions) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       RETURNING id, username, email, full_name, role, law_firm_id, permissions, created_at`,
      [
        username, 
        email, 
        hashedPassword, 
        full_name, 
        phone, 
        role, 
        role === 'associate' ? law_firm_id : null, // 🔴 ONLY associates get law_firm_id
        permissions
      ]
    );

    const user = result.rows[0];
    
    // Generate token
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role, 
        lawFirmId: user.law_firm_id,
        permissions: user.permissions
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      token,
      user
    });
  } catch (error) {
    console.error('Registration error:', error);
    console.error('Error details:', error.stack);
    
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Email or username already exists' });
    } else if (error.code === '23503') {
      if (error.constraint === 'users_law_firm_id_fkey') {
        return res.status(400).json({ error: 'Invalid law firm' });
      }
      return res.status(400).json({ error: 'Invalid data provided' });
    } else if (error.code === '23514') {
      return res.status(400).json({ error: 'Invalid data provided' });
    } else if (error.code === '22P02') {
      return res.status(400).json({ error: 'Invalid input data format' });
    }
    
    res.status(500).json({ error: error.message });
  }
});
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    
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
    const validPassword = await bcrypt.compare(password, user.password);
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
      { 
        id: user.id, 
        email: user.email, 
        role: user.role, 
        lawFirmId: user.law_firm_id 
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Remove password from response
    const { password: userPassword, ...userWithoutPassword } = user;

    // If user is a client, get client info
    let clientInfo = null;
    if (user.role === 'client') {
      const clientResult = await pool.query(
        'SELECT * FROM clients WHERE user_account_id = $1',
        [user.id]
      );
      clientInfo = clientResult.rows[0];
    }

    res.json({
      token,
      user: userWithoutPassword,
      clientInfo
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, username, email, full_name, role, law_firm_id, 
              phone, is_active, last_login_at, created_at, updated_at, permissions
       FROM users WHERE id = $1`,
      [req.user.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = result.rows[0];
    
    // If user is a client, get client info
    let clientInfo = null;
    if (user.role === 'client') {
      const clientResult = await pool.query(
        'SELECT * FROM clients WHERE user_account_id = $1',
        [req.user.id]
      );
      clientInfo = clientResult.rows[0];
    }
    
    res.json({ 
      user,
      clientInfo 
    });
  } catch (error) {
    console.error('Auth me error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== LAW FIRMS ====================
app.get('/api/law-firms', authenticateToken, async (req, res) => {
  try {
    let query = 'SELECT * FROM law_firms';
    const params = [];

    // If not admin, only show their law firm
    if (req.user.role !== 'admin' && req.user.lawFirmId) {
      query += ' WHERE id = $1';
      params.push(req.user.lawFirmId);
    }

    query += ' ORDER BY name';
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Law firms error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/law-firms/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check access
    if (req.user.role !== 'admin' && req.user.lawFirmId != id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await pool.query('SELECT * FROM law_firms WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Law firm not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Law firm by id error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/law-firms', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { 
      name, email, phone, address, city, country, 
      logo_url, description 
    } = req.body;

    // Validate required fields
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    const result = await pool.query(
      `INSERT INTO law_firms (
        name, email, phone, address, city, country, 
        logo_url, description
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       RETURNING *`,
      [name, email, phone, address, city, country, logo_url, description]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create law firm error:', error);
    
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Law firm name already exists' });
    }
    
    res.status(500).json({ error: error.message });
  }
});

// ==================== DELETE LAW FIRM ====================
app.delete('/api/law-firms/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Only admin can delete law firms
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Check if law firm exists
    const lawFirmCheck = await pool.query(
      'SELECT * FROM law_firms WHERE id = $1',
      [id]
    );

    if (lawFirmCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Law firm not found' });
    }

    // Check if there are associated users, clients, or cases before deleting
    const hasUsers = await pool.query(
      'SELECT id FROM users WHERE law_firm_id = $1 LIMIT 1',
      [id]
    );
    
    const hasClients = await pool.query(
      'SELECT id FROM clients WHERE law_firm_id = $1 LIMIT 1',
      [id]
    );
    
    const hasCases = await pool.query(
      'SELECT id FROM cases WHERE law_firm_id = $1 LIMIT 1',
      [id]
    );

    if (hasUsers.rows.length > 0 || hasClients.rows.length > 0 || hasCases.rows.length > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete law firm. It has associated users, clients, or cases. Remove them first.' 
      });
    }

    // Perform the deletion
    const deleteResult = await pool.query(
      'DELETE FROM law_firms WHERE id = $1 RETURNING id, name',
      [id]
    );

    res.json({ 
      message: 'Law firm deleted successfully',
      lawFirm: {
        id: deleteResult.rows[0].id,
        name: deleteResult.rows[0].name
      }
    });
  } catch (error) {
    console.error('Delete law firm error:', error);
    
    // Handle foreign key constraint violations
    if (error.code === '23503') {
      return res.status(400).json({ 
        error: 'Cannot delete law firm: It is referenced by other records' 
      });
    }
    
    res.status(500).json({ error: error.message });
  }
});

// ==================== USERS ====================
app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    let query = `
      SELECT id, username, email, full_name, role, law_firm_id, 
             phone, is_active, last_login_at, created_at, updated_at, permissions
      FROM users 
      WHERE 1=1
    `;
    const params = [];

    // Admin/Associate can only see users from their law firm
    if (req.user.role === 'admin' || req.user.role === 'associate') {
      query += ' AND law_firm_id = $1';
      params.push(req.user.lawFirmId);
    } else if (req.user.role === 'client') {
      // Clients can only see themselves
      query += ' AND id = $1';
      params.push(req.user.id);
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);
    
    // For each user, if they're a client, get their client info
    const usersWithClientInfo = await Promise.all(result.rows.map(async (user) => {
      if (user.role === 'client') {
        const clientResult = await pool.query(
          'SELECT id, name, email, phone, company, client_type, status FROM clients WHERE user_account_id = $1',
          [user.id]
        );
        return { ...user, clientInfo: clientResult.rows[0] };
      }
      return user;
    }));

    res.json(usersWithClientInfo);
  } catch (error) {
    console.error('Users error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/users/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check access
    if (req.user.role !== 'associate' && req.user.id != id) {
      const userCheck = await pool.query(
        'SELECT law_firm_id FROM users WHERE id = $1',
        [id]
      );
      if (userCheck.rows.length === 0 || userCheck.rows[0].law_firm_id !== req.user.lawFirmId) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const result = await pool.query(
      `SELECT id, username, email, full_name, role, law_firm_id, 
              phone, is_active, last_login_at, created_at, updated_at 
       FROM users WHERE id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = result.rows[0];
    
    // If user is a client, get client info
    let clientInfo = null;
    if (user.role === 'client') {
      const clientResult = await pool.query(
        'SELECT * FROM clients WHERE user_account_id = $1',
        [user.id]
      );
      clientInfo = clientResult.rows[0];
    }
    
    res.json({ ...user, clientInfo });
  } catch (error) {
    console.error('User by id error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update user endpoint
app.put('/api/users/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check access
    if (req.user.role !== 'admin' && req.user.id != id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Define allowed columns for update
    const allowedColumns = ['full_name', 'phone', 'is_active'];
    // Admins can update more fields
    if (req.user.role === 'admin') {
      allowedColumns.push('role', 'law_firm_id', 'permissions');
    }

    const { query, values } = buildUpdateQuery('users', id, updateData, allowedColumns);
    const result = await pool.query(query, values);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== DELETE USER ====================
app.delete('/api/users/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Users can only delete themselves unless they're admin
    if (req.user.role !== 'admin' && req.user.id != id) {
      return res.status(403).json({ error: 'You can only delete your own account' });
    }

    // Admin cannot delete themselves via this endpoint (they should use a different method)
    if (req.user.role === 'admin' && req.user.id == id) {
      return res.status(400).json({ error: 'Admins cannot delete their own account via this endpoint' });
    }

    // Check if user exists
    const userCheck = await pool.query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );

    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userCheck.rows[0];

    // For non-admin users, check if they belong to the same law firm
    if (req.user.role !== 'admin' && user.law_firm_id !== req.user.lawFirmId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // For admins deleting users, check if user belongs to their law firm
    if (req.user.role === 'admin' && user.law_firm_id !== req.user.lawFirmId) {
      return res.status(403).json({ error: 'Cannot delete user from another law firm' });
    }

    // Check if user is a client and has associated client records
    if (user.role === 'client') {
      const clientCheck = await pool.query(
        'SELECT id FROM clients WHERE user_account_id = $1',
        [id]
      );
      if (clientCheck.rows.length > 0) {
        return res.status(400).json({ 
          error: 'Cannot delete user. Associated client record exists. Delete the client record first.' 
        });
      }
    }

    // Check if user has created cases, documents, notes, or invoices
    const hasCases = await pool.query(
      'SELECT id FROM cases WHERE added_by_user_id = $1 OR assigned_to_user_id = $1 LIMIT 1',
      [id]
    );
    
    const hasDocuments = await pool.query(
      'SELECT id FROM documents WHERE uploaded_by_user_id = $1 OR reviewer_user_id = $1 LIMIT 1',
      [id]
    );
    
    const hasNotes = await pool.query(
      'SELECT id FROM notes WHERE user_id = $1 LIMIT 1',
      [id]
    );
    
    const hasInvoices = await pool.query(
      'SELECT id FROM invoices WHERE created_by_user_id = $1 OR assigned_to_user_id = $1 LIMIT 1',
      [id]
    );

    // For admins/associates, we might want to handle reassignment instead of blocking
    if (hasCases.rows.length > 0 || hasDocuments.rows.length > 0 || 
        hasInvoices.rows.length > 0 || (user.role !== 'client' && hasNotes.rows.length > 0)) {
      return res.status(400).json({ 
        error: 'Cannot delete user. User has created or is assigned to cases, documents, notes, or invoices. Reassign them first.' 
      });
    }

    // Perform the deletion
    const deleteResult = await pool.query(
      'DELETE FROM users WHERE id = $1 RETURNING id, username, email, full_name',
      [id]
    );

    res.json({ 
      message: 'User deleted successfully',
      user: {
        id: deleteResult.rows[0].id,
        username: deleteResult.rows[0].username,
        email: deleteResult.rows[0].email,
        full_name: deleteResult.rows[0].full_name
      }
    });
  } catch (error) {
    console.error('Delete user error:', error);
    
    if (error.code === '23503') {
      return res.status(400).json({ 
        error: 'Cannot delete user: User is referenced by other records' 
      });
    }
    
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
        u.email as assigned_associate_email,
        u2.username as user_account_username,
        u2.email as user_account_email
      FROM clients c
      LEFT JOIN users u ON c.assigned_associate_id = u.id
      LEFT JOIN users u2 ON c.user_account_id = u2.id
      WHERE c.law_firm_id = $1
    `;
    const params = [req.user.lawFirmId];

    // ADD THIS: Filter by assigned associate if requested
    if (req.query.assigned_to) {
      params.push(req.query.assigned_to);
      query += ` AND c.assigned_associate_id = $${params.length}`;
    }

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
    console.error('Clients error:', error);
    res.status(500).json({ error: error.message });
  }
});
app.get('/api/clients/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      `SELECT c.*, 
        u.full_name as assigned_associate_name,
        u.email as assigned_associate_email,
        u2.username as user_account_username,
        u2.email as user_account_email
       FROM clients c
       LEFT JOIN users u ON c.assigned_associate_id = u.id
       LEFT JOIN users u2 ON c.user_account_id = u2.id
       WHERE c.id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }
    
    const client = result.rows[0];
    
    // Check access
    if (req.user.role === 'client' && client.user_account_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    if ((req.user.role === 'admin' || req.user.role === 'associate') && 
        client.law_firm_id !== req.user.lawFirmId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    res.json(client);
  } catch (error) {
    console.error('Client by id error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/clients', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'associate') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { 
      name, email, phone, company, client_type, 
      assigned_associate_id, user_account_id 
    } = req.body;

    // Validate required fields
    if (!name || !email || !client_type || !assigned_associate_id) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if client exists
    const existingClient = await pool.query(
      'SELECT id FROM clients WHERE email = $1',
      [email]
    );
    if (existingClient.rows.length > 0) {
      return res.status(400).json({ error: 'Client with this email already exists' });
    }

    // Check if assigned associate belongs to same law firm
    const associateCheck = await pool.query(
      'SELECT law_firm_id FROM users WHERE id = $1 AND role IN ($2, $3)',
      [assigned_associate_id, 'admin', 'associate']
    );
    
    if (associateCheck.rows.length === 0 || associateCheck.rows[0].law_firm_id !== req.user.lawFirmId) {
      return res.status(400).json({ error: 'Invalid assigned associate' });
    }

    // If user_account_id is provided, verify it's a client user
    if (user_account_id) {
      const userCheck = await pool.query(
        'SELECT role, law_firm_id FROM users WHERE id = $1',
        [user_account_id]
      );
      if (userCheck.rows.length === 0 || userCheck.rows[0].role !== 'client') {
        return res.status(400).json({ error: 'Invalid user account for client' });
      }
    }

    const result = await pool.query(
      `INSERT INTO clients (
        name, email, phone, company, client_type, 
        assigned_associate_id, user_account_id, law_firm_id, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active') 
       RETURNING *`,
      [
        name, email, phone, company, client_type, 
        assigned_associate_id, user_account_id || null, req.user.lawFirmId
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create client error:', error);
    
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Client email already exists' });
    }
    
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/clients/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check access
    const clientCheck = await pool.query(
      'SELECT law_firm_id FROM clients WHERE id = $1',
      [id]
    );
    if (clientCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }
    if (clientCheck.rows[0].law_firm_id !== req.user.lawFirmId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Define allowed columns for update
    const allowedColumns = ['name', 'email', 'phone', 'company', 'client_type', 'assigned_associate_id', 'user_account_id', 'status'];

    const { query, values } = buildUpdateQuery('clients', id, updateData, allowedColumns);
    const result = await pool.query(query, values);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update client error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== DELETE CLIENT ====================
app.delete('/api/clients/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Only admin/associate can delete clients
    if (req.user.role !== 'admin' && req.user.role !== 'associate') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if client exists
    const clientCheck = await pool.query(
      'SELECT * FROM clients WHERE id = $1',
      [id]
    );

    if (clientCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    const client = clientCheck.rows[0];

    // Check if client belongs to user's law firm
    if (client.law_firm_id !== req.user.lawFirmId) {
      return res.status(403).json({ error: 'Cannot delete client from another law firm' });
    }

    // Check if client has associated cases
    const hasCases = await pool.query(
      'SELECT id FROM cases WHERE client_id = $1 LIMIT 1',
      [id]
    );
    
    // Check if client has associated invoices
    const hasInvoices = await pool.query(
      'SELECT id FROM invoices WHERE client_id = $1 LIMIT 1',
      [id]
    );

    if (hasCases.rows.length > 0 || hasInvoices.rows.length > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete client. Client has associated cases or invoices. Delete them first.' 
      });
    }

    // If client has a user account, we should handle it carefully
    if (client.user_account_id) {
      // Option 1: Delete the user account too
      // Option 2: Just remove the link (set user_account_id to null)
      // We'll go with Option 2 for safety
      await pool.query(
        'UPDATE clients SET user_account_id = NULL WHERE id = $1',
        [id]
      );
    }

    // Perform the deletion
    const deleteResult = await pool.query(
      'DELETE FROM clients WHERE id = $1 RETURNING id, name, email',
      [id]
    );

    res.json({ 
      message: 'Client deleted successfully',
      client: {
        id: deleteResult.rows[0].id,
        name: deleteResult.rows[0].name,
        email: deleteResult.rows[0].email
      }
    });
  } catch (error) {
    console.error('Delete client error:', error);
    
    if (error.code === '23503') {
      return res.status(400).json({ 
        error: 'Cannot delete client: Client is referenced by other records' 
      });
    }
    
    res.status(500).json({ error: error.message });
  }
});

// ==================== CASES ====================
app.get('/api/cases', authenticateToken, async (req, res) => {
  try {
    let query = `
      SELECT c.*, 
        cl.name as client_name,
        cl.email as client_email,
        u.full_name as assigned_to_name,
        u2.full_name as added_by_name
      FROM cases c
      LEFT JOIN clients cl ON c.client_id = cl.id
      LEFT JOIN users u ON c.assigned_to_user_id = u.id
      LEFT JOIN users u2 ON c.added_by_user_id = u2.id
      WHERE 1=1
    `;
    const params = [];

    // Filter by law firm
    if (req.user.role !== 'admin') {
      if (req.user.role === 'client') {
        // Clients see only their cases
        query += ' AND c.client_id IN (SELECT id FROM clients WHERE user_account_id = $1)';
        params.push(req.user.id);
      } else {
        // Associate sees their law firm's cases
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
      query += ` AND (c.title ILIKE $${params.length} OR cl.name ILIKE $${params.length} OR c.case_number ILIKE $${params.length})`;
    }

    query += ' ORDER BY c.date_opened DESC';
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Cases error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/cases/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`
      SELECT c.*, 
        cl.name as client_name,
        cl.email as client_email,
        cl.phone as client_phone,
        cl.company as client_company,
        u.full_name as assigned_to_name,
        u.email as assigned_to_email,
        u2.full_name as added_by_name,
        lf.name as law_firm_name
      FROM cases c
      LEFT JOIN clients cl ON c.client_id = cl.id
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
    if (req.user.role === 'client') {
      const clientCheck = await pool.query(
        'SELECT id FROM clients WHERE user_account_id = $1 AND id = $2',
        [req.user.id, caseData.client_id]
      );
      if (clientCheck.rows.length === 0) {
        return res.status(403).json({ error: 'Access denied' });
      }
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
    console.error('Case by id error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/cases', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'associate') {
      return res.status(403).json({ error: 'Admin/Associate access required' });
    }

    const { 
      file_number, case_number, title, client_id, case_type,
      status = 'Active', priority = 'medium', 
      assigned_to_user_id, deadline, description 
    } = req.body;

    // Validate required fields
    if (!file_number || !case_number || !title || !client_id || !case_type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

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

    // Check if client belongs to same law firm
    const clientCheck = await pool.query(
      'SELECT law_firm_id FROM clients WHERE id = $1',
      [client_id]
    );
    if (clientCheck.rows.length === 0 || clientCheck.rows[0].law_firm_id !== req.user.lawFirmId) {
      return res.status(400).json({ error: 'Invalid client' });
    }

    // Check if assigned user belongs to same law firm
    const userCheck = await pool.query(
      'SELECT law_firm_id FROM users WHERE id = $1 AND role IN ($2, $3)',
      [assigned_to_user_id, 'admin', 'associate']
    );
    if (userCheck.rows.length === 0 || userCheck.rows[0].law_firm_id !== req.user.lawFirmId) {
      return res.status(400).json({ error: 'Invalid assigned user' });
    }

    const result = await pool.query(
      `INSERT INTO cases (
        file_number, case_number, title, client_id, case_type, status, priority,
        law_firm_id, assigned_to_user_id, added_by_user_id, deadline, description
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) 
       RETURNING *`,
      [
        file_number, case_number, title, client_id, case_type, status, priority,
        req.user.lawFirmId, assigned_to_user_id, req.user.id, deadline, description
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create case error:', error);
    
    if (error.code === '23505') {
      return res.status(400).json({ error: 'File or case number already exists' });
    }
    
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
    if (caseCheck.rows[0].law_firm_id !== req.user.lawFirmId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Define allowed columns for update
    const allowedColumns = ['title', 'case_type', 'status', 'priority', 'assigned_to_user_id', 'deadline', 'description'];

    const { query, values } = buildUpdateQuery('cases', id, updateData, allowedColumns);
    const result = await pool.query(query, values);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update case error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== DELETE CASE ====================
app.delete('/api/cases/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Only admin/associate can delete cases
    if (req.user.role !== 'admin' && req.user.role !== 'associate') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if case exists
    const caseCheck = await pool.query(
      'SELECT * FROM cases WHERE id = $1',
      [id]
    );

    if (caseCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Case not found' });
    }

    const caseData = caseCheck.rows[0];

    // Check if case belongs to user's law firm
    if (caseData.law_firm_id !== req.user.lawFirmId) {
      return res.status(403).json({ error: 'Cannot delete case from another law firm' });
    }

    // Check if case has associated documents
    const hasDocuments = await pool.query(
      'SELECT id FROM documents WHERE case_id = $1 LIMIT 1',
      [id]
    );
    
    // Check if case has associated notes
    const hasNotes = await pool.query(
      'SELECT id FROM notes WHERE case_id = $1 LIMIT 1',
      [id]
    );
    
    // Check if case has associated invoices
    const hasInvoices = await pool.query(
      'SELECT id FROM invoices WHERE case_id = $1 LIMIT 1',
      [id]
    );

    if (hasDocuments.rows.length > 0 || hasNotes.rows.length > 0 || hasInvoices.rows.length > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete case. Case has associated documents, notes, or invoices. Delete them first.' 
      });
    }

    // Perform the deletion
    const deleteResult = await pool.query(
      'DELETE FROM cases WHERE id = $1 RETURNING id, case_number, title',
      [id]
    );

    res.json({ 
      message: 'Case deleted successfully',
      case: {
        id: deleteResult.rows[0].id,
        case_number: deleteResult.rows[0].case_number,
        title: deleteResult.rows[0].title
      }
    });
  } catch (error) {
    console.error('Delete case error:', error);
    
    if (error.code === '23503') {
      return res.status(400).json({ 
        error: 'Cannot delete case: Case is referenced by other records' 
      });
    }
    
    res.status(500).json({ error: error.message });
  }
});



// ==================== DOCUMENTS ====================
// Helper function to validate base64 (Node.js compatible)
function isValidBase64(str) {
  if (typeof str !== 'string') return false;
  
  // Check if it's valid base64
  try {
    // Try to decode and re-encode
    const decoded = Buffer.from(str, 'base64');
    const reEncoded = decoded.toString('base64');
    // Compare without whitespace
    return str === reEncoded;
  } catch (err) {
    return false;
  }
}

// Helper function to get file extension
function getFileExtension(filename) {
  if (!filename) return '';
  const parts = filename.split('.');
  return parts.length > 1 ? parts.pop().toLowerCase() : '';
}

// Helper function to get MIME type from filename
function getMimeType(filename) {
  const extension = getFileExtension(filename);
  const mimeTypes = {
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'txt': 'text/plain',
    'csv': 'text/csv',
    'rtf': 'application/rtf'
  };
  return mimeTypes[extension] || 'application/octet-stream';
}

// ==================== GET DOCUMENTS ====================
app.get('/api/documents', authenticateToken, async (req, res) => {
  try {
    let query = `
      SELECT d.*, 
        u.full_name as uploaded_by_name,
        c.title as case_title,
        c.case_number,
        cl.name as client_name
      FROM documents d
      LEFT JOIN users u ON d.uploaded_by_user_id = u.id
      LEFT JOIN cases c ON d.case_id = c.id
      LEFT JOIN clients cl ON c.client_id = cl.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    // Filter by law firm
    if (req.user.role !== 'associate') {
      query += ` AND d.law_firm_id = $${paramIndex}`;
      params.push(req.user.lawFirmId);
      paramIndex++;
    }

    // Apply additional filters
    if (req.query.case_id) {
      query += ` AND d.case_id = $${paramIndex}`;
      params.push(req.query.case_id);
      paramIndex++;
    }
    
    if (req.query.status) {
      query += ` AND d.status = $${paramIndex}`;
      params.push(req.query.status);
      paramIndex++;
    }
    
    if (req.query.document_type) {
      query += ` AND d.document_type = $${paramIndex}`;
      params.push(req.query.document_type);
      paramIndex++;
    }
    
    if (req.query.uploaded_by_user_id) {
      query += ` AND d.uploaded_by_user_id = $${paramIndex}`;
      params.push(req.query.uploaded_by_user_id);
      paramIndex++;
    }

    query += ' ORDER BY d.uploaded_at DESC';

    console.log('Executing documents query:', query, params);
    const result = await pool.query(query, params);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Documents error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== CREATE DOCUMENT ====================
app.post('/api/documents', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'associate') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { 
      name, case_id, document_type, description, 
      version = 1, status = 'Draft',
      file_data, file_name, file_size, file_type, mime_type
    } = req.body;

    // Validate required fields
    if (!name || !case_id || !document_type || !file_data || !file_name) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        missing: {
          name: !name,
          case_id: !case_id,
          document_type: !document_type,
          file_data: !file_data,
          file_name: !file_name
        }
      });
    }

    let base64Data = file_data;
    
    // Extract base64 from data URL if present
    if (file_data.startsWith('data:')) {
      const matches = file_data.match(/^data:(.+);base64,(.+)$/);
      if (!matches || matches.length < 3) {
        return res.status(400).json({ error: 'Invalid data URL format' });
      }
      base64Data = matches[2];
    }

    // Clean base64 string (remove whitespace, newlines)
    base64Data = base64Data.replace(/\s/g, '');
    
    // Validate base64
    if (!isValidBase64(base64Data)) {
      return res.status(400).json({ error: 'Invalid base64 data' });
    }

    // Check if case belongs to same law firm
    const caseCheck = await pool.query(
      'SELECT law_firm_id FROM cases WHERE id = $1',
      [case_id]
    );
    
    if (caseCheck.rows.length === 0) {
      return res.status(400).json({ error: 'Case not found' });
    }
    
    if (caseCheck.rows[0].law_firm_id !== req.user.lawFirmId) {
      return res.status(403).json({ error: 'Case does not belong to your law firm' });
    }

    // Calculate file size if not provided
    let actualFileSize = file_size;
    try {
      if (!actualFileSize || actualFileSize <= 0) {
        actualFileSize = Buffer.from(base64Data, 'base64').length;
      }
    } catch (error) {
      console.error('Error calculating file size:', error);
      return res.status(400).json({ error: 'Invalid file data' });
    }

    // Check file size limit (25MB)
    const maxFileSize = 25 * 1024 * 1024; // 25MB
    if (actualFileSize > maxFileSize) {
      return res.status(400).json({ 
        error: 'File size exceeds limit',
        maxSize: maxFileSize,
        actualSize: actualFileSize
      });
    }

    // Get file type and mime type
    const finalFileType = file_type || getFileExtension(file_name);
    const finalMimeType = mime_type || getMimeType(file_name);

    const result = await pool.query(
      `INSERT INTO documents (
        name, case_id, document_type, description, version, status,
        law_firm_id, uploaded_by_user_id,
        file_data, file_name, file_size, file_type, mime_type
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) 
       RETURNING *`,
      [
        name, 
        case_id, 
        document_type, 
        description || '', 
        version, 
        status,
        req.user.lawFirmId, 
        req.user.id,
        base64Data,
        file_name,
        actualFileSize,
        finalFileType,
        finalMimeType
      ]
    );

    console.log(`Document uploaded: ${name}, ID: ${result.rows[0].id}, Size: ${actualFileSize} bytes`);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create document error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== UPDATE DOCUMENT ====================
app.put('/api/documents/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check access
    const docCheck = await pool.query(
      'SELECT * FROM documents WHERE id = $1',
      [id]
    );
    
    if (docCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    const document = docCheck.rows[0];
    
    // Check permissions
    if (document.law_firm_id !== req.user.lawFirmId && req.user.role !== 'associate') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Only allow updates to certain fields
    const allowedColumns = ['name', 'document_type', 'description', 'version', 'status', 'reviewer_user_id'];
    const { query, values } = buildUpdateQuery('documents', id, updateData, allowedColumns);
    
    const result = await pool.query(query, values);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update document error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== DELETE DOCUMENT ====================
app.delete('/api/documents/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Only admin/associate can delete documents
    if (req.user.role !== 'associate') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if document exists and get details
    const docCheck = await pool.query(
      'SELECT * FROM documents WHERE id = $1',
      [id]
    );

    if (docCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const document = docCheck.rows[0];

    // Check if document belongs to user's law firm
    if (document.law_firm_id !== req.user.lawFirmId) {
      return res.status(403).json({ error: 'Cannot delete document from another law firm' });
    }

    // Additional check: only allow users to delete their own documents unless admin
    if (req.user.role !== 'admin' && document.uploaded_by_user_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only delete documents you uploaded' });
    }

    // Perform the deletion
    const deleteResult = await pool.query(
      'DELETE FROM documents WHERE id = $1 RETURNING id, name, file_name',
      [id]
    );

    console.log(`Document deleted: ${document.name}, ID: ${id}, by user: ${req.user.id}`);
    res.json({ 
      success: true,
      message: 'Document deleted successfully',
      document: {
        id: deleteResult.rows[0].id,
        name: deleteResult.rows[0].name,
        file_name: deleteResult.rows[0].file_name
      }
    });
  } catch (error) {
    console.error('Delete document error:', error);
    
    if (error.code === '23503') { // Foreign key violation
      return res.status(400).json({ 
        error: 'Cannot delete document: Document is referenced by other records' 
      });
    }
    
    res.status(500).json({ error: error.message });
  }
});

// ==================== DOCUMENT DOWNLOAD ====================
app.get('/api/documents/:id/download', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Download request for document ${id} from user ${req.user.id}, role: ${req.user.role}`);

    // Get the document with necessary joins for permission checking
    const result = await pool.query(
      `SELECT d.*, 
        c.law_firm_id as case_law_firm_id,
        c.client_id,
        cl.user_account_id
      FROM documents d
      LEFT JOIN cases c ON d.case_id = c.id
      LEFT JOIN clients cl ON c.client_id = cl.id
      WHERE d.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const document = result.rows[0];
    console.log(`Document found: ${document.name}, Type: ${document.mime_type}, Size: ${document.file_size} bytes`);

    // Check access permissions
    let hasAccess = false;
    
    if ( req.user.role === 'associate') {
      // Admin and associates can access if document belongs to their law firm
      hasAccess = document.law_firm_id === req.user.lawFirmId;
    } else if (req.user.role === 'client') {
      // Clients can access if they are linked to the case's client
      hasAccess = document.user_account_id === req.user.id;
    }
    
    if (!hasAccess) {
      console.log(`Access denied for user ${req.user.id} to document ${id}`);
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if we have file data
    if (!document.file_data) {
      console.error(`No file_data for document ${id}`);
      return res.status(404).json({ error: 'File data not found' });
    }

    // Process base64 data
    let finalBase64 = document.file_data;
    
    // Handle old records that might have data URL prefix
    if (document.file_data.startsWith('data:')) {
      console.log('Extracting base64 from data URL format...');
      const matches = document.file_data.match(/^data:.+;base64,(.+)$/);
      if (!matches) {
        console.error('Invalid data URL format in stored data');
        return res.status(500).json({ error: 'Invalid file data format' });
      }
      finalBase64 = matches[1];
    }

    // Clean up any whitespace
    finalBase64 = finalBase64.replace(/\s/g, '');
    
    // Validate base64
    if (!isValidBase64(finalBase64)) {
      console.error('Invalid base64 format');
      return res.status(500).json({ error: 'Invalid file data format' });
    }

    // Convert base64 to buffer
    let fileBuffer;
    try {
      fileBuffer = Buffer.from(finalBase64, 'base64');
      console.log(`Buffer created: ${fileBuffer.length} bytes`);
      
      // Verify buffer is not empty
      if (fileBuffer.length === 0) {
        console.error('Empty buffer after decoding');
        return res.status(500).json({ error: 'Empty file data' });
      }
    } catch (error) {
      console.error('Error converting base64 to buffer:', error);
      return res.status(500).json({ error: 'Failed to decode file data' });
    }

    // Set response headers
    const mimeType = document.mime_type || 'application/octet-stream';
    let fileName = document.file_name || `document-${id}`;
    
    // Ensure correct file extension
    if (mimeType === 'application/pdf' && !fileName.toLowerCase().endsWith('.pdf')) {
      fileName += '.pdf';
    }

    // Set Content-Disposition for download
    const contentDisposition = `attachment; filename="${encodeURIComponent(fileName)}"`;
    
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', contentDisposition);
    res.setHeader('Content-Length', fileBuffer.length);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    // Send file
    console.log(`Sending file: ${fileName}, size: ${fileBuffer.length} bytes`);
    res.send(fileBuffer);

  } catch (error) {
    console.error('Download document error:', error);
    
    // Don't try to send error if headers already sent
    if (res.headersSent) {
      console.error('Headers already sent, ending response');
      return res.end();
    }
    
    res.status(500).json({ 
      error: 'Failed to download document',
      details: error.message 
    });
  }
});
// ==================== NOTES ====================
app.get('/api/notes', authenticateToken, async (req, res) => {
  try {
    let query = `
      SELECT n.*, 
        c.title as case_title,
        c.file_number,
        cl.name as client_name
      FROM notes n
      LEFT JOIN cases c ON n.case_id = c.id
      LEFT JOIN clients cl ON c.client_id = cl.id
      WHERE 1=1
    `;
    const params = [];

    // Filter by user or law firm
    if (req.user.role === 'admin' || req.user.role === 'associate') {
      query += ' AND n.user_id IN (SELECT id FROM users WHERE law_firm_id = $1)';
      params.push(req.user.lawFirmId);
    } else if (req.user.role === 'client') {
      query += ' AND n.user_id = $1';
      params.push(req.user.id);
    }

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
    console.error('Notes error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/notes', authenticateToken, async (req, res) => {
  try {
    const { title, content, case_id, category, tags, is_private = false } = req.body;

    // Validate required fields
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    // If case_id is provided, check access
    if (case_id) {
      const caseCheck = await pool.query(
        'SELECT law_firm_id FROM cases WHERE id = $1',
        [case_id]
      );
      if (req.user.role === 'client') {
        const clientCheck = await pool.query(
          'SELECT id FROM clients WHERE user_account_id = $1',
          [req.user.id]
        );
        if (clientCheck.rows.length === 0) {
          return res.status(403).json({ error: 'Access denied' });
        }
      } else if (caseCheck.rows.length > 0 && caseCheck.rows[0].law_firm_id !== req.user.lawFirmId) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const wordCount = content.trim().split(/\s+/).length;
    const characterCount = content.length;

    const result = await pool.query(
  `INSERT INTO notes (
    title, content, user_id, case_id, category, tags, 
    is_private, word_count, character_count, law_firm_id
  ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
   RETURNING *`,
  [
    title, content, req.user.id, case_id || null,
    category || 'Uncategorized',
    tags ? (Array.isArray(tags) ? tags : [tags]) : [],
    is_private, wordCount, characterCount, req.user.lawFirmId || null
  ]
);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create note error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update note endpoint
app.put('/api/notes/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check access
    const noteCheck = await pool.query(
      'SELECT user_id, case_id FROM notes WHERE id = $1',
      [id]
    );
    if (noteCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }

    const note = noteCheck.rows[0];
    
    // User can only update their own notes unless they're admin/associate
    if (req.user.role === 'client' && note.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // For admin/associate, check if note belongs to their law firm
    if (req.user.role === 'admin' || req.user.role === 'associate') {
      const userCheck = await pool.query(
        'SELECT law_firm_id FROM users WHERE id = $1',
        [note.user_id]
      );
      if (userCheck.rows.length === 0 || userCheck.rows[0].law_firm_id !== req.user.lawFirmId) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    // Define allowed columns for update
    const allowedColumns = ['title', 'content', 'category', 'tags', 'is_pinned', 'is_archived', 'is_private'];

    const { query, values } = buildUpdateQuery('notes', id, updateData, allowedColumns);
    const result = await pool.query(query, values);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update note error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== DELETE NOTE ====================
app.delete('/api/notes/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // First, get the note details to check permissions
    const noteResult = await pool.query(
      `SELECT n.*, u.law_firm_id 
       FROM notes n
       LEFT JOIN users u ON n.user_id = u.id
       WHERE n.id = $1`,
      [id]
    );

    if (noteResult.rows.length === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }

    const note = noteResult.rows[0];

    // Check permissions based on user role
    if (req.user.role === 'client') {
      // Clients can only delete their own notes
      if (note.user_id !== req.user.id) {
        return res.status(403).json({ error: 'Access denied: You can only delete your own notes' });
      }
    } else if (req.user.role === 'associate') {
      // Associates and admins can delete notes from their law firm
      if (note.law_firm_id !== req.user.lawFirmId) {
        return res.status(403).json({ error: 'Access denied: Note does not belong to your law firm' });
      }
      
      // Additional check: if user is not the owner, require admin role
      if (note.user_id !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ 
          error: 'Access denied: Only admins can delete notes created by other users' 
        });
      }
    }

    // Perform the deletion
    const deleteResult = await pool.query(
      'DELETE FROM notes WHERE id = $1 RETURNING id, title, user_id',
      [id]
    );

    if (deleteResult.rows.length === 0) {
      return res.status(404).json({ error: 'Note not found or already deleted' });
    }

    res.json({ 
      message: 'Note deleted successfully',
      note: {
        id: deleteResult.rows[0].id,
        title: deleteResult.rows[0].title
      }
    });
  } catch (error) {
    console.error('Delete note error:', error);
    
    // Handle foreign key constraint violations (if note is referenced elsewhere)
    if (error.code === '23503') {
      return res.status(400).json({ 
        error: 'Cannot delete note: It is referenced by other records' 
      });
    }
    
    res.status(500).json({ error: error.message });
  }
});

// ==================== INVOICES ====================
app.get('/api/invoices', authenticateToken, async (req, res) => {
  try {
    let query = `
      SELECT i.*, 
        c.title as case_title,
        c.file_number,
        cl.name as client_name,
        u1.full_name as created_by_name,
        u2.full_name as assigned_to_name
      FROM invoices i
      LEFT JOIN cases c ON i.case_id = c.id
      LEFT JOIN clients cl ON i.client_id = cl.id
      LEFT JOIN users u1 ON i.created_by_user_id = u1.id
      LEFT JOIN users u2 ON i.assigned_to_user_id = u2.id
      WHERE 1=1
    `;
    const params = [];

    // Filter by law firm
    if (req.user.role !== 'admin') {
      query += ' AND i.law_firm_id = $1';
      params.push(req.user.lawFirmId);
    }

    if (req.query.status) {
      params.push(req.query.status);
      query += ` AND i.status = $${params.length}`;
    }
    if (req.query.client_id) {
      params.push(req.query.client_id);
      query += ` AND i.client_id = $${params.length}`;
    }
    if (req.query.case_id) {
      params.push(req.query.case_id);
      query += ` AND i.case_id = $${params.length}`;
    }

    query += ' ORDER BY i.issue_date DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Invoices error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/invoices', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'associate') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { 
      invoice_number, case_id, client_id, assigned_to_user_id,
      description, amount, due_date 
    } = req.body;

    // Validate required fields
    if (!invoice_number || !case_id || !client_id || !assigned_to_user_id || !amount || !due_date) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if invoice number exists
    const existingInvoice = await pool.query(
      'SELECT id FROM invoices WHERE invoice_number = $1',
      [invoice_number]
    );
    if (existingInvoice.rows.length > 0) {
      return res.status(400).json({ error: 'Invoice number already exists' });
    }

    // Check if case belongs to same law firm
    const caseCheck = await pool.query(
      'SELECT law_firm_id FROM cases WHERE id = $1',
      [case_id]
    );
    if (caseCheck.rows.length === 0 || caseCheck.rows[0].law_firm_id !== req.user.lawFirmId) {
      return res.status(400).json({ error: 'Invalid case' });
    }

    // Check if client belongs to same law firm
    const clientCheck = await pool.query(
      'SELECT law_firm_id FROM clients WHERE id = $1',
      [client_id]
    );
    if (clientCheck.rows.length === 0 || clientCheck.rows[0].law_firm_id !== req.user.lawFirmId) {
      return res.status(400).json({ error: 'Invalid client' });
    }

    // Check if assigned user belongs to same law firm
    const userCheck = await pool.query(
      'SELECT law_firm_id FROM users WHERE id = $1 AND role IN ($2, $3)',
      [assigned_to_user_id, 'admin', 'associate']
    );
    if (userCheck.rows.length === 0 || userCheck.rows[0].law_firm_id !== req.user.lawFirmId) {
      return res.status(400).json({ error: 'Invalid assigned user' });
    }

    const result = await pool.query(
      `INSERT INTO invoices (
        invoice_number, case_id, client_id, law_firm_id,
        created_by_user_id, assigned_to_user_id, 
        description, amount, due_date, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'draft') 
       RETURNING *`,
      [
        invoice_number, case_id, client_id, req.user.lawFirmId,
        req.user.id, assigned_to_user_id,
        description, amount, due_date
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create invoice error:', error);
    
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Invoice number already exists' });
    }
    
    res.status(500).json({ error: error.message });
  }
});

// Update invoice endpoint
app.put('/api/invoices/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check access
    const invoiceCheck = await pool.query(
      'SELECT law_firm_id FROM invoices WHERE id = $1',
      [id]
    );
    if (invoiceCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    if (invoiceCheck.rows[0].law_firm_id !== req.user.lawFirmId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Define allowed columns for update
    const allowedColumns = ['description', 'amount', 'due_date', 'paid_date', 'status'];

    const { query, values } = buildUpdateQuery('invoices', id, updateData, allowedColumns);
    const result = await pool.query(query, values);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update invoice error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== STATS ====================
app.get('/api/stats/law-firm/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check access
    if (req.user.role !== 'admin' && req.user.lawFirmId != id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await pool.query(
      `SELECT 
        lf.member_count,
        lf.case_count,
        lf.storage_used_mb,
        (SELECT COUNT(*) FROM cases WHERE law_firm_id = $1 AND status = 'Active') as active_cases,
        (SELECT COUNT(*) FROM cases WHERE law_firm_id = $1 AND status = 'Closed') as closed_cases,
        (SELECT COUNT(*) FROM cases WHERE law_firm_id = $1 AND priority = 'high') as high_priority_cases,
        (SELECT COUNT(*) FROM users WHERE law_firm_id = $1 AND role = 'associate') as associate_count,
        (SELECT COUNT(*) FROM users WHERE law_firm_id = $1 AND role = 'admin') as admin_count,
        (SELECT COUNT(*) FROM clients WHERE law_firm_id = $1 AND status = 'active') as active_clients,
        (SELECT COUNT(*) FROM invoices WHERE law_firm_id = $1 AND status = 'paid') as paid_invoices,
        (SELECT COUNT(*) FROM invoices WHERE law_firm_id = $1 AND status = 'pending') as pending_invoices,
        (SELECT COUNT(*) FROM invoices WHERE law_firm_id = $1 AND status = 'overdue') as overdue_invoices,
        (SELECT COALESCE(SUM(amount), 0) FROM invoices WHERE law_firm_id = $1 AND status = 'paid') as total_revenue
       FROM law_firms lf WHERE lf.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Law firm not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Stats error:', error);
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
    console.error('Health check error:', error);
    res.status(500).json({ 
      status: 'ERROR', 
      database: 'Connection failed',
      error: error.message 
    });
  }
});

// ==================== ERROR HANDLING ====================
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.stack);
  res.status(500).json({ error: 'Internal server error' });
});


// ==================== START SERVER ====================
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔐 JWT Secret set: ${process.env.JWT_SECRET ? 'Yes' : 'No'}`);
});