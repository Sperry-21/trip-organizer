#!/usr/bin/env node

/**
 * Seed script for loading historical Moose trips into the database
 * Usage: POSTGRES_URL_NON_POOLING=<your-db-url> node seed-historical-trips.js
 */

const { sql } = require('@vercel/postgres');

const historicalTripsData = {
  "moose-2020": {
    "logistics": "- Bug Spray\n- Bottled Water\n- Paper Towels & shit tickets: 2-3 rolls per family\n- Sunblock\n- Towels\n- Floats\n- Ipod or phone stored w/ fav music\n- Fishing stuff\n- Sleeping bags for Kids\n- Keep Maine Healthy Certificates (adults)\n- Flashlight or headlamp\n- Bday presents for P$ obviously\n- 'Star Gazing' gear 👀☄️🌚🪐\n- white tees for the kids (tie dye)\n-camping charis for around the fire",
    "families": [],
    "meals": [],
    "startDate": "2020-08-14",
    "numDays": 4
  },
  "moose-22": {
    "logistics": "- Bug Spray\n- Bottled Water\n- Paper Towels & shit tickets: 2-3 rolls per family\n- Sunblock\n- Towels\n- Floats\n- Ipod or phone stored w/ fav music\n- Fishing stuff\n- Sleeping bags for Kids\n- Flashlight or headlamp\n- 'Star Gazing' gear 👀☄️🌚🪐\n- white tees for the kids (tie dye)\n- camping chairs for around the fire\n- ICE\n- Limes",
    "families": ["O'Connell", "Lucks", "Castellot", "Paul, Pete, Massi & Caroline", "Flynn", "Fallavollita", "Perry"],
    "meals": [
      { "family": "O'Connell", "meal_time": "Dinner", "food": "Pulled Pork with sesame noodles. Chicken nuggets and Mac & Cheese for the kids. Buffalo balls, Meatballs and Wangs", "date_offset": 1 },
      { "family": "Lucks", "meal_time": "Breakfast", "food": "Bagels, muffins & fruit", "date_offset": 2 },
      { "family": "Perry", "meal_time": "Dinner", "food": "Tacos with the fixings, fajita veg, corn salad, quesadillas for kids, fruit", "date_offset": 2 },
      { "family": "Flynn", "meal_time": "Dinner", "food": "Steak tips, corn on the cob, green salad, dogs & burgers for kids", "date_offset": 3 },
      { "family": "Fallavollita", "meal_time": "Breakfast", "food": "pancakes (reg & c.chip), breakfast casserole, bacon, potatoes, eggs", "date_offset": 1 },
      { "family": "Castellot", "meal_time": "Dinner", "food": "Grilled chicken thighs and London broil for adults and kids, kale salad, bread", "date_offset": 2 },
      { "family": "Paul, Pete, Massi & Caroline", "meal_time": "Lunch", "food": "Fennel and white bean salad. Noodle salad", "date_offset": 1 }
    ],
    "startDate": "2022-08-12",
    "numDays": 4
  },
  "moose-23": {
    "logistics": "- Bug Spray\n- Bottled Water\n- Paper Towels & shit tickets: 2-3 rolls per family\n- Sunblock\n- Towels\n- Floats\n- Ipod or phone stored w/ fav music\n- Fishing stuff - blue magic encouraged\n- Sleeping bags and air mattress for Kids\n- Flashlight or headlamp\n- 'Star Gazing' gear 👀☄️🌚🪐 *Perseids Meteor shower is Sat night*\n- Lawn games\n- camping chairs for around the fire\n- ICE\n- Limes\n- Snacks",
    "families": ["O'Connell", "Lucks", "Paul, Pete, Becky", "Castellot", "Flynn", "Fallavollita", "Perry"],
    "meals": [
      { "family": "O'Connell", "meal_time": "Dinner", "food": "Pulled Pork with corn salad. Buffalo Balls, Meatballs, Wangs", "date_offset": 0 },
      { "family": "Lucks", "meal_time": "Breakfast", "food": "Egg white bites, mixed fruit & pastries", "date_offset": 2 },
      { "family": "Perry", "meal_time": "Dinner", "food": "fajitas with fixings, corn salad, quesadillas for kids", "date_offset": 2 },
      { "family": "Flynn", "meal_time": "Dinner", "food": "Chicken pies, green salad, dogs & burgers for kids", "date_offset": 3 },
      { "family": "Fallavollita", "meal_time": "Breakfast", "food": "pancakes, breakfast casseroles, bacon, potatoes, eggs", "date_offset": 1 },
      { "family": "Castellot", "meal_time": "Dinner", "food": "Honey butter chicken thighs, grilled steak, orzo salad, bread", "date_offset": 1 },
      { "family": "Paul, Pete, Becky", "meal_time": "Lunch", "food": "Salads and snacks", "date_offset": 1 }
    ],
    "startDate": "2023-08-11",
    "numDays": 4
  },
  "moose-24": {
    "logistics": "- Bug Spray\n- Bottled Water\n- Paper Towels & shit tickets: 2-3 rolls per family\n- Sunblock\n- Towels\n- Floats\n- Ipod or phone stored w/ fav music\n- Fishing stuff\n- Sleeping bags and air mattress for Kids in your room\n- Flashlight or headlamp\n- 'Star Gazing' gear 👀☄️🌚🪐\n- camping chairs for around the fire\n- ICE\n- Limes",
    "families": ["O'Connell", "Fallavollita", "Castellot", "Perry", "Hallett", "Ava", "Pete", "2Paulz"],
    "meals": [
      { "family": "Castellot", "meal_time": "Dinner", "food": "Grilled steak and shrimp with chimichurri, kale salad, Potatoes, bread", "date_offset": 0 },
      { "family": "Fallavollita", "meal_time": "Breakfast", "food": "Eggs, bacon, potatoes", "date_offset": 1 },
      { "family": "Perry", "meal_time": "Lunch", "food": "BBQ Chicken sandwiches w slaw, green salad with roasted corn, watermelon", "date_offset": 1 },
      { "family": "Ava", "meal_time": "Dinner", "food": "Dirty chicken & beef street tacos with all the toppings, rice & beans", "date_offset": 1 },
      { "family": "2Paulz", "meal_time": "Breakfast", "food": "Fruit, muffins, yogurt, toast", "date_offset": 2 },
      { "family": "O'Connell", "meal_time": "Lunch", "food": "Meatball Grilled Cheese", "date_offset": 2 },
      { "family": "Hallett", "meal_time": "Dinner", "food": "Pulled pork sliders, hotdogs & sausage, Mac N Chz, coleslaw, cornbread", "date_offset": 2 },
      { "family": "Pete", "meal_time": "Breakfast", "food": "Pancakes and coffee", "date_offset": 3 }
    ],
    "startDate": "2024-08-16",
    "numDays": 5
  },
  "moose-25": {
    "logistics": "- Snacks\n- Ice\n- Paper Towels & shit tickets: 2-3 rolls per family\n- Bottled Water/ Gatorades\n- camping chairs for around the fire\n- Floats\n- Ipod or phone stored w/ fav music\n- Fishing stuff\n- Sleeping bags and air mattress for Kids in your room\n- Flashlight or headlamp\n- 'Star Gazing' gear 👀☄️🌚🪐\n- Lawn games\n- -LIMES!!",
    "families": ["O'Connell", "Fallavollita", "Castellot", "Perry", "Hallett", "Ava", "Pete", "2Paulz", "Lucks", "Flynn", "Massi", "Paul"],
    "meals": [
      { "family": "Castellot", "meal_time": "Dinner", "food": "Grilled steak and shrimp with chimichurri, kale salad, Potatoes, bread", "date_offset": 0 },
      { "family": "Fallavollita", "meal_time": "Breakfast", "food": "Eggs, bacon, potatoes", "date_offset": 1 },
      { "family": "Perry", "meal_time": "Lunch", "food": "BBQ Chicken sandwiches w slaw and homemade pickles, green salad with roasted corn and herby ranch, watermelon", "date_offset": 1 },
      { "family": "Ava", "meal_time": "Dinner", "food": "Dirty chicken & beef street tacos with all the toppings, rice & beans", "date_offset": 1 },
      { "family": "2Paulz", "meal_time": "Breakfast", "food": "Fruit, muffins, yogurt, toast", "date_offset": 2 },
      { "family": "O'Connell", "meal_time": "Lunch", "food": "Meatball Grilled Cheese", "date_offset": 2 },
      { "family": "Hallett", "meal_time": "Dinner", "food": "Pulled pork sliders, hotdogs & sausage, Mac N Chz, coleslaw, carrots/cucumbers, cornbread", "date_offset": 2 },
      { "family": "Lucks", "meal_time": "Breakfast", "food": "Bagels, cream cheese, fruit, muffins", "date_offset": 3 },
      { "family": "Flynn", "meal_time": "Lunch", "food": "Subs and sides", "date_offset": 3 }
    ],
    "startDate": "2025-08-15",
    "numDays": 5
  }
};

async function seedDatabase() {
  try {
    console.log('🌱 Starting historical trips seed...\n');

    for (const [tripId, tripData] of Object.entries(historicalTripsData)) {
      console.log(`📍 Processing ${tripId}...`);

      // 1. Create trip if not exists
      await sql`
        INSERT INTO trips (trip_id, name, created_at)
        VALUES (${tripId}, ${tripId}, NOW())
        ON CONFLICT (trip_id) DO NOTHING
      `;

      // 2. Create families
      const families = [];
      for (const familyName of tripData.families) {
        const result = await sql`
          INSERT INTO families (name, created_at)
          VALUES (${familyName}, NOW())
          ON CONFLICT (name) DO UPDATE SET name = ${familyName}
          RETURNING id, name
        `;
        if (result.rows.length > 0) {
          families.push(result.rows[0]);
        }
      }

      // 3. Create trip metadata
      const familiesJson = JSON.stringify(families.map(f => ({ id: f.id, name: f.name })));
      const logisticsJson = JSON.stringify(tripData.logistics.split('\n').map(line => line.trim()).filter(Boolean));

      await sql`
        INSERT INTO trip_metadata (trip_id, start_date, num_days, families, logistics, created_at)
        VALUES (${tripId}, ${tripData.startDate}::date, ${tripData.numDays}, ${familiesJson}, ${logisticsJson}, NOW())
        ON CONFLICT (trip_id) DO UPDATE SET 
          start_date = ${tripData.startDate}::date,
          num_days = ${tripData.numDays},
          families = ${familiesJson},
          logistics = ${logisticsJson}
      `;

      // 4. Create meals
      for (const meal of tripData.meals) {
        const mealDate = new Date(tripData.startDate);
        mealDate.setDate(mealDate.getDate() + (meal.date_offset || 0));
        const dateStr = mealDate.toISOString().split('T')[0];

        const familyId = families.find(f => f.name === meal.family)?.id;

        if (familyId) {
          await sql`
            INSERT INTO trip_meals (trip_id, meal_date, meal_time, meal_name, family_id, meal_category, description, created_at)
            VALUES (${tripId}, ${dateStr}::date, ${meal.meal_time}, ${meal.family}, ${familyId}, 'Main Meal', ${meal.food}, NOW())
            ON CONFLICT DO NOTHING
          `;
        }
      }

      console.log(`✓ ${tripId} loaded!\n`);
    }

    console.log('🎉 All historical trips seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
