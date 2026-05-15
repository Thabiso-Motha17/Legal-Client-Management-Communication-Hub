import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from './db.js';
import dotenv from 'dotenv';
import { Buffer } from 'buffer';

dotenv.config();

const app = express();
const PORT = process.env.PORT;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ==================== AUDIT LOG HELPER ====================

/**
 * Inserts a row into audit_logs. Never throws — failures are logged to console
 * so a bad audit write never breaks the main request.
 *
 * @param {object} params
 * @param {number}      params.userId      - ID of the acting user
 * @param {string}      params.action      - 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'DOWNLOAD'
 * @param {string}      params.entityType  - 'USER' | 'CLIENT' | 'CASE' | 'DOCUMENT' | 'NOTE' | 'INVOICE' | 'EVENT' | 'LAW_FIRM'
 * @param {number|null} params.entityId    - PK of the affected row
 * @param {string}      [params.description]
 * @param {object|null} [params.oldValues]
 * @param {object|null} [params.newValues]
 * @param {string}      [params.ipAddress]
 */
async function writeAuditLog({
  userId,
  action,
  entityType,
  entityId = null,
  description = null,
  oldValues = null,
  newValues = null,
  ipAddress = null,
}) {
  try {
    await pool.query(
      `INSERT INTO audit_logs
         (user_id, action, entity_type, entity_id, description, old_values, new_values, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        userId,
        action,
        entityType,
        entityId,
        description,
        oldValues ? JSON.stringify(oldValues) : null,
        newValues ? JSON.stringify(newValues) : null,
        ipAddress,
      ]
    );
  } catch (err) {
    // Never let audit failures surface to the caller
    console.error('Audit log write failed:', err.message);
  }
}

/** Extracts the real client IP, respecting common proxy headers. */
function getClientIp(req) {
  return (
    (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
    req.socket?.remoteAddress ||
    null
  );
}

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

      console.log('Decoded token:', decoded);

      if (!decoded || !decoded.id || !decoded.role) {
        console.error('Token missing required fields:', decoded);
        return res.status(403).json({ error: 'Invalid token structure' });
      }

      req.user = {
        id: decoded.id,
        userId: decoded.id,
        role: decoded.role,
        lawFirmId: decoded.lawFirmId || decoded.law_firm_id || null,
        email: decoded.email || '',
        full_name: decoded.full_name || '',
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

    if (!username || !email || !password || !full_name || !role) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!['admin', 'associate', 'client'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const validPermissions = ['full access', 'limited access', 'no access'];
    if (permissions && !validPermissions.includes(permissions)) {
      return res.status(400).json({ error: 'Invalid permissions value' });
    }

    const existingUser = await pool.query(
      'SELECT * FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    if (role === 'associate') {
      if (!law_firm_id) {
        return res.status(400).json({ error: 'Associates must have a law firm' });
      }
      const lawFirmCheck = await pool.query('SELECT id FROM law_firms WHERE id = $1', [law_firm_id]);
      if (lawFirmCheck.rows.length === 0) {
        return res.status(400).json({ error: 'Invalid law firm' });
      }
    } else {
      if (law_firm_id) {
        return res.status(400).json({ error: `${role}s cannot be assigned to a law firm` });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

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
        role === 'associate' ? law_firm_id : null,
        permissions,
      ]
    );

    const user = result.rows[0];

    // Audit: new user registered (no acting user yet, so use the new user's own id)
    await writeAuditLog({
      userId: user.id,
      action: 'CREATE',
      entityType: 'USER',
      entityId: user.id,
      description: `User registered: ${user.username} (${user.role})`,
      newValues: { username: user.username, email: user.email, role: user.role },
      ipAddress: getClientIp(req),
    });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, lawFirmId: user.law_firm_id, permissions: user.permissions },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({ token, user });
  } catch (error) {
    console.error('Registration error:', error);
    if (error.code === '23505') return res.status(400).json({ error: 'Email or username already exists' });
    if (error.code === '23503') {
      if (error.constraint === 'users_law_firm_id_fkey') return res.status(400).json({ error: 'Invalid law firm' });
      return res.status(400).json({ error: 'Invalid data provided' });
    }
    if (error.code === '23514') return res.status(400).json({ error: 'Invalid data provided' });
    if (error.code === '22P02') return res.status(400).json({ error: 'Invalid input data format' });
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND is_active = true',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      // Audit failed login attempt
      await writeAuditLog({
        userId: user.id,
        action: 'LOGIN',
        entityType: 'USER',
        entityId: user.id,
        description: `Failed login attempt for ${email}`,
        ipAddress: getClientIp(req),
      });
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    await pool.query('UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);

    // Audit successful login
    await writeAuditLog({
      userId: user.id,
      action: 'LOGIN',
      entityType: 'USER',
      entityId: user.id,
      description: `User logged in: ${user.username}`,
      ipAddress: getClientIp(req),
    });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, lawFirmId: user.law_firm_id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    const { password: userPassword, ...userWithoutPassword } = user;

    let clientInfo = null;
    if (user.role === 'client') {
      const clientResult = await pool.query('SELECT * FROM clients WHERE user_account_id = $1', [user.id]);
      clientInfo = clientResult.rows[0];
    }

    res.json({ token, user: userWithoutPassword, clientInfo });
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

    let clientInfo = null;
    if (user.role === 'client') {
      const clientResult = await pool.query('SELECT * FROM clients WHERE user_account_id = $1', [req.user.id]);
      clientInfo = clientResult.rows[0];
    }

    res.json({ user, clientInfo });
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

    const { name, email, phone, address, city, country, logo_url, description } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    const result = await pool.query(
      `INSERT INTO law_firms (name, email, phone, address, city, country, logo_url, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [name, email, phone, address, city, country, logo_url, description]
    );

    const firm = result.rows[0];

    await writeAuditLog({
      userId: req.user.id,
      action: 'CREATE',
      entityType: 'LAW_FIRM',
      entityId: firm.id,
      description: `Created law firm: ${firm.name}`,
      newValues: { name: firm.name, email: firm.email, city: firm.city },
      ipAddress: getClientIp(req),
    });

    res.status(201).json(firm);
  } catch (error) {
    console.error('Create law firm error:', error);
    if (error.code === '23505') return res.status(400).json({ error: 'Law firm name already exists' });
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/law-firms/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const lawFirmCheck = await pool.query('SELECT * FROM law_firms WHERE id = $1', [id]);
    if (lawFirmCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Law firm not found' });
    }

    const hasUsers    = await pool.query('SELECT id FROM users   WHERE law_firm_id = $1 LIMIT 1', [id]);
    const hasClients  = await pool.query('SELECT id FROM clients WHERE law_firm_id = $1 LIMIT 1', [id]);
    const hasCases    = await pool.query('SELECT id FROM cases   WHERE law_firm_id = $1 LIMIT 1', [id]);

    if (hasUsers.rows.length > 0 || hasClients.rows.length > 0 || hasCases.rows.length > 0) {
      return res.status(400).json({
        error: 'Cannot delete law firm. It has associated users, clients, or cases. Remove them first.',
      });
    }

    const deleteResult = await pool.query(
      'DELETE FROM law_firms WHERE id = $1 RETURNING id, name',
      [id]
    );

    await writeAuditLog({
      userId: req.user.id,
      action: 'DELETE',
      entityType: 'LAW_FIRM',
      entityId: Number(id),
      description: `Deleted law firm: ${lawFirmCheck.rows[0].name}`,
      oldValues: lawFirmCheck.rows[0],
      ipAddress: getClientIp(req),
    });

    res.json({ message: 'Law firm deleted successfully', lawFirm: deleteResult.rows[0] });
  } catch (error) {
    console.error('Delete law firm error:', error);
    if (error.code === '23503') return res.status(400).json({ error: 'Cannot delete law firm: It is referenced by other records' });
    res.status(500).json({ error: error.message });
  }
});

// ==================== USERS ====================
app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    let query = `
      SELECT
        u.id, u.username, u.email, u.full_name, u.role,
        u.law_firm_id, u.phone, u.is_active, u.last_login_at,
        u.created_at, u.updated_at, u.permissions,
        lf.name as law_firm_name
      FROM users u
      LEFT JOIN law_firms lf ON u.law_firm_id = lf.id
      WHERE 1=1
    `;
    const params = [];

    if (req.user.role === 'associate') {
      query += ' AND u.law_firm_id = $1';
      params.push(req.user.lawFirmId);
    } else if (req.user.role === 'client') {
      query += ' AND u.id = $1';
      params.push(req.user.id);
    }

    query += ' ORDER BY u.created_at DESC';

    const result = await pool.query(query, params);

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

    if (req.user.role !== 'associate' && req.user.id != id) {
      const userCheck = await pool.query('SELECT law_firm_id FROM users WHERE id = $1', [id]);
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
    let clientInfo = null;
    if (user.role === 'client') {
      const clientResult = await pool.query('SELECT * FROM clients WHERE user_account_id = $1', [user.id]);
      clientInfo = clientResult.rows[0];
    }

    res.json({ ...user, clientInfo });
  } catch (error) {
    console.error('User by id error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/users/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    if (req.user.role !== 'admin' && req.user.id != id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const existingUser = await pool.query('SELECT id, role, law_firm_id FROM users WHERE id = $1', [id]);
    if (existingUser.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (req.user.role === 'associate') {
      if (existingUser.rows[0].law_firm_id !== req.user.lawFirmId) {
        return res.status(403).json({ error: 'Access denied: user belongs to a different law firm' });
      }
    }

    const allowedColumns = ['full_name', 'phone'];

    if (req.user.role === 'admin') {
      allowedColumns.push('is_active', 'role', 'law_firm_id', 'permissions');
    }

    if (updateData.password !== undefined) {
      if (typeof updateData.password !== 'string' || updateData.password.trim().length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
      }
      updateData.password = await bcrypt.hash(updateData.password.trim(), 10);
      allowedColumns.push('password');
    }

    if (req.user.role === 'admin' && updateData.role !== undefined) {
      if (!['admin', 'associate', 'client'].includes(updateData.role)) {
        return res.status(400).json({ error: 'Invalid role. Must be admin, associate, or client' });
      }
    }

    if (updateData.permissions !== undefined) {
      if (!['full access', 'limited access', 'no access'].includes(updateData.permissions)) {
        return res.status(400).json({ error: 'Invalid permissions value' });
      }
    }

    // Snapshot old values before update (exclude password)
    const oldSnapshot = await pool.query(
      'SELECT id, username, email, full_name, role, law_firm_id, phone, is_active, permissions FROM users WHERE id = $1',
      [id]
    );

    const { query, values } = buildUpdateQuery('users', id, updateData, allowedColumns);
    const result = await pool.query(query, values);

    const { password: _pw, ...safeUser } = result.rows[0];

    // Sanitise new values for audit (no password hash)
    const { password: _pw2, ...safeNew } = result.rows[0];

    await writeAuditLog({
      userId: req.user.id,
      action: 'UPDATE',
      entityType: 'USER',
      entityId: Number(id),
      description: `Updated user: ${safeUser.username || safeUser.email}`,
      oldValues: oldSnapshot.rows[0],
      newValues: safeNew,
      ipAddress: getClientIp(req),
    });

    res.json(safeUser);
  } catch (error) {
    console.error('Update user error:', error);
    if (error.message === 'No valid update data provided') return res.status(400).json({ error: 'No valid fields provided for update' });
    if (error.code === '23505') return res.status(400).json({ error: 'Email or username already exists' });
    if (error.code === '23503') return res.status(400).json({ error: 'Invalid law firm reference' });
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/users/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.role !== 'admin' && req.user.id != id) {
      return res.status(403).json({ error: 'You can only delete your own account' });
    }

    if (req.user.role === 'admin' && req.user.id == id) {
      return res.status(400).json({ error: 'Admins cannot delete their own account via this endpoint' });
    }

    const userCheck = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userCheck.rows[0];

    if (req.user.role !== 'admin' && user.law_firm_id !== req.user.lawFirmId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (user.role === 'client') {
      const clientCheck = await pool.query('SELECT id FROM clients WHERE user_account_id = $1', [id]);
      if (clientCheck.rows.length > 0) {
        return res.status(400).json({ error: 'Cannot delete user. Associated client record exists. Delete the client record first.' });
      }
    }

    const hasCases     = await pool.query('SELECT id FROM cases     WHERE added_by_user_id = $1 OR assigned_to_user_id = $1 LIMIT 1', [id]);
    const hasDocuments = await pool.query('SELECT id FROM documents WHERE uploaded_by_user_id = $1 OR reviewer_user_id = $1 LIMIT 1', [id]);
    const hasNotes     = await pool.query('SELECT id FROM notes     WHERE user_id = $1 LIMIT 1', [id]);
    const hasInvoices  = await pool.query('SELECT id FROM invoices  WHERE created_by_user_id = $1 OR assigned_to_user_id = $1 LIMIT 1', [id]);

    if (hasCases.rows.length > 0 || hasDocuments.rows.length > 0 ||
        hasInvoices.rows.length > 0 || (user.role !== 'client' && hasNotes.rows.length > 0)) {
      return res.status(400).json({ error: 'Cannot delete user. User has created or is assigned to cases, documents, notes, or invoices. Reassign them first.' });
    }

    const deleteResult = await pool.query(
      'DELETE FROM users WHERE id = $1 RETURNING id, username, email, full_name',
      [id]
    );

    await writeAuditLog({
      userId: req.user.id,
      action: 'DELETE',
      entityType: 'USER',
      entityId: Number(id),
      description: `Deleted user: ${user.username} (${user.email})`,
      oldValues: { id: user.id, username: user.username, email: user.email, role: user.role },
      ipAddress: getClientIp(req),
    });

    res.json({ message: 'User deleted successfully', user: deleteResult.rows[0] });
  } catch (error) {
    console.error('Delete user error:', error);
    if (error.code === '23503') return res.status(400).json({ error: 'Cannot delete user: User is referenced by other records' });
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
        u.full_name  as assigned_associate_name,
        u.email      as assigned_associate_email,
        u2.username  as user_account_username,
        u2.email     as user_account_email
      FROM clients c
      LEFT JOIN users u  ON c.assigned_associate_id = u.id
      LEFT JOIN users u2 ON c.user_account_id = u2.id
      WHERE c.law_firm_id = $1
    `;
    const params = [req.user.lawFirmId];

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
        u.full_name  as assigned_associate_name,
        u.email      as assigned_associate_email,
        u2.username  as user_account_username,
        u2.email     as user_account_email
       FROM clients c
       LEFT JOIN users u  ON c.assigned_associate_id = u.id
       LEFT JOIN users u2 ON c.user_account_id = u2.id
       WHERE c.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    const client = result.rows[0];

    if (req.user.role === 'client' && client.user_account_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    if ((req.user.role === 'admin' || req.user.role === 'associate') && client.law_firm_id !== req.user.lawFirmId) {
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

    const { name, email, phone, company, client_type, assigned_associate_id, user_account_id } = req.body;

    if (!name || !email || !client_type || !assigned_associate_id) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const existingClient = await pool.query('SELECT id FROM clients WHERE email = $1', [email]);
    if (existingClient.rows.length > 0) {
      return res.status(400).json({ error: 'Client with this email already exists' });
    }

    const associateCheck = await pool.query(
      "SELECT law_firm_id FROM users WHERE id = $1 AND role IN ('admin', 'associate')",
      [assigned_associate_id]
    );
    if (associateCheck.rows.length === 0 || associateCheck.rows[0].law_firm_id !== req.user.lawFirmId) {
      return res.status(400).json({ error: 'Invalid assigned associate' });
    }

    if (user_account_id) {
      const userCheck = await pool.query('SELECT role FROM users WHERE id = $1', [user_account_id]);
      if (userCheck.rows.length === 0 || userCheck.rows[0].role !== 'client') {
        return res.status(400).json({ error: 'Invalid user account for client' });
      }
    }

    const result = await pool.query(
      `INSERT INTO clients
         (name, email, phone, company, client_type, assigned_associate_id, user_account_id, law_firm_id, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active')
       RETURNING *`,
      [name, email, phone, company, client_type, assigned_associate_id, user_account_id || null, req.user.lawFirmId]
    );

    const client = result.rows[0];

    await writeAuditLog({
      userId: req.user.id,
      action: 'CREATE',
      entityType: 'CLIENT',
      entityId: client.id,
      description: `Created client: ${client.name} (${client.email})`,
      newValues: { name: client.name, email: client.email, client_type: client.client_type },
      ipAddress: getClientIp(req),
    });

    res.status(201).json(client);
  } catch (error) {
    console.error('Create client error:', error);
    if (error.code === '23505') return res.status(400).json({ error: 'Client email already exists' });
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/clients/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const clientCheck = await pool.query('SELECT * FROM clients WHERE id = $1', [id]);
    if (clientCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }
    if (clientCheck.rows[0].law_firm_id !== req.user.lawFirmId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const oldValues = clientCheck.rows[0];

    const allowedColumns = ['name', 'email', 'phone', 'company', 'client_type', 'assigned_associate_id', 'user_account_id', 'status'];
    const { query, values } = buildUpdateQuery('clients', id, updateData, allowedColumns);
    const result = await pool.query(query, values);

    const newValues = result.rows[0];

    await writeAuditLog({
      userId: req.user.id,
      action: 'UPDATE',
      entityType: 'CLIENT',
      entityId: Number(id),
      description: `Updated client: ${newValues.name}`,
      oldValues,
      newValues,
      ipAddress: getClientIp(req),
    });

    res.json(newValues);
  } catch (error) {
    console.error('Update client error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/clients/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.role !== 'admin' && req.user.role !== 'associate') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const clientCheck = await pool.query('SELECT * FROM clients WHERE id = $1', [id]);
    if (clientCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    const client = clientCheck.rows[0];

    if (client.law_firm_id !== req.user.lawFirmId) {
      return res.status(403).json({ error: 'Cannot delete client from another law firm' });
    }

    const hasCases   = await pool.query('SELECT id FROM cases    WHERE client_id = $1 LIMIT 1', [id]);
    const hasInvoices = await pool.query('SELECT id FROM invoices WHERE client_id = $1 LIMIT 1', [id]);

    if (hasCases.rows.length > 0 || hasInvoices.rows.length > 0) {
      return res.status(400).json({ error: 'Cannot delete client. Client has associated cases or invoices. Delete them first.' });
    }

    if (client.user_account_id) {
      await pool.query('UPDATE clients SET user_account_id = NULL WHERE id = $1', [id]);
    }

    const deleteResult = await pool.query('DELETE FROM clients WHERE id = $1 RETURNING id, name, email', [id]);

    await writeAuditLog({
      userId: req.user.id,
      action: 'DELETE',
      entityType: 'CLIENT',
      entityId: Number(id),
      description: `Deleted client: ${client.name} (${client.email})`,
      oldValues: { id: client.id, name: client.name, email: client.email },
      ipAddress: getClientIp(req),
    });

    res.json({ message: 'Client deleted successfully', client: deleteResult.rows[0] });
  } catch (error) {
    console.error('Delete client error:', error);
    if (error.code === '23503') return res.status(400).json({ error: 'Cannot delete client: Client is referenced by other records' });
    res.status(500).json({ error: error.message });
  }
});

// ==================== CASES ====================
app.get('/api/cases', authenticateToken, async (req, res) => {
  try {
    let query = `
      SELECT c.*,
        cl.name    as client_name,
        cl.email   as client_email,
        u.full_name  as assigned_to_name,
        u2.full_name as added_by_name
      FROM cases c
      LEFT JOIN clients cl ON c.client_id = cl.id
      LEFT JOIN users u    ON c.assigned_to_user_id = u.id
      LEFT JOIN users u2   ON c.added_by_user_id = u2.id
      WHERE 1=1
    `;
    const params = [];

    if (req.user.role !== 'admin') {
      if (req.user.role === 'client') {
        query += ' AND c.client_id IN (SELECT id FROM clients WHERE user_account_id = $1)';
        params.push(req.user.id);
      } else {
        query += ' AND c.law_firm_id = $1';
        params.push(req.user.lawFirmId);
      }
    }

    if (req.query.status) { params.push(req.query.status); query += ` AND c.status = $${params.length}`; }
    if (req.query.priority) { params.push(req.query.priority); query += ` AND c.priority = $${params.length}`; }
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
        cl.name    as client_name,
        cl.email   as client_email,
        cl.phone   as client_phone,
        cl.company as client_company,
        u.full_name  as assigned_to_name,
        u.email      as assigned_to_email,
        u2.full_name as added_by_name,
        lf.name      as law_firm_name
      FROM cases c
      LEFT JOIN clients cl   ON c.client_id = cl.id
      LEFT JOIN users u      ON c.assigned_to_user_id = u.id
      LEFT JOIN users u2     ON c.added_by_user_id = u2.id
      LEFT JOIN law_firms lf ON c.law_firm_id = lf.id
      WHERE c.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Case not found' });
    }

    const caseData = result.rows[0];

    if (req.user.role === 'client') {
      const clientCheck = await pool.query(
        'SELECT id FROM clients WHERE user_account_id = $1 AND id = $2',
        [req.user.id, caseData.client_id]
      );
      if (clientCheck.rows.length === 0) return res.status(403).json({ error: 'Access denied' });
    }
    if ((req.user.role === 'admin' || req.user.role === 'associate') && caseData.law_firm_id !== req.user.lawFirmId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const documents = await pool.query(
      `SELECT d.*, u.full_name as uploaded_by_name
       FROM documents d
       LEFT JOIN users u ON d.uploaded_by_user_id = u.id
       WHERE d.case_id = $1
       ORDER BY d.uploaded_at DESC`,
      [id]
    );

    const notes = await pool.query(
      `SELECT n.*, u.full_name as user_name
       FROM notes n
       LEFT JOIN users u ON n.user_id = u.id
       WHERE n.case_id = $1 AND (n.is_private = false OR n.user_id = $2)
       ORDER BY n.created_at DESC`,
      [id, req.user.id]
    );

    res.json({ ...caseData, documents: documents.rows, notes: notes.rows });
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
      assigned_to_user_id, deadline, description,
    } = req.body;

    if (!file_number || !case_number || !title || !client_id || !case_type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const existingFile = await pool.query('SELECT id FROM cases WHERE file_number = $1', [file_number]);
    if (existingFile.rows.length > 0) return res.status(400).json({ error: 'File number already exists' });

    const existingCase = await pool.query('SELECT id FROM cases WHERE case_number = $1', [case_number]);
    if (existingCase.rows.length > 0) return res.status(400).json({ error: 'Case number already exists' });

    const clientCheck = await pool.query('SELECT law_firm_id FROM clients WHERE id = $1', [client_id]);
    if (clientCheck.rows.length === 0 || clientCheck.rows[0].law_firm_id !== req.user.lawFirmId) {
      return res.status(400).json({ error: 'Invalid client' });
    }

    const userCheck = await pool.query(
      "SELECT law_firm_id FROM users WHERE id = $1 AND role IN ('admin', 'associate')",
      [assigned_to_user_id]
    );
    if (userCheck.rows.length === 0 || userCheck.rows[0].law_firm_id !== req.user.lawFirmId) {
      return res.status(400).json({ error: 'Invalid assigned user' });
    }

    const result = await pool.query(
      `INSERT INTO cases
         (file_number, case_number, title, client_id, case_type, status, priority,
          law_firm_id, assigned_to_user_id, added_by_user_id, deadline, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [file_number, case_number, title, client_id, case_type, status, priority,
       req.user.lawFirmId, assigned_to_user_id, req.user.id, deadline, description]
    );

    const newCase = result.rows[0];

    await writeAuditLog({
      userId: req.user.id,
      action: 'CREATE',
      entityType: 'CASE',
      entityId: newCase.id,
      description: `Created case: ${newCase.title} (${newCase.case_number})`,
      newValues: { title: newCase.title, case_number: newCase.case_number, status: newCase.status, priority: newCase.priority },
      ipAddress: getClientIp(req),
    });

    res.status(201).json(newCase);
  } catch (error) {
    console.error('Create case error:', error);
    if (error.code === '23505') return res.status(400).json({ error: 'File or case number already exists' });
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/cases/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const caseCheck = await pool.query('SELECT * FROM cases WHERE id = $1', [id]);
    if (caseCheck.rows.length === 0) return res.status(404).json({ error: 'Case not found' });
    if (caseCheck.rows[0].law_firm_id !== req.user.lawFirmId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const oldValues = caseCheck.rows[0];

    const allowedColumns = ['title', 'case_type', 'status', 'priority', 'assigned_to_user_id', 'deadline', 'description'];
    const { query, values } = buildUpdateQuery('cases', id, updateData, allowedColumns);
    const result = await pool.query(query, values);
    const newValues = result.rows[0];

    await writeAuditLog({
      userId: req.user.id,
      action: 'UPDATE',
      entityType: 'CASE',
      entityId: Number(id),
      description: `Updated case: ${newValues.title} (${newValues.case_number})`,
      oldValues,
      newValues,
      ipAddress: getClientIp(req),
    });

    res.json(newValues);
  } catch (error) {
    console.error('Update case error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/cases/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.role !== 'admin' && req.user.role !== 'associate') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const caseCheck = await pool.query('SELECT * FROM cases WHERE id = $1', [id]);
    if (caseCheck.rows.length === 0) return res.status(404).json({ error: 'Case not found' });

    const caseData = caseCheck.rows[0];
    if (caseData.law_firm_id !== req.user.lawFirmId) {
      return res.status(403).json({ error: 'Cannot delete case from another law firm' });
    }

    const hasDocuments = await pool.query('SELECT id FROM documents WHERE case_id = $1 LIMIT 1', [id]);
    const hasNotes     = await pool.query('SELECT id FROM notes     WHERE case_id = $1 LIMIT 1', [id]);
    const hasInvoices  = await pool.query('SELECT id FROM invoices  WHERE case_id = $1 LIMIT 1', [id]);

    if (hasDocuments.rows.length > 0 || hasNotes.rows.length > 0 || hasInvoices.rows.length > 0) {
      return res.status(400).json({ error: 'Cannot delete case. Case has associated documents, notes, or invoices. Delete them first.' });
    }

    const deleteResult = await pool.query('DELETE FROM cases WHERE id = $1 RETURNING id, case_number, title', [id]);

    await writeAuditLog({
      userId: req.user.id,
      action: 'DELETE',
      entityType: 'CASE',
      entityId: Number(id),
      description: `Deleted case: ${caseData.title} (${caseData.case_number})`,
      oldValues: { id: caseData.id, case_number: caseData.case_number, title: caseData.title },
      ipAddress: getClientIp(req),
    });

    res.json({ message: 'Case deleted successfully', case: deleteResult.rows[0] });
  } catch (error) {
    console.error('Delete case error:', error);
    if (error.code === '23503') return res.status(400).json({ error: 'Cannot delete case: Case is referenced by other records' });
    res.status(500).json({ error: error.message });
  }
});

// ==================== DOCUMENTS ====================
function isValidBase64(str) {
  if (typeof str !== 'string') return false;
  try {
    const decoded = Buffer.from(str, 'base64');
    return str === decoded.toString('base64');
  } catch { return false; }
}
function getFileExtension(filename) {
  if (!filename) return '';
  const parts = filename.split('.');
  return parts.length > 1 ? parts.pop().toLowerCase() : '';
}
function getMimeType(filename) {
  const ext = getFileExtension(filename);
  const map = {
    pdf: 'application/pdf', doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
    gif: 'image/gif', txt: 'text/plain', csv: 'text/csv', rtf: 'application/rtf',
  };
  return map[ext] || 'application/octet-stream';
}

app.get('/api/documents', authenticateToken, async (req, res) => {
  try {
    let query = `
      SELECT d.*,
        d.year_column_name as year,
        u.full_name  as uploaded_by_name,
        c.title      as case_title,
        c.case_number,
        cl.name      as client_name
      FROM documents d
      LEFT JOIN users u   ON d.uploaded_by_user_id = u.id
      LEFT JOIN cases c   ON d.case_id = c.id
      LEFT JOIN clients cl ON c.client_id = cl.id
      WHERE 1=1
    `;
    const params = [];
    let idx = 1;

    if (req.user.role !== 'associate') {
      query += ` AND d.law_firm_id = $${idx++}`;
      params.push(req.user.lawFirmId);
    }

    if (req.query.case_id)             { query += ` AND d.case_id = $${idx++}`;              params.push(req.query.case_id); }
    if (req.query.status)              { query += ` AND d.status = $${idx++}`;               params.push(req.query.status); }
    if (req.query.document_type)       { query += ` AND d.document_type = $${idx++}`;        params.push(req.query.document_type); }
    if (req.query.uploaded_by_user_id) { query += ` AND d.uploaded_by_user_id = $${idx++}`; params.push(req.query.uploaded_by_user_id); }
    if (req.query.year)                { query += ` AND d.year_column_name = $${idx++}`;     params.push(req.query.year); }

    query += ' ORDER BY d.uploaded_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Documents error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/documents', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'associate') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const {
      name, case_id, document_type, description,
      version = 1, status = 'Draft',
      file_data, file_name, file_size, file_type, mime_type, year,
    } = req.body;

    if (!name || !case_id || !document_type || !file_data || !file_name || !year) {
      return res.status(400).json({ error: 'Missing required fields', missing: { name: !name, case_id: !case_id, document_type: !document_type, file_data: !file_data, file_name: !file_name, year: !year } });
    }

    let base64Data = file_data;
    if (file_data.startsWith('data:')) {
      const matches = file_data.match(/^data:(.+);base64,(.+)$/);
      if (!matches || matches.length < 3) return res.status(400).json({ error: 'Invalid data URL format' });
      base64Data = matches[2];
    }
    base64Data = base64Data.replace(/\s/g, '');
    if (!isValidBase64(base64Data)) return res.status(400).json({ error: 'Invalid base64 data' });

    const caseCheck = await pool.query('SELECT law_firm_id FROM cases WHERE id = $1', [case_id]);
    if (caseCheck.rows.length === 0) return res.status(400).json({ error: 'Case not found' });
    if (caseCheck.rows[0].law_firm_id !== req.user.lawFirmId) return res.status(403).json({ error: 'Case does not belong to your law firm' });

    let actualFileSize = file_size;
    try {
      if (!actualFileSize || actualFileSize <= 0) actualFileSize = Buffer.from(base64Data, 'base64').length;
    } catch { return res.status(400).json({ error: 'Invalid file data' }); }

    if (actualFileSize > 25 * 1024 * 1024) return res.status(400).json({ error: 'File size exceeds limit', maxSize: 25 * 1024 * 1024, actualSize: actualFileSize });

    const finalFileType = file_type || getFileExtension(file_name);
    const finalMimeType = mime_type || getMimeType(file_name);

    const result = await pool.query(
      `INSERT INTO documents
         (name, case_id, document_type, description, version, status,
          law_firm_id, uploaded_by_user_id, file_data, file_name, file_size, file_type, mime_type, year_column_name)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       RETURNING *`,
      [name, case_id, document_type, description || '', version, status,
       req.user.lawFirmId, req.user.id, base64Data, file_name, actualFileSize, finalFileType, finalMimeType, year]
    );

    const doc = result.rows[0];

    await writeAuditLog({
      userId: req.user.id,
      action: 'CREATE',
      entityType: 'DOCUMENT',
      entityId: doc.id,
      description: `Uploaded document: ${doc.name} (${doc.file_name}, ${actualFileSize} bytes)`,
      newValues: { name: doc.name, document_type: doc.document_type, file_name: doc.file_name, file_size: actualFileSize, year },
      ipAddress: getClientIp(req),
    });

    res.status(201).json(doc);
  } catch (error) {
    console.error('Create document error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/documents/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const docCheck = await pool.query('SELECT * FROM documents WHERE id = $1', [id]);
    if (docCheck.rows.length === 0) return res.status(404).json({ error: 'Document not found' });

    const document = docCheck.rows[0];
    if (document.law_firm_id !== req.user.lawFirmId && req.user.role !== 'associate') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const oldValues = document;
    const allowedColumns = ['name', 'document_type', 'description', 'version', 'status', 'reviewer_user_id'];
    const { query, values } = buildUpdateQuery('documents', id, updateData, allowedColumns);
    const result = await pool.query(query, values);
    const newValues = result.rows[0];

    await writeAuditLog({
      userId: req.user.id,
      action: 'UPDATE',
      entityType: 'DOCUMENT',
      entityId: Number(id),
      description: `Updated document: ${newValues.name}`,
      oldValues: { name: oldValues.name, status: oldValues.status, version: oldValues.version },
      newValues: { name: newValues.name, status: newValues.status, version: newValues.version },
      ipAddress: getClientIp(req),
    });

    res.json(newValues);
  } catch (error) {
    console.error('Update document error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/documents/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.role !== 'associate') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const docCheck = await pool.query('SELECT * FROM documents WHERE id = $1', [id]);
    if (docCheck.rows.length === 0) return res.status(404).json({ error: 'Document not found' });

    const document = docCheck.rows[0];

    if (document.law_firm_id !== req.user.lawFirmId) return res.status(403).json({ error: 'Cannot delete document from another law firm' });
    if (req.user.role !== 'admin' && document.uploaded_by_user_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only delete documents you uploaded' });
    }

    const deleteResult = await pool.query('DELETE FROM documents WHERE id = $1 RETURNING id, name, file_name', [id]);

    await writeAuditLog({
      userId: req.user.id,
      action: 'DELETE',
      entityType: 'DOCUMENT',
      entityId: Number(id),
      description: `Deleted document: ${document.name} (${document.file_name})`,
      oldValues: { name: document.name, file_name: document.file_name, document_type: document.document_type },
      ipAddress: getClientIp(req),
    });

    res.json({ success: true, message: 'Document deleted successfully', document: deleteResult.rows[0] });
  } catch (error) {
    console.error('Delete document error:', error);
    if (error.code === '23503') return res.status(400).json({ error: 'Cannot delete document: Document is referenced by other records' });
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/documents/:id/download', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Download request for document ${id} from user ${req.user.id}, role: ${req.user.role}`);

    const result = await pool.query(
      `SELECT d.*,
        c.law_firm_id as case_law_firm_id,
        c.client_id,
        cl.user_account_id
       FROM documents d
       LEFT JOIN cases c   ON d.case_id = c.id
       LEFT JOIN clients cl ON c.client_id = cl.id
       WHERE d.id = $1`,
      [id]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Document not found' });

    const document = result.rows[0];
    let hasAccess = false;

    if (req.user.role === 'associate') {
      hasAccess = document.law_firm_id === req.user.lawFirmId;
    } else if (req.user.role === 'client') {
      hasAccess = document.user_account_id === req.user.id;
    }

    if (!hasAccess) return res.status(403).json({ error: 'Access denied' });
    if (!document.file_data) return res.status(404).json({ error: 'File data not found' });

    let finalBase64 = document.file_data;
    if (document.file_data.startsWith('data:')) {
      const matches = document.file_data.match(/^data:.+;base64,(.+)$/);
      if (!matches) return res.status(500).json({ error: 'Invalid file data format' });
      finalBase64 = matches[1];
    }
    finalBase64 = finalBase64.replace(/\s/g, '');
    if (!isValidBase64(finalBase64)) return res.status(500).json({ error: 'Invalid file data format' });

    let fileBuffer;
    try {
      fileBuffer = Buffer.from(finalBase64, 'base64');
      if (fileBuffer.length === 0) return res.status(500).json({ error: 'Empty file data' });
    } catch {
      return res.status(500).json({ error: 'Failed to decode file data' });
    }

    const mimeType = document.mime_type || 'application/octet-stream';
    let fileName = document.file_name || `document-${id}`;
    if (mimeType === 'application/pdf' && !fileName.toLowerCase().endsWith('.pdf')) fileName += '.pdf';

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
    res.setHeader('Content-Length', fileBuffer.length);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    // Audit the download
    await writeAuditLog({
      userId: req.user.id,
      action: 'DOWNLOAD',
      entityType: 'DOCUMENT',
      entityId: Number(id),
      description: `Downloaded document: ${document.name} (${fileName})`,
      ipAddress: getClientIp(req),
    });

    res.send(fileBuffer);
  } catch (error) {
    console.error('Download document error:', error);
    if (res.headersSent) return res.end();
    res.status(500).json({ error: 'Failed to download document', details: error.message });
  }
});

// ==================== NOTES ====================
app.get('/api/notes', authenticateToken, async (req, res) => {
  try {
    let query = `
      SELECT n.*,
        c.title      as case_title,
        c.file_number,
        cl.name      as client_name
      FROM notes n
      LEFT JOIN cases c   ON n.case_id = c.id
      LEFT JOIN clients cl ON c.client_id = cl.id
      WHERE 1=1
    `;
    const params = [];

    if (req.user.role === 'admin' || req.user.role === 'associate') {
      query += ' AND n.user_id IN (SELECT id FROM users WHERE law_firm_id = $1)';
      params.push(req.user.lawFirmId);
    } else if (req.user.role === 'client') {
      query += ' AND n.user_id = $1';
      params.push(req.user.id);
    }

    if (req.query.case_id)     { params.push(req.query.case_id);                  query += ` AND n.case_id = $${params.length}`; }
    if (req.query.is_archived) { params.push(req.query.is_archived === 'true');   query += ` AND n.is_archived = $${params.length}`; }
    if (req.query.is_pinned)   { params.push(req.query.is_pinned === 'true');     query += ` AND n.is_pinned = $${params.length}`; }
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

    if (!title || !content) return res.status(400).json({ error: 'Title and content are required' });

    if (case_id) {
      const caseCheck = await pool.query('SELECT law_firm_id FROM cases WHERE id = $1', [case_id]);
      if (req.user.role === 'client') {
        const clientCheck = await pool.query('SELECT id FROM clients WHERE user_account_id = $1', [req.user.id]);
        if (clientCheck.rows.length === 0) return res.status(403).json({ error: 'Access denied' });
      } else if (caseCheck.rows.length > 0 && caseCheck.rows[0].law_firm_id !== req.user.lawFirmId) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const wordCount = content.trim().split(/\s+/).length;
    const characterCount = content.length;

    const result = await pool.query(
      `INSERT INTO notes
         (title, content, user_id, case_id, category, tags, is_private, word_count, character_count, law_firm_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING *`,
      [
        title, content, req.user.id, case_id || null,
        category || 'Uncategorized',
        tags ? (Array.isArray(tags) ? tags : [tags]) : [],
        is_private, wordCount, characterCount, req.user.lawFirmId || null,
      ]
    );

    const note = result.rows[0];

    await writeAuditLog({
      userId: req.user.id,
      action: 'CREATE',
      entityType: 'NOTE',
      entityId: note.id,
      description: `Created note: "${note.title}"`,
      newValues: { title: note.title, category: note.category, is_private: note.is_private },
      ipAddress: getClientIp(req),
    });

    res.status(201).json(note);
  } catch (error) {
    console.error('Create note error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/notes/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const noteCheck = await pool.query('SELECT user_id, case_id FROM notes WHERE id = $1', [id]);
    if (noteCheck.rows.length === 0) return res.status(404).json({ error: 'Note not found' });

    const note = noteCheck.rows[0];
    if (req.user.role === 'client' && note.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    if (req.user.role === 'admin' || req.user.role === 'associate') {
      const userCheck = await pool.query('SELECT law_firm_id FROM users WHERE id = $1', [note.user_id]);
      if (userCheck.rows.length === 0 || userCheck.rows[0].law_firm_id !== req.user.lawFirmId) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const oldSnapshot = await pool.query('SELECT * FROM notes WHERE id = $1', [id]);
    const allowedColumns = ['title', 'content', 'category', 'tags', 'is_pinned', 'is_archived', 'is_private'];
    const { query, values } = buildUpdateQuery('notes', id, updateData, allowedColumns);
    const result = await pool.query(query, values);
    const newValues = result.rows[0];

    await writeAuditLog({
      userId: req.user.id,
      action: 'UPDATE',
      entityType: 'NOTE',
      entityId: Number(id),
      description: `Updated note: "${newValues.title}"`,
      oldValues: { title: oldSnapshot.rows[0].title, is_pinned: oldSnapshot.rows[0].is_pinned, is_archived: oldSnapshot.rows[0].is_archived },
      newValues: { title: newValues.title, is_pinned: newValues.is_pinned, is_archived: newValues.is_archived },
      ipAddress: getClientIp(req),
    });

    res.json(newValues);
  } catch (error) {
    console.error('Update note error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/notes/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const noteResult = await pool.query(
      `SELECT n.*, u.law_firm_id FROM notes n LEFT JOIN users u ON n.user_id = u.id WHERE n.id = $1`,
      [id]
    );
    if (noteResult.rows.length === 0) return res.status(404).json({ error: 'Note not found' });

    const note = noteResult.rows[0];

    if (req.user.role === 'client' && note.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied: You can only delete your own notes' });
    }
    if (req.user.role === 'associate') {
      if (note.law_firm_id !== req.user.lawFirmId) return res.status(403).json({ error: 'Access denied: Note does not belong to your law firm' });
      if (note.user_id !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied: Only admins can delete notes created by other users' });
      }
    }

    const deleteResult = await pool.query('DELETE FROM notes WHERE id = $1 RETURNING id, title, user_id', [id]);
    if (deleteResult.rows.length === 0) return res.status(404).json({ error: 'Note not found or already deleted' });

    await writeAuditLog({
      userId: req.user.id,
      action: 'DELETE',
      entityType: 'NOTE',
      entityId: Number(id),
      description: `Deleted note: "${note.title}"`,
      oldValues: { id: note.id, title: note.title },
      ipAddress: getClientIp(req),
    });

    res.json({ message: 'Note deleted successfully', note: { id: deleteResult.rows[0].id, title: deleteResult.rows[0].title } });
  } catch (error) {
    console.error('Delete note error:', error);
    if (error.code === '23503') return res.status(400).json({ error: 'Cannot delete note: It is referenced by other records' });
    res.status(500).json({ error: error.message });
  }
});

// ==================== EVENTS ====================
app.get('/api/events', authenticateToken, async (req, res) => {
  try {
    let query = `
      SELECT e.*,
        c.file_number, c.case_number, c.title as case_title,
        u1.full_name as created_by_name, u2.full_name as assigned_to_name,
        d.name as document_name, cl.name as client_name
      FROM events e
      LEFT JOIN cases c    ON e.case_id = c.id
      LEFT JOIN users u1   ON e.created_by_user_id = u1.id
      LEFT JOIN users u2   ON e.assigned_to_user_id = u2.id
      LEFT JOIN documents d ON e.document_id = d.id
      LEFT JOIN clients cl  ON c.client_id = cl.id
      WHERE 1=1
    `;
    const params = [];
    let idx = 1;

    if (req.user.role === 'admin' || req.user.role === 'associate') {
      query += ` AND e.law_firm_id = $${idx++}`;
      params.push(req.user.lawFirmId);
    } else if (req.user.role === 'client') {
      query += ` AND e.case_id IN (SELECT id FROM cases WHERE client_id IN (SELECT id FROM clients WHERE user_account_id = $${idx++})) AND e.client_invited = true`;
      params.push(req.user.id);
    }

    if (req.query.case_id)             { query += ` AND e.case_id = $${idx++}`;              params.push(req.query.case_id); }
    if (req.query.status)              { query += ` AND e.status = $${idx++}`;               params.push(req.query.status); }
    if (req.query.event_type)          { query += ` AND e.event_type = $${idx++}`;           params.push(req.query.event_type); }
    if (req.query.assigned_to_user_id) { query += ` AND e.assigned_to_user_id = $${idx++}`; params.push(req.query.assigned_to_user_id); }
    if (req.query.start_date)          { query += ` AND DATE(e.start_time) >= $${idx++}`;    params.push(req.query.start_date); }
    if (req.query.end_date)            { query += ` AND DATE(e.start_time) <= $${idx++}`;    params.push(req.query.end_date); }
    if (req.query.upcoming)            { query += ` AND e.start_time >= CURRENT_TIMESTAMP AND e.status IN ('scheduled','confirmed')`; }
    if (req.query.past)                { query += ` AND e.end_time < CURRENT_TIMESTAMP AND e.status IN ('completed','cancelled')`; }
    if (req.query.search) {
      query += ` AND (e.title ILIKE $${idx++} OR e.description ILIKE $${idx - 1})`;
      params.push(`%${req.query.search}%`);
    }

    query += ' ORDER BY e.start_time ASC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/events/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT e.*,
        c.file_number, c.case_number, c.title as case_title,
        u1.full_name as created_by_name, u1.email as created_by_email,
        u2.full_name as assigned_to_name, u2.email as assigned_to_email,
        d.name as document_name, d.file_name as document_file_name,
        cl.name as client_name, cl.email as client_email
      FROM events e
      LEFT JOIN cases c    ON e.case_id = c.id
      LEFT JOIN users u1   ON e.created_by_user_id = u1.id
      LEFT JOIN users u2   ON e.assigned_to_user_id = u2.id
      LEFT JOIN documents d ON e.document_id = d.id
      LEFT JOIN clients cl  ON c.client_id = cl.id
      WHERE e.id = $1
    `, [id]);

    if (result.rows.length === 0) return res.status(404).json({ error: 'Event not found' });

    const event = result.rows[0];
    let hasAccess = false;

    if (req.user.role === 'admin' || req.user.role === 'associate') {
      hasAccess = event.law_firm_id === req.user.lawFirmId;
    } else if (req.user.role === 'client') {
      const clientCheck = await pool.query(
        `SELECT c.id FROM cases cs JOIN clients c ON cs.client_id = c.id WHERE cs.id = $1 AND c.user_account_id = $2`,
        [event.case_id, req.user.id]
      );
      hasAccess = clientCheck.rows.length > 0 && event.client_invited;
    }

    if (!hasAccess) return res.status(403).json({ error: 'Access denied' });
    res.json(event);
  } catch (error) {
    console.error('Get event by id error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/events', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'associate') {
      return res.status(403).json({ error: 'Admin/Associate access required' });
    }

    const {
      title, description, event_type, status = 'scheduled', priority = 'medium',
      start_time, end_time, all_day = false, location, meeting_link, address,
      case_id, assigned_to_user_id, client_invited = false, client_confirmed = false,
      reminder_minutes_before = 30, is_recurring = false,
      recurrence_pattern, recurrence_end_date, document_id,
    } = req.body;

    if (!title || !event_type || !start_time || !end_time || !case_id) {
      return res.status(400).json({ error: 'Missing required fields', missing: { title: !title, event_type: !event_type, start_time: !start_time, end_time: !end_time, case_id: !case_id } });
    }

    const validEventTypes = ['meeting', 'deadline', 'hearing', 'court_date', 'filing', 'consultation', 'other'];
    if (!validEventTypes.includes(event_type)) return res.status(400).json({ error: 'Invalid event type' });

    const validStatuses = ['scheduled', 'confirmed', 'completed', 'cancelled', 'postponed'];
    if (!validStatuses.includes(status)) return res.status(400).json({ error: 'Invalid status' });

    if (priority && !['low', 'medium', 'high'].includes(priority)) return res.status(400).json({ error: 'Invalid priority' });

    const startTime = new Date(start_time);
    const endTime   = new Date(end_time);
    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) return res.status(400).json({ error: 'Invalid date format' });
    if (endTime <= startTime) return res.status(400).json({ error: 'End time must be after start time' });

    const caseCheck = await pool.query('SELECT law_firm_id FROM cases WHERE id = $1', [case_id]);
    if (caseCheck.rows.length === 0) return res.status(400).json({ error: 'Case not found' });
    if (caseCheck.rows[0].law_firm_id !== req.user.lawFirmId) return res.status(403).json({ error: 'Case does not belong to your law firm' });

    if (assigned_to_user_id) {
      const userCheck = await pool.query('SELECT law_firm_id, role FROM users WHERE id = $1', [assigned_to_user_id]);
      if (userCheck.rows.length === 0) return res.status(400).json({ error: 'Assigned user not found' });
      if (userCheck.rows[0].law_firm_id !== req.user.lawFirmId) return res.status(400).json({ error: 'Assigned user does not belong to your law firm' });
      if (!['admin', 'associate'].includes(userCheck.rows[0].role)) return res.status(400).json({ error: 'Can only assign to admin or associate users' });
    }

    if (document_id) {
      const documentCheck = await pool.query('SELECT law_firm_id FROM documents WHERE id = $1', [document_id]);
      if (documentCheck.rows.length === 0) return res.status(400).json({ error: 'Document not found' });
      if (documentCheck.rows[0].law_firm_id !== req.user.lawFirmId) return res.status(400).json({ error: 'Document does not belong to your law firm' });
    }

    if (is_recurring) {
      if (!recurrence_pattern) return res.status(400).json({ error: 'Recurrence pattern is required for recurring events' });
      if (!['daily', 'weekly', 'monthly', 'yearly'].includes(recurrence_pattern)) return res.status(400).json({ error: 'Invalid recurrence pattern' });
      if (recurrence_end_date) {
        const endDate = new Date(recurrence_end_date);
        if (isNaN(endDate.getTime()) || endDate < startTime) return res.status(400).json({ error: 'Invalid recurrence end date' });
      }
    }

    const result = await pool.query(
      `INSERT INTO events
         (title, description, event_type, status, priority, start_time, end_time, all_day,
          location, meeting_link, address, case_id, law_firm_id, created_by_user_id,
          assigned_to_user_id, client_invited, client_confirmed, reminder_minutes_before,
          is_recurring, recurrence_pattern, recurrence_end_date, document_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22)
       RETURNING *`,
      [title, description || '', event_type, status, priority, start_time, end_time, all_day,
       location || '', meeting_link || '', address || '', case_id, req.user.lawFirmId, req.user.id,
       assigned_to_user_id || null, client_invited, client_confirmed, reminder_minutes_before,
       is_recurring, is_recurring ? recurrence_pattern : null, is_recurring ? recurrence_end_date : null,
       document_id || null]
    );

    const event = result.rows[0];

    await writeAuditLog({
      userId: req.user.id,
      action: 'CREATE',
      entityType: 'EVENT',
      entityId: event.id,
      description: `Created event: "${event.title}" (${event.event_type}) on ${new Date(event.start_time).toISOString()}`,
      newValues: { title: event.title, event_type: event.event_type, status: event.status, start_time: event.start_time },
      ipAddress: getClientIp(req),
    });

    res.status(201).json(event);
  } catch (error) {
    console.error('Create event error:', error);
    if (error.code === '23505') return res.status(400).json({ error: 'Event constraint violation' });
    if (error.code === '23503') return res.status(400).json({ error: 'Invalid foreign key reference' });
    if (error.code === '23514') return res.status(400).json({ error: 'Check constraint violation' });
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/events/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const eventCheck = await pool.query('SELECT * FROM events WHERE id = $1', [id]);
    if (eventCheck.rows.length === 0) return res.status(404).json({ error: 'Event not found' });

    const event = eventCheck.rows[0];

    if (req.user.role === 'admin' || req.user.role === 'associate') {
      if (event.law_firm_id !== req.user.lawFirmId) return res.status(403).json({ error: 'Access denied' });
    } else if (req.user.role === 'client') {
      const clientCheck = await pool.query(
        `SELECT c.id FROM cases cs JOIN clients c ON cs.client_id = c.id WHERE cs.id = $1 AND c.user_account_id = $2`,
        [event.case_id, req.user.id]
      );
      if (clientCheck.rows.length === 0 || !event.client_invited) return res.status(403).json({ error: 'Access denied' });
      const invalidFields = Object.keys(updateData).filter(k => k !== 'client_confirmed');
      if (invalidFields.length > 0) return res.status(403).json({ error: 'Clients can only update client_confirmed field', invalidFields });
    }

    if (req.user.role === 'admin' || req.user.role === 'associate') {
      if (updateData.start_time || updateData.end_time) {
        const s = new Date(updateData.start_time || event.start_time);
        const e = new Date(updateData.end_time   || event.end_time);
        if (e <= s) return res.status(400).json({ error: 'End time must be after start time' });
      }
      if (updateData.assigned_to_user_id) {
        const userCheck = await pool.query('SELECT law_firm_id, role FROM users WHERE id = $1', [updateData.assigned_to_user_id]);
        if (userCheck.rows.length === 0) return res.status(400).json({ error: 'Assigned user not found' });
        if (userCheck.rows[0].law_firm_id !== req.user.lawFirmId) return res.status(400).json({ error: 'Assigned user does not belong to your law firm' });
        if (!['admin', 'associate'].includes(userCheck.rows[0].role)) return res.status(400).json({ error: 'Can only assign to admin or associate users' });
      }
      if (updateData.document_id) {
        const documentCheck = await pool.query('SELECT law_firm_id FROM documents WHERE id = $1', [updateData.document_id]);
        if (documentCheck.rows.length === 0) return res.status(400).json({ error: 'Document not found' });
        if (documentCheck.rows[0].law_firm_id !== req.user.lawFirmId) return res.status(400).json({ error: 'Document does not belong to your law firm' });
      }
    }

    const allowedColumns = req.user.role === 'client'
      ? ['client_confirmed']
      : ['title', 'description', 'event_type', 'status', 'priority', 'start_time', 'end_time',
         'all_day', 'location', 'meeting_link', 'address', 'assigned_to_user_id',
         'client_invited', 'client_confirmed', 'reminder_minutes_before',
         'reminder_sent', 'last_reminder_sent_at', 'is_recurring',
         'recurrence_pattern', 'recurrence_end_date', 'document_id'];

    const { query, values } = buildUpdateQuery('events', id, updateData, allowedColumns);
    const result = await pool.query(query, values);
    const newValues = result.rows[0];

    await writeAuditLog({
      userId: req.user.id,
      action: 'UPDATE',
      entityType: 'EVENT',
      entityId: Number(id),
      description: `Updated event: "${newValues.title}"`,
      oldValues: { title: event.title, status: event.status, start_time: event.start_time },
      newValues: { title: newValues.title, status: newValues.status, start_time: newValues.start_time },
      ipAddress: getClientIp(req),
    });

    res.json(newValues);
  } catch (error) {
    console.error('Update event error:', error);
    if (error.code === '23505') return res.status(400).json({ error: 'Event constraint violation' });
    if (error.code === '23503') return res.status(400).json({ error: 'Invalid foreign key reference' });
    if (error.code === '23514') return res.status(400).json({ error: 'Check constraint violation' });
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/events/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.role !== 'admin' && req.user.role !== 'associate') {
      return res.status(403).json({ error: 'Admin/Associate access required' });
    }

    const eventCheck = await pool.query('SELECT * FROM events WHERE id = $1', [id]);
    if (eventCheck.rows.length === 0) return res.status(404).json({ error: 'Event not found' });

    const event = eventCheck.rows[0];
    if (event.law_firm_id !== req.user.lawFirmId) return res.status(403).json({ error: 'Cannot delete event from another law firm' });
    if (req.user.role !== 'admin' && event.created_by_user_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only delete events you created' });
    }

    const deleteResult = await pool.query('DELETE FROM events WHERE id = $1 RETURNING id, title, start_time', [id]);

    await writeAuditLog({
      userId: req.user.id,
      action: 'DELETE',
      entityType: 'EVENT',
      entityId: Number(id),
      description: `Deleted event: "${event.title}" (${event.event_type})`,
      oldValues: { id: event.id, title: event.title, event_type: event.event_type, start_time: event.start_time },
      ipAddress: getClientIp(req),
    });

    res.json({ success: true, message: 'Event deleted successfully', event: deleteResult.rows[0] });
  } catch (error) {
    console.error('Delete event error:', error);
    if (error.code === '23503') return res.status(400).json({ error: 'Cannot delete event: Event is referenced by other records' });
    res.status(500).json({ error: error.message });
  }
});

// ==================== SPECIAL EVENT ENDPOINTS ====================
app.get('/api/events/upcoming', authenticateToken, async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;

    let query = `
      SELECT e.*,
        c.file_number, c.case_number, c.title as case_title,
        u.full_name as assigned_to_name, cl.name as client_name
      FROM events e
      LEFT JOIN cases c   ON e.case_id = c.id
      LEFT JOIN users u   ON e.assigned_to_user_id = u.id
      LEFT JOIN clients cl ON c.client_id = cl.id
      WHERE e.status IN ('scheduled','confirmed')
        AND e.start_time >= CURRENT_TIMESTAMP
        AND e.start_time <= CURRENT_TIMESTAMP + INTERVAL '${days} days'
    `;
    const params = [];

    if (req.user.role === 'admin' || req.user.role === 'associate') {
      query += ' AND e.law_firm_id = $1';
      params.push(req.user.lawFirmId);
      if (req.query.assigned_to) { query += ' AND e.assigned_to_user_id = $2'; params.push(req.query.assigned_to); }
    } else if (req.user.role === 'client') {
      query += ` AND e.case_id IN (SELECT id FROM cases WHERE client_id IN (SELECT id FROM clients WHERE user_account_id = $1)) AND e.client_invited = true`;
      params.push(req.user.id);
    }

    query += ' ORDER BY e.start_time ASC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Upcoming events error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/cases/:caseId/events', authenticateToken, async (req, res) => {
  try {
    const { caseId } = req.params;

    const caseCheck = await pool.query('SELECT law_firm_id, client_id FROM cases WHERE id = $1', [caseId]);
    if (caseCheck.rows.length === 0) return res.status(404).json({ error: 'Case not found' });

    const caseData = caseCheck.rows[0];
    let hasAccess = false;

    if (req.user.role === 'admin' || req.user.role === 'associate') {
      hasAccess = caseData.law_firm_id === req.user.lawFirmId;
    } else if (req.user.role === 'client') {
      const clientCheck = await pool.query('SELECT id FROM clients WHERE id = $1 AND user_account_id = $2', [caseData.client_id, req.user.id]);
      hasAccess = clientCheck.rows.length > 0;
    }

    if (!hasAccess) return res.status(403).json({ error: 'Access denied' });

    const result = await pool.query(`
      SELECT e.*, u.full_name as assigned_to_name, d.name as document_name
      FROM events e
      LEFT JOIN users u    ON e.assigned_to_user_id = u.id
      LEFT JOIN documents d ON e.document_id = d.id
      WHERE e.case_id = $1
      ORDER BY e.start_time ASC
    `, [caseId]);

    res.json(result.rows);
  } catch (error) {
    console.error('Get case events error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/events/calendar/:year/:month', authenticateToken, async (req, res) => {
  try {
    const { year, month } = req.params;
    const startDate = `${year}-${month.padStart(2, '0')}-01`;
    const endDate = new Date(year, parseInt(month), 0).toISOString().split('T')[0];

    let query = `
      SELECT e.*,
        c.file_number, c.case_number, c.title as case_title,
        u.full_name as assigned_to_name, cl.name as client_name
      FROM events e
      LEFT JOIN cases c   ON e.case_id = c.id
      LEFT JOIN users u   ON e.assigned_to_user_id = u.id
      LEFT JOIN clients cl ON c.client_id = cl.id
      WHERE e.start_time >= $1::timestamp
        AND e.start_time <= $2::timestamp + INTERVAL '1 day'
    `;
    const params = [startDate, endDate];

    if (req.user.role === 'admin' || req.user.role === 'associate') {
      query += ' AND e.law_firm_id = $3';
      params.push(req.user.lawFirmId);
    } else if (req.user.role === 'client') {
      query += ` AND e.case_id IN (SELECT id FROM cases WHERE client_id IN (SELECT id FROM clients WHERE user_account_id = $3)) AND e.client_invited = true`;
      params.push(req.user.id);
    }

    query += ' ORDER BY e.start_time ASC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Calendar events error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/events/:id/send-reminder', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.role !== 'admin' && req.user.role !== 'associate') {
      return res.status(403).json({ error: 'Admin/Associate access required' });
    }

    const eventCheck = await pool.query('SELECT * FROM events WHERE id = $1', [id]);
    if (eventCheck.rows.length === 0) return res.status(404).json({ error: 'Event not found' });

    const event = eventCheck.rows[0];
    if (event.law_firm_id !== req.user.lawFirmId) return res.status(403).json({ error: 'Cannot send reminder for event from another law firm' });
    if (event.start_time <= new Date()) return res.status(400).json({ error: 'Cannot send reminder for past events' });

    if (event.last_reminder_sent_at) {
      const hoursDiff = (new Date() - new Date(event.last_reminder_sent_at)) / (1000 * 60 * 60);
      if (hoursDiff < 1) return res.status(400).json({ error: 'Reminder was already sent within the last hour' });
    }

    const result = await pool.query(
      `UPDATE events SET reminder_sent = true, last_reminder_sent_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
      [id]
    );

    await writeAuditLog({
      userId: req.user.id,
      action: 'UPDATE',
      entityType: 'EVENT',
      entityId: Number(id),
      description: `Reminder sent for event: "${event.title}"`,
      ipAddress: getClientIp(req),
    });

    const eventDetails = await pool.query(`
      SELECT e.*, c.title as case_title, u.full_name as assigned_to_name, u.email as assigned_to_email, cl.name as client_name, cl.email as client_email
      FROM events e
      LEFT JOIN cases c    ON e.case_id = c.id
      LEFT JOIN users u    ON e.assigned_to_user_id = u.id
      LEFT JOIN clients cl  ON c.client_id = cl.id
      WHERE e.id = $1
    `, [id]);

    res.json({
      success: true, message: 'Reminder sent successfully', event: result.rows[0],
      notificationDetails: {
        assignedTo: eventDetails.rows[0].assigned_to_email,
        clientInvited: event.client_invited,
        clientEmail: eventDetails.rows[0].client_email,
        eventTime: event.start_time,
      },
    });
  } catch (error) {
    console.error('Send reminder error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== EVENT STATS ====================
app.get('/api/stats/events', authenticateToken, async (req, res) => {
  try {
    const { period = 'month' } = req.query;

    const intervalMap = { week: '7 days', month: '30 days', quarter: '90 days', year: '365 days' };
    const interval = intervalMap[period] || '30 days';
    const dateFilter = `AND start_time >= CURRENT_DATE - INTERVAL '${interval}'`;

    const result = await pool.query(
      `SELECT
        COUNT(*) as total_events,
        COUNT(*) FILTER (WHERE status = 'scheduled')   as scheduled_events,
        COUNT(*) FILTER (WHERE status = 'confirmed')   as confirmed_events,
        COUNT(*) FILTER (WHERE status = 'completed')   as completed_events,
        COUNT(*) FILTER (WHERE status = 'cancelled')   as cancelled_events,
        COUNT(*) FILTER (WHERE status = 'postponed')   as postponed_events,
        COUNT(*) FILTER (WHERE event_type = 'meeting')     as meetings,
        COUNT(*) FILTER (WHERE event_type = 'deadline')    as deadlines,
        COUNT(*) FILTER (WHERE event_type = 'hearing')     as hearings,
        COUNT(*) FILTER (WHERE event_type = 'court_date')  as court_dates,
        COUNT(*) FILTER (WHERE event_type = 'filing')      as filings,
        COUNT(*) FILTER (WHERE event_type = 'consultation') as consultations,
        COUNT(*) FILTER (WHERE status IN ('scheduled','confirmed') AND start_time > CURRENT_TIMESTAMP) as upcoming_events,
        COUNT(*) FILTER (WHERE end_time < CURRENT_TIMESTAMP) as past_events,
        COUNT(*) FILTER (WHERE client_invited = true)  as client_invited_events,
        COUNT(*) FILTER (WHERE client_confirmed = true) as client_confirmed_events,
        COUNT(*) FILTER (WHERE is_recurring = true)    as recurring_events
       FROM events
       WHERE law_firm_id = $1 ${dateFilter}`,
      [req.user.lawFirmId]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'No event statistics found' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Event stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== INVOICES ====================
app.get('/api/invoices', authenticateToken, async (req, res) => {
  try {
    let query = `
      SELECT i.*,
        c.title    as case_title,
        c.file_number,
        cl.name    as client_name,
        u1.full_name as created_by_name,
        u2.full_name as assigned_to_name
      FROM invoices i
      LEFT JOIN cases c   ON i.case_id = c.id
      LEFT JOIN clients cl ON i.client_id = cl.id
      LEFT JOIN users u1  ON i.created_by_user_id = u1.id
      LEFT JOIN users u2  ON i.assigned_to_user_id = u2.id
      WHERE 1=1
    `;
    const params = [];

    if (req.user.role !== 'admin') { params.push(req.user.lawFirmId); query += ` AND i.law_firm_id = $${params.length}`; }
    if (req.query.status)    { params.push(req.query.status);    query += ` AND i.status = $${params.length}`; }
    if (req.query.client_id) { params.push(req.query.client_id); query += ` AND i.client_id = $${params.length}`; }
    if (req.query.case_id)   { params.push(req.query.case_id);   query += ` AND i.case_id = $${params.length}`; }

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

    const { invoice_number, case_id, client_id, assigned_to_user_id, description, amount, due_date } = req.body;

    if (!invoice_number || !case_id || !client_id || !assigned_to_user_id || !amount || !due_date) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const existingInvoice = await pool.query('SELECT id FROM invoices WHERE invoice_number = $1', [invoice_number]);
    if (existingInvoice.rows.length > 0) return res.status(400).json({ error: 'Invoice number already exists' });

    const caseCheck = await pool.query('SELECT law_firm_id FROM cases WHERE id = $1', [case_id]);
    if (caseCheck.rows.length === 0 || caseCheck.rows[0].law_firm_id !== req.user.lawFirmId) return res.status(400).json({ error: 'Invalid case' });

    const clientCheck = await pool.query('SELECT law_firm_id FROM clients WHERE id = $1', [client_id]);
    if (clientCheck.rows.length === 0 || clientCheck.rows[0].law_firm_id !== req.user.lawFirmId) return res.status(400).json({ error: 'Invalid client' });

    const userCheck = await pool.query("SELECT law_firm_id FROM users WHERE id = $1 AND role IN ('admin', 'associate')", [assigned_to_user_id]);
    if (userCheck.rows.length === 0 || userCheck.rows[0].law_firm_id !== req.user.lawFirmId) return res.status(400).json({ error: 'Invalid assigned user' });

    const result = await pool.query(
      `INSERT INTO invoices
         (invoice_number, case_id, client_id, law_firm_id, created_by_user_id, assigned_to_user_id, description, amount, due_date, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'draft')
       RETURNING *`,
      [invoice_number, case_id, client_id, req.user.lawFirmId, req.user.id, assigned_to_user_id, description, amount, due_date]
    );

    const invoice = result.rows[0];

    await writeAuditLog({
      userId: req.user.id,
      action: 'CREATE',
      entityType: 'INVOICE',
      entityId: invoice.id,
      description: `Created invoice: ${invoice.invoice_number} for amount ${invoice.amount}`,
      newValues: { invoice_number: invoice.invoice_number, amount: invoice.amount, due_date: invoice.due_date, status: invoice.status },
      ipAddress: getClientIp(req),
    });

    res.status(201).json(invoice);
  } catch (error) {
    console.error('Create invoice error:', error);
    if (error.code === '23505') return res.status(400).json({ error: 'Invoice number already exists' });
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/invoices/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const invoiceCheck = await pool.query('SELECT * FROM invoices WHERE id = $1', [id]);
    if (invoiceCheck.rows.length === 0) return res.status(404).json({ error: 'Invoice not found' });
    if (invoiceCheck.rows[0].law_firm_id !== req.user.lawFirmId && req.user.role !== 'admin') return res.status(403).json({ error: 'Access denied' });

    const oldValues = invoiceCheck.rows[0];
    const allowedColumns = ['description', 'amount', 'due_date', 'paid_date', 'status'];
    const { query, values } = buildUpdateQuery('invoices', id, updateData, allowedColumns);
    const result = await pool.query(query, values);
    const newValues = result.rows[0];

    await writeAuditLog({
      userId: req.user.id,
      action: 'UPDATE',
      entityType: 'INVOICE',
      entityId: Number(id),
      description: `Updated invoice: ${newValues.invoice_number} — status: ${oldValues.status} → ${newValues.status}`,
      oldValues: { invoice_number: oldValues.invoice_number, amount: oldValues.amount, status: oldValues.status },
      newValues: { invoice_number: newValues.invoice_number, amount: newValues.amount, status: newValues.status },
      ipAddress: getClientIp(req),
    });

    res.json(newValues);
  } catch (error) {
    console.error('Update invoice error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== AUDIT LOGS (READ) ====================
/**
 * GET /api/audit-logs
 * Admin-only endpoint to read the audit trail.
 * Supports filtering by entity_type, action, user_id, entity_id and date range.
 */
app.get('/api/audit-logs', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'associate') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    let query = `
      SELECT al.*,
        u.username  as actor_username,
        u.full_name as actor_full_name,
        u.email     as actor_email,
        u.role      as actor_role
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE 1=1
    `;
    const params = [];
    let idx = 1;

    if (req.query.entity_type) { query += ` AND al.entity_type = $${idx++}`; params.push(req.query.entity_type.toUpperCase()); }
    if (req.query.action)      { query += ` AND al.action = $${idx++}`;      params.push(req.query.action.toUpperCase()); }
    if (req.query.user_id)     { query += ` AND al.user_id = $${idx++}`;     params.push(req.query.user_id); }
    if (req.query.entity_id)   { query += ` AND al.entity_id = $${idx++}`;   params.push(req.query.entity_id); }
    if (req.query.from_date)   { query += ` AND al.created_at >= $${idx++}`; params.push(req.query.from_date); }
    if (req.query.to_date)     { query += ` AND al.created_at <= $${idx++}`; params.push(req.query.to_date); }

    // Pagination
    const limit  = Math.min(parseInt(req.query.limit)  || 50, 200);
    const offset = parseInt(req.query.offset) || 0;

    query += ` ORDER BY al.created_at DESC LIMIT $${idx++} OFFSET $${idx++}`;
    params.push(limit, offset);

    const [rows, countRow] = await Promise.all([
      pool.query(query, params),
      pool.query(
        `SELECT COUNT(*) FROM audit_logs al WHERE 1=1
          ${req.query.entity_type ? ` AND al.entity_type = '${req.query.entity_type.toUpperCase()}'` : ''}
          ${req.query.action      ? ` AND al.action = '${req.query.action.toUpperCase()}'`           : ''}
          ${req.query.user_id     ? ` AND al.user_id = ${parseInt(req.query.user_id)}`               : ''}
          ${req.query.entity_id   ? ` AND al.entity_id = ${parseInt(req.query.entity_id)}`           : ''}`
      ),
    ]);

    res.json({
      data: rows.rows,
      pagination: {
        total: parseInt(countRow.rows[0].count),
        limit,
        offset,
      },
    });
  } catch (error) {
    console.error('Audit logs error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== STATS ====================
app.get('/api/stats/law-firm/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.role !== 'admin' && req.user.lawFirmId != id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await pool.query(
      `SELECT
        lf.member_count, lf.case_count, lf.storage_used_mb,
        (SELECT COUNT(*) FROM cases    WHERE law_firm_id = $1 AND status = 'Active')   as active_cases,
        (SELECT COUNT(*) FROM cases    WHERE law_firm_id = $1 AND status = 'Closed')   as closed_cases,
        (SELECT COUNT(*) FROM cases    WHERE law_firm_id = $1 AND priority = 'high')   as high_priority_cases,
        (SELECT COUNT(*) FROM users    WHERE law_firm_id = $1 AND role = 'associate')  as associate_count,
        (SELECT COUNT(*) FROM users    WHERE law_firm_id = $1 AND role = 'admin')      as admin_count,
        (SELECT COUNT(*) FROM clients  WHERE law_firm_id = $1 AND status = 'active')   as active_clients,
        (SELECT COUNT(*) FROM invoices WHERE law_firm_id = $1 AND status = 'paid')     as paid_invoices,
        (SELECT COUNT(*) FROM invoices WHERE law_firm_id = $1 AND status = 'pending')  as pending_invoices,
        (SELECT COUNT(*) FROM invoices WHERE law_firm_id = $1 AND status = 'overdue')  as overdue_invoices,
        (SELECT COALESCE(SUM(amount), 0) FROM invoices WHERE law_firm_id = $1 AND status = 'paid') as total_revenue
       FROM law_firms lf WHERE lf.id = $1`,
      [id]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Law firm not found' });
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
    res.json({ status: 'OK', timestamp: new Date().toISOString(), database: 'Connected' });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({ status: 'ERROR', database: 'Connection failed', error: error.message });
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