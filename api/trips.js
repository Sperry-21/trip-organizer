import { sql } from '@vercel/postgres';

// Initialize database
async function initDb() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS families (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        color VARCHAR(7) DEFAULT '#4a90e2',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `;
    
    await sql`
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
    
    // Seed default families
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
  } catch (err) {
    console.error('DB init error:', err.message);
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Forwarded-Host, Origin, X-API-Key, X-Requested-With, Content-Type, Accept, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  await initDb();

  const { tripId } = req.query;
  const path = req.url.split('?')[0];

  try {
    // GET /api/trips/[tripId]/items
    if (req.method === 'GET' && path.includes('/items') && !path.includes('/meals')) {
      const result = await sql`
        SELECT * FROM trip_items 
        WHERE trip_id = ${tripId}
        ORDER BY created_at DESC
      `;
      return res.json(result.rows);
    }

    // POST /api/trips/[tripId]/items
    if (req.method === 'POST' && path.includes('/items') && !path.includes('/meals')) {
      const { id, person, item, category, notes } = req.body;
      await sql`
        INSERT INTO trip_items (id, trip_id, person, item, category, notes)
        VALUES (${id}, ${tripId}, ${person}, ${item}, ${category}, ${notes || null})
      `;
      return res.json({ success: true });
    }

    // PATCH /api/trips/[tripId]/items/[id]
    if (req.method === 'PATCH' && path.includes('/items') && !path.includes('/meals')) {
      const itemId = path.split('/').pop();
      const { completed } = req.body;
      await sql`
        UPDATE trip_items 
        SET completed = ${completed}
        WHERE id = ${itemId} AND trip_id = ${tripId}
      `;
      return res.json({ success: true });
    }

    // DELETE /api/trips/[tripId]/items/[id]
    if (req.method === 'DELETE' && path.includes('/items') && !path.includes('/meals')) {
      const itemId = path.split('/').pop();
      await sql`
        DELETE FROM trip_items 
        WHERE id = ${itemId} AND trip_id = ${tripId}
      `;
      return res.json({ success: true });
    }

    // GET /api/trips/[tripId]/meals
    if (req.method === 'GET' && path.includes('/meals')) {
      const result = await sql`
        SELECT tm.*, f.name as family_name, f.color 
        FROM trip_meals tm
        LEFT JOIN families f ON tm.family_id = f.id
        WHERE tm.trip_id = ${tripId}
        ORDER BY tm.meal_date, tm.meal_time
      `;
      return res.json(result.rows);
    }

    // POST /api/trips/[tripId]/meals
    if (req.method === 'POST' && path.includes('/meals')) {
      const { meal_date, meal_time, meal_name, family_id, description } = req.body;
      await sql`
        INSERT INTO trip_meals (trip_id, meal_date, meal_time, meal_name, family_id, description)
        VALUES (${tripId}, ${meal_date}, ${meal_time}, ${meal_name || null}, ${family_id}, ${description || null})
      `;
      return res.json({ success: true });
    }

    // PATCH /api/trips/[tripId]/meals/[id]
    if (req.method === 'PATCH' && path.includes('/meals')) {
      const mealId = path.split('/').pop();
      const { meal_name, family_id, description, meal_date, meal_time } = req.body;
      await sql`
        UPDATE trip_meals 
        SET 
          meal_name = COALESCE(${meal_name}, meal_name),
          family_id = COALESCE(${family_id}, family_id),
          description = COALESCE(${description}, description),
          meal_date = COALESCE(${meal_date}, meal_date),
          meal_time = COALESCE(${meal_time}, meal_time)
        WHERE id = ${mealId} AND trip_id = ${tripId}
      `;
      return res.json({ success: true });
    }

    // DELETE /api/trips/[tripId]/meals/[id]
    if (req.method === 'DELETE' && path.includes('/meals')) {
      const mealId = path.split('/').pop();
      await sql`
        DELETE FROM trip_meals 
        WHERE id = ${mealId} AND trip_id = ${tripId}
      `;
      return res.json({ success: true });
    }

    res.status(404).json({ error: 'Not found' });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: err.message });
  }
}
