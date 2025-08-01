import pg from 'pg';
import jwt from 'jsonwebtoken';

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

const authenticateToken = (handler) => async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.status(401).end();

  // TODO: Replace hardcoded secret with process.env.JWT_SECRET in production
  jwt.verify(token, "a-secure-secret-for-jwt", (err, user) => {
    if (err) return res.status(403).end();
    req.user = user;
    return handler(req, res);
  });
};

async function functionsHandler(req, res) {
  const { userId } = req.user;
  const { name: functionName, id: functionId } = req.query;

  if (req.method === 'GET') {
    try {
      const result = await pool.query('SELECT * FROM custom_functions WHERE user_id = $1', [userId]);
      res.status(200).json(result.rows);
    } catch (error) {
      console.error('Error fetching functions:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  } else if (req.method === 'POST') {
    const { name, definition } = req.body;
    if (!name || !definition) {
      return res.status(400).json({ message: 'Name and definition are required.' });
    }
    try {
      const result = await pool.query(
        'INSERT INTO custom_functions (user_id, name, definition) VALUES ($1, $2, $3) RETURNING *',
        [userId, name, JSON.stringify(definition)]
      );
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Error creating function:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  } else if (req.method === 'PUT') {
    const { name, definition } = req.body;
    if (!definition || !name) {
      return res.status(400).json({ message: 'Name and definition are required.' });
    }
    try {
      const result = await pool.query(
        'UPDATE custom_functions SET name = $1, definition = $2 WHERE user_id = $3 AND id = $4 RETURNING *',
        [name, JSON.stringify(definition), userId, functionId]
      );
      res.status(200).json(result.rows[0]);
    } catch (error) {
      console.error('Error updating function:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  } else if (req.method === 'DELETE') {
    try {
      await pool.query('DELETE FROM custom_functions WHERE user_id = $1 AND id = $2', [userId, functionId]);
      res.status(204).end();
    } catch (error) {
      console.error('Error deleting function:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

export default authenticateToken(functionsHandler);
