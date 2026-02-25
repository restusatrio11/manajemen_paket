import { config } from 'dotenv';
config({ path: '.env.local' });

import { db } from './lib/db';
import { users } from './lib/db/schema';
import bcrypt from 'bcryptjs';

import { eq } from 'drizzle-orm';

async function seed() {
  console.log('Seeding initial admin user...');
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  try {
    const result = await db.update(users)
      .set({ password: hashedPassword })
      .where(eq(users.username, 'admin'))
      .returning();
    
    console.log('Admin password updated successfully:', result);
  } catch (error) {
    console.error('Error seeding admin user:', error);
  }
}

seed();
