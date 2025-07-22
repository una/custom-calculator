import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config({ path: '.env.development.local' });
const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function migrateDefinitions() {
  try {
    const result = await pool.query('SELECT id, definition FROM custom_functions');
    for (const row of result.rows) {
      try {
        JSON.parse(row.definition);
      } catch (e) {
        const newDefinition = {
          expression: row.definition,
          variables: '', // Add a default value for variables
          type: 'single',
        };
        await pool.query('UPDATE custom_functions SET definition = $1 WHERE id = $2', [JSON.stringify(newDefinition), row.id]);
        console.log(`Migrated function with id ${row.id}`);
      }
    }
    console.log('Migration complete.');
  } catch (error) {
    console.error('Error migrating definitions:', error);
  } finally {
    await pool.end();
  }
}

migrateDefinitions();
