import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Forwarded-Host, Origin, X-API-Key, X-Requested-With, Content-Type, Accept, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // GET /api/families
    if (req.method === 'GET') {
      const result = await sql`SELECT * FROM families ORDER BY name`;
      return res.json(result.rows);
    }

    // POST /api/families
    if (req.method === 'POST') {
      const { name, color } = req.body;
      const result = await sql`
        INSERT INTO families (name, color) 
        VALUES (${name}, ${color || '#4a90e2'})
        RETURNING *
      `;
      return res.json(result.rows[0]);
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: err.message });
  }
}
