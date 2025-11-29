const db = require('./db');
const fs = require('fs');

async function setupDatabase() {
  try {
    console.log('📦 Reading schema.sql...');
    const schema = fs.readFileSync('./schema.sql', 'utf8');
    
    console.log('🔧 Creating database schema...');
    await db.query(schema);
    
    console.log('✅ Database schema created successfully!');
    console.log('✅ Tables created: users, notes, purchases, subscriptions, ai_jobs, reviews, ads, payouts, referrals');
    console.log('✅ Sample data inserted!');
    
    // Verify tables were created
    const result = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log('\n📋 Tables in database:');
    result.rows.forEach(row => console.log(`  - ${row.table_name}`));
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting up database:', error.message);
    console.error(error);
    process.exit(1);
  }
}

setupDatabase();