import express from 'express';
import cors from 'cors';
import { sql } from '@vercel/postgres';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Initialize database on startup
async function initDb() {
  try {
    await sql`
<<<<<<< HEAD
      CREATE TABLE IF NOT EXISTS families (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        color VARCHAR(7) DEFAULT '#4a90e2',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `;
    
    await sql`
=======
>>>>>>> 8f007f66d78131e93d9c0bc3daa05c44a2d9f694
      CREATE TABLE IF NOT EXISTS trip_items (
        id BIGINT PRIMARY KEY,
        trip_id VARCHAR(255) NOT NULL,
        person VARCHAR(255) NOT NULL,
        item VARCHAR(255) NOT NULL,
        category VARCHAR(255) NOT NULL,
        notes TEXT,
        completed BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `;
<<<<<<< HEAD
    
    await sql`
      CREATE TABLE IF NOT EXISTS trip_meals (
        id SERIAL PRIMARY KEY,
        trip_id VARCHAR(255) NOT NULL,
        meal_date DATE NOT NULL,
        meal_time VARCHAR(50),
        meal_name VARCHAR(255),
        family_id INTEGER REFERENCES families(id),
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `;
    
    // Seed default families if they don't exist
    const defaultFamilies = ['Castellot', 'Fallavollita', 'Perry', "O'Connell", 'Ava', 'Hallett', '2Paulz', 'Pete'];
    const colors = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#00f2fe', '#43e97b', '#fa709a', '#fee140'];
    
    for (let i = 0; i < defaultFamilies.length; i++) {
      try {
        await sql`
          INSERT INTO families (name, color) 
          VALUES (${defaultFamilies[i]}, ${colors[i]})
          ON CONFLICT DO NOTHING
        `;
      } catch (e) {
        // Family already exists
      }
    }
    
=======
>>>>>>> 8f007f66d78131e93d9c0bc3daa05c44a2d9f694
    console.log('✓ Database initialized');
  } catch (err) {
    console.error('❌ Database init error:', err.message);
  }
}

// Routes
app.get('/api/trips/:tripId/items', async (req, res) => {
  try {
    const { tripId } = req.params;
    const result = await sql`
      SELECT * FROM trip_items 
      WHERE trip_id = ${tripId}
      ORDER BY created_at DESC
    `;
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/trips/:tripId/items', async (req, res) => {
  try {
    const { tripId } = req.params;
    const { id, person, item, category, notes } = req.body;
    
    await sql`
      INSERT INTO trip_items 
      (id, trip_id, person, item, category, notes, completed)
      VALUES (${id}, ${tripId}, ${person}, ${item}, ${category}, ${notes}, false)
    `;
    
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/trips/:tripId/items/:id', async (req, res) => {
  try {
    const { tripId, id } = req.params;
    const { completed, person, item, category, notes } = req.body;
    
    await sql`
      UPDATE trip_items 
      SET 
        completed = COALESCE(${completed}, completed),
        person = COALESCE(${person}, person),
        item = COALESCE(${item}, item),
        category = COALESCE(${category}, category),
        notes = COALESCE(${notes}, notes)
      WHERE id = ${id} AND trip_id = ${tripId}
    `;
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/trips/:tripId/items/:id', async (req, res) => {
  try {
    const { tripId, id } = req.params;
    
    await sql`
      DELETE FROM trip_items 
      WHERE id = ${id} AND trip_id = ${tripId}
    `;
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve index.html for root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

<<<<<<< HEAD
// FAMILIES ENDPOINTS
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
    const result = await sql`
      INSERT INTO families (name, color) 
      VALUES (${name}, ${color || '#4a90e2'})
      RETURNING *
    `;
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// MEALS ENDPOINTS
app.get('/api/trips/:tripId/meals', async (req, res) => {
  try {
    const { tripId } = req.params;
    const result = await sql`
      SELECT tm.*, f.name as family_name, f.color 
      FROM trip_meals tm
      LEFT JOIN families f ON tm.family_id = f.id
      WHERE tm.trip_id = ${tripId}
      ORDER BY tm.meal_date, tm.meal_time
    `;
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/trips/:tripId/meals', async (req, res) => {
  try {
    const { tripId } = req.params;
    const { meal_date, meal_time, meal_name, family_id, description } = req.body;
    
    const result = await sql`
      INSERT INTO trip_meals (trip_id, meal_date, meal_time, meal_name, family_id, description)
      VALUES (${tripId}, ${meal_date}, ${meal_time}, ${meal_name}, ${family_id}, ${description})
      RETURNING *
    `;
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/trips/:tripId/meals/:id', async (req, res) => {
  try {
    const { tripId, id } = req.params;
    const { meal_name, family_id, description, meal_date, meal_time } = req.body;
    
    await sql`
      UPDATE trip_meals 
      SET 
        meal_name = COALESCE(${meal_name}, meal_name),
        family_id = COALESCE(${family_id}, family_id),
        description = COALESCE(${description}, description),
        meal_date = COALESCE(${meal_date}, meal_date),
        meal_time = COALESCE(${meal_time}, meal_time)
      WHERE id = ${id} AND trip_id = ${tripId}
    `;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/trips/:tripId/meals/:id', async (req, res) => {
  try {
    const { tripId, id } = req.params;
    
    await sql`
      DELETE FROM trip_meals 
      WHERE id = ${id} AND trip_id = ${tripId}
    `;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

=======
>>>>>>> 8f007f66d78131e93d9c0bc3daa05c44a2d9f694
// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3000;

// Initialize DB and start server
initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
});
