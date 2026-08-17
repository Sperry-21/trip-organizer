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
    await sql`CREATE TABLE IF NOT EXISTS trip_meals (id SERIAL PRIMARY KEY, trip_id VARCHAR(255) NOT NULL, meal_date DATE NOT NULL, meal_time VARCHAR(50), meal_name VARCHAR(255), family_id INTEGER REFERENCES families(id), meal_category VARCHAR(50) DEFAULT 'Main Meal', description TEXT, headcount INTEGER, created_at TIMESTAMP DEFAULT NOW());`;
    await sql`CREATE TABLE IF NOT EXISTS trips (id SERIAL PRIMARY KEY,  trip_id VARCHAR(255) UNIQUE NOT NULL,  name VARCHAR(255),  created_at TIMESTAMP DEFAULT NOW())`;
    await sql`CREATE TABLE IF NOT EXISTS trip_metadata (id SERIAL PRIMARY KEY, trip_id VARCHAR(255) UNIQUE NOT NULL REFERENCES trips(trip_id) ON DELETE CASCADE, start_date TEXT, num_days INTEGER, families TEXT, logistics TEXT, created_at TIMESTAMP DEFAULT NOW());`;
    await sql`CREATE TABLE IF NOT EXISTS trip_other_stuff ( id SERIAL PRIMARY KEY,  trip_id VARCHAR(255) NOT NULL,  family_id INTEGER REFERENCES families(id),  item TEXT NOT NULL,  created_at TIMESTAMP DEFAULT NOW())`;

    // Add logistics column to trip_metadata if it doesn't exist (for existing databases)
    try {
      await sql`ALTER TABLE trip_metadata ADD COLUMN logistics TEXT`;
    } catch (e) {
      // Column probably already exists, that's fine
    }
    
    // Add meal_category column to trip_meals if it doesn't exist (for existing databases)
    try {
      await sql`ALTER TABLE trip_meals ADD COLUMN meal_category VARCHAR(50) DEFAULT 'Main Meal'`;
    } catch (e) {
      // Column probably already exists, that's fine
    }

    // Migrate start_date from DATE to TEXT type (handles timezone conversion issue)
    try {
      await sql`ALTER TABLE trip_metadata ALTER COLUMN start_date TYPE TEXT USING start_date::text`;
    } catch (e) {
      // Column is probably already TEXT, that's fine
    }

    // Add headcount column to trip_meals if it doesn't exist (for existing databases)
    try {
      await sql`ALTER TABLE trip_meals ADD COLUMN headcount INTEGER`;
    } catch (e) {
      // Column probably already exists, that's fine
    }

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
    const { tripId, startDate, numDays, families } = req.body;
    if (!tripId) return res.status(400).json({ error: 'tripId required' });

    console.log('Creating trip:', { tripId, startDate, numDays, families });

    // Insert into trips table
    await sql`INSERT INTO trips(trip_id, name) VALUES(${ tripId }, ${ tripId })`;

    // Always insert metadata (even if some fields are null)
    try {
      const familiesJson = families ? JSON.stringify(families) : null;
      
      // Handle multiple date formats: YYYY-MM-DD (from date input) or mm/dd/yyyy (from form)
      let formattedDate = null;
      if (startDate) {
        if (startDate.includes('-')) {
          // Already YYYY-MM-DD format
          formattedDate = startDate;
        } else if (startDate.includes('/')) {
          // mm/dd/yyyy format - convert to YYYY-MM-DD
          const parts = startDate.split('/');
          if (parts.length === 3) {
            const [month, day, year] = parts;
            formattedDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          }
        } else {
          // Assume it's already in a parseable format, use as-is without timezone conversion
          formattedDate = startDate;
        }
      }
      
      const parsedNumDays = numDays ? parseInt(numDays) : null;
      
      console.log('Inserting metadata:', { tripId, formattedDate, parsedNumDays, familiesCount: families?.length });
      
      await sql`INSERT INTO trip_metadata(trip_id, start_date, num_days, families) VALUES(${ tripId }, ${ formattedDate }, ${ parsedNumDays }, ${ familiesJson })`;
      console.log('Metadata inserted successfully');
    } catch (metaErr) {
      console.error('Error inserting metadata:', metaErr);
      console.error('Full error:', JSON.stringify(metaErr, null, 2));
      return res.status(500).json({ error: 'Failed to save trip metadata: ' + metaErr.message });
    }

    res.json({ success: true, tripId });
  } catch (err) {
    console.error('Error creating trip:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/trips/:tripId', async (req, res) => {
  try {
    const { tripId } = req.params;
    const result = await sql`SELECT t.*, m.start_date, m.num_days, m.families, m.logistics FROM trips t LEFT JOIN trip_metadata m ON t.trip_id = m.trip_id WHERE t.trip_id = ${ tripId }`;
    if (result.rows.length === 0) return res.status(404).json({ error: 'Trip not found' });
    const trip = result.rows[0];
    // Parse logistics if it's JSON
    if (trip.logistics && typeof trip.logistics === 'string') {
      try {
        trip.logistics = JSON.parse(trip.logistics);
      } catch (e) {
        trip.logistics = [];
      }
    }
    res.json(trip);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/trips/:tripId', async (req, res) => {
  try {
    const { tripId } = req.params;
    const { startDate, numDays, families, logistics } = req.body;
    const familiesJson = families ? JSON.stringify(families) : null;
    const logisticsJson = logistics ? JSON.stringify(logistics) : null;
    
    // Use COALESCE to only update fields that are provided, keep existing values for others
    await sql`UPDATE trip_metadata SET start_date = COALESCE(${ startDate }, start_date), num_days = COALESCE(${ numDays }, num_days), families = COALESCE(${ familiesJson }, families), logistics = COALESCE(${ logisticsJson }, logistics) WHERE trip_id = ${ tripId }`;
    res.json({ success: true });
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
    // Normalize meal_date to YYYY-MM-DD format
    const meals = result.rows.map(meal => ({
      ...meal,
      meal_date: new Date(meal.meal_date).toISOString().split('T')[0]
    }));
    res.json(meals);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/trips/:tripId/meals', async (req, res) => {
  try {
    const { tripId } = req.params;
    let { meal_date, meal_time, meal_name, family_id, description, meal_category, headcount } = req.body;
    // Normalize date to YYYY-MM-DD
    meal_date = new Date(meal_date).toISOString().split('T')[0];
    meal_category = meal_category || 'Main Meal';
    await sql`INSERT INTO trip_meals(trip_id, meal_date, meal_time, meal_name, family_id, description, meal_category, headcount) VALUES(${ tripId }, ${ meal_date }, ${ meal_time }, ${ meal_name || null}, ${ family_id }, ${ description || null}, ${ meal_category }, ${ headcount || null})`;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/trips/:tripId/meals/:id', async (req, res) => {
  try {
    const { tripId, id } = req.params;
    const { meal_name, family_id, description, meal_date, meal_time, meal_category, headcount } = req.body;
    await sql`UPDATE trip_meals SET meal_name = COALESCE(${ meal_name }, meal_name), family_id = COALESCE(${ family_id }, family_id), description = COALESCE(${ description }, description), meal_date = COALESCE(${ meal_date }, meal_date), meal_time = COALESCE(${ meal_time }, meal_time), meal_category = COALESCE(${ meal_category }, meal_category), headcount = COALESCE(${ headcount }, headcount) WHERE id = ${ id } AND trip_id = ${ tripId } `;
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
