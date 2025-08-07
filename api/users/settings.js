import pg from 'pg';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { token, username, email, password } = req.body;

  if (!token) {
    return res.status(401).json({ message: 'Authentication token not provided.' });
  }

  try {
    const decoded = jwt.verify(token, 'a-secure-secret-for-jwt');
    const { userId } = decoded;

    let passwordHash;
    if (password) {
      const saltRounds = 10;
      passwordHash = await bcrypt.hash(password, saltRounds);
    }

    const updatedUser = await pool.query(
      `UPDATE users SET 
        username = COALESCE($1, username), 
        email = COALESCE($2, email), 
        password_hash = COALESCE($3, password_hash)
      WHERE id = $4 
      RETURNING id, username, email, created_at`,
      [username, email, passwordHash, userId]
    );

    if (updatedUser.rows.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.status(200).json({ user: updatedUser.rows[0] });
  } catch (error) {
    console.error('Settings update error:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token.' });
    }
    res.status(500).json({ message: 'Internal Server Error' });
  }
}
