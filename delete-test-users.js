// Script to delete test users from Supabase
// Run with: node delete-test-users.js

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // You'll need service role key

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  console.log('Make sure you have:');
  console.log('- VITE_SUPABASE_URL in .env');
  console.log('- SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

// Create Supabase client with service role key (for admin operations)
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function deleteTestUsers() {
  try {
    console.log('🔍 Searching for test users...');

    // Get all users with test emails
    const { data: users, error: fetchError } =
      await supabase.auth.admin.listUsers();

    if (fetchError) {
      console.error('❌ Error fetching users:', fetchError);
      return;
    }

    // Filter test users
    const testUsers = users.users.filter(
      (user) =>
        user.email &&
        (user.email.includes('testuser') ||
          user.email.includes('test-') ||
          user.email.includes('@example.com'))
    );

    console.log(`📊 Found ${testUsers.length} test users:`);
    testUsers.forEach((user) => {
      console.log(`  - ${user.email} (${user.id})`);
    });

    if (testUsers.length === 0) {
      console.log('✅ No test users found to delete');
      return;
    }

    // Delete each test user
    console.log('\n🗑️ Deleting test users...');
    for (const user of testUsers) {
      const { error: deleteError } = await supabase.auth.admin.deleteUser(
        user.id
      );

      if (deleteError) {
        console.error(`❌ Failed to delete ${user.email}:`, deleteError);
      } else {
        console.log(`✅ Deleted ${user.email}`);
      }
    }

    console.log('\n🎉 Test user cleanup complete!');
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the cleanup
deleteTestUsers();

