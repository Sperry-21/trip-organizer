import express from 'express';
import { sql } from '@vercel/postgres';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Initialize DB
async function initDb() {
  try {
    await sql`CREATE TABLE IF NOT EXISTS families (id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL UNIQUE, color VARCHAR(7) DEFAULT '#4a90e2', created_at TIMESTAMP DEFAULT NOW());`;
    await sql`CREATE TABLE IF NOT EXISTS trip_items (id BIGINT PRIMARY KEY, trip_id VARCHAR(255) NOT NULL, person VARCHAR(255) NOT NULL, item VARCHAR(255) NOT NULL, category VARCHAR(255) NOT NULL, notes TEXT, completed BOOLEAN DEFAULT false, created_at TIMESTAMP DEFAULT NOW());`;
    await sql`CREATE TABLE IF NOT EXISTS trip_meals (id SERIAL PRIMARY KEY, trip_id VARCHAR(255) NOT NULL, meal_date DATE NOT NULL, meal_time VARCHAR(50), meal_name VARCHAR(255), family_id INTEGER REFERENCES families(id), description TEXT, created_at TIMESTAMP DEFAULT NOW());`;
    await sql`CREATE TABLE IF NOT EXISTS trips (id SERIAL PRIMARY KEY,  trip_id VARCHAR(255) UNIQUE NOT NULL,  name VARCHAR(255),  created_at TIMESTAMP DEFAULT NOW())`;
    await sql`CREATE TABLE IF NOT EXISTS trip_other_stuff ( id SERIAL PRIMARY KEY,  trip_id VARCHAR(255) NOT NULL,  family_id INTEGER REFERENCES families(id),  item TEXT NOT NULL,  created_at TIMESTAMP DEFAULT NOW()
)`;

    const defaultFamilies = ['Castellot', 'Fallavollita', 'Perry', "O'Connell", 'Ava', 'Hallett', '2Paulz', 'Pete'];
    const colors = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#00f2fe', '#43e97b', '#fa709a', '#fee140'];
    for (let i = 0; i < defaultFamilies.length; i++) {
      try {
        await sql`INSERT INTO families(name, color) VALUES(${ defaultFamilies[i]}, ${ colors[i]}) ON CONFLICT DO NOTHING`;
      } catch (e) { }
    }
  } catch (err) {
    console.error('DB init error:', err.message);
  }
}

// API Routes
app.get('/api/families', async (req, res) => {
  try {
    const result = await sql`SELECT * FROM families ORDER BY name`;
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/families', async (req, res) => {
  try {
    const { name, color } = req.body;
    const result = await sql`INSERT INTO families(name, color) VALUES(${ name }, ${ color || '#4a90e2'}) RETURNING * `;
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/families/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await sql`DELETE FROM families WHERE id = ${ id } `;
    res.json({ success: true });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/trips', async (req, res) => {
  try {
    const result = await sql`SELECT trip_id FROM trips ORDER BY created_at DESC`;
    res.json(result.rows.map(r => r.trip_id));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/trips', async (req, res) => {
  try {
    const { tripId } = req.body;
    if (!tripId) return res.status(400).json({ error: 'tripId required' });

    // Insert into trips table
    await sql`INSERT INTO trips(trip_id, name) VALUES(${ tripId }, ${ tripId })`;

    res.json({ success: true, tripId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/trips/:tripId', async (req, res) => {
  try {
    const { tripId } = req.params;
    await sql`DELETE FROM trip_items WHERE trip_id = ${ tripId } `;
    await sql`DELETE FROM trips WHERE trip_id = ${ tripId } `;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/trips/:tripId/items', async (req, res) => {
  try {
    const { tripId } = req.params;
    const result = await sql`SELECT * FROM trip_items WHERE trip_id = ${ tripId } ORDER BY created_at DESC`;
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/trips/:tripId/items', async (req, res) => {
  try {
    const { tripId } = req.params;
    const { id, person, item, category, notes } = req.body;
    await sql`INSERT INTO trip_items(id, trip_id, person, item, category, notes) VALUES(${ id }, ${ tripId }, ${ person }, ${ item }, ${ category }, ${ notes || null})`;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/trips/:tripId/items/:id', async (req, res) => {
  try {
    const { tripId, id } = req.params;
    const { completed } = req.body;
    await sql`UPDATE trip_items SET completed = ${ completed } WHERE id = ${ id } AND trip_id = ${ tripId } `;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/trips/:tripId/items/:id', async (req, res) => {
  try {
    const { tripId, id } = req.params;
    await sql`DELETE FROM trip_items WHERE id = ${ id } AND trip_id = ${ tripId } `;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/trips/:tripId/meals', async (req, res) => {
  try {
    const { tripId } = req.params;
    const result = await sql`SELECT tm.*, f.name as family_name, f.color FROM trip_meals tm LEFT JOIN families f ON tm.family_id = f.id WHERE tm.trip_id = ${ tripId } ORDER BY tm.meal_date, tm.meal_time`;
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/trips/:tripId/meals', async (req, res) => {
  try {
    const { tripId } = req.params;
    const { meal_date, meal_time, meal_name, family_id, description } = req.body;
    await sql`INSERT INTO trip_meals(trip_id, meal_date, meal_time, meal_name, family_id, description) VALUES(${ tripId }, ${ meal_date }, ${ meal_time }, ${ meal_name || null}, ${ family_id }, ${ description || null})`;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/trips/:tripId/meals/:id', async (req, res) => {
  try {
    const { tripId, id } = req.params;
    const { meal_name, family_id, description, meal_date, meal_time } = req.body;
    await sql`UPDATE trip_meals SET meal_name = COALESCE(${ meal_name }, meal_name), family_id = COALESCE(${ family_id }, family_id), description = COALESCE(${ description }, description), meal_date = COALESCE(${ meal_date }, meal_date), meal_time = COALESCE(${ meal_time }, meal_time) WHERE id = ${ id } AND trip_id = ${ tripId } `;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/trips/:tripId/meals/:id', async (req, res) => {
  try {
    const { tripId, id } = req.params;
    await sql`DELETE FROM trip_meals WHERE id = ${ id } AND trip_id = ${ tripId } `;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/trips/:tripId/other-stuff', async (req, res) => {
  try {
    const { tripId } = req.params;
    const result = await sql`
      SELECT os.id, os.family_id, f.name, f.color, os.item
      FROM trip_other_stuff os
      LEFT JOIN families f ON os.family_id = f.id
      WHERE os.trip_id = ${tripId}
      ORDER BY f.name, os.created_at
    `;
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/trips/:tripId/other-stuff', async (req, res) => {
  try {
    const { tripId } = req.params;
    const { familyId, item } = req.body;
    
    await sql`INSERT INTO trip_other_stuff (trip_id, family_id, item) 
              VALUES (${tripId}, ${familyId}, ${item})`;
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/trips/:tripId/other-stuff/:id', async (req, res) => {
  try {
    const { tripId, id } = req.params;
    await sql`DELETE FROM trip_other_stuff WHERE id = ${id} AND trip_id = ${tripId}`;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

initDb();
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${ port } `));
// Updated
// v2.1
