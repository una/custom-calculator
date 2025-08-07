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
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { login, password } = req.body;

  if (!login || !password) {
    return res.status(400).json({ message: 'Username/email and password are required.' });
  }

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1 OR username = $1', [login]);
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    // TODO: Replace hardcoded secret with process.env.JWT_SECRET in production
    const token = jwt.sign({ userId: user.id }, "a-secure-secret-for-jwt", {
      expiresIn: '1h',
    });

    res.status(200).json({ token, user: { id: user.id, username: user.username, email: user.email } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}
