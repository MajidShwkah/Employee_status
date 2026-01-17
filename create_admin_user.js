/**
 * Script to create your first admin user
 * 
 * This script uses Supabase's Admin API to create a user
 * You need your SERVICE_ROLE_KEY (not anon key) for this
 * 
 * Usage:
 * 1. Install: npm install @supabase/supabase-js
 * 2. Update SUPABASE_URL and SERVICE_ROLE_KEY below
 * 3. Update the user details (email, password, name)
 * 4. Run: node create_admin_user.js
 */

import { createClient } from '@supabase/supabase-js';

// ⚠️ IMPORTANT: Use SERVICE_ROLE_KEY, not anon key!
// Get this from: Supabase Dashboard → Settings → API → service_role key
const SUPABASE_URL = 'https://dmmmwudmypwcchkxchlg.supabase.co';
const SERVICE_ROLE_KEY = 'YOUR_SERVICE_ROLE_KEY'; // ⚠️ Replace this!

// User details to create
const adminUser = {
  email: 'admin@example.com',        // Change this
  password: 'SecurePassword123!',     // Change this
  full_name: 'Admin User',            // Change this
  role: 'admin'
};

async function createAdminUser() {
  // Create admin client (uses service role key for admin operations)
  const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    console.log('Creating admin user...');
    
    // Step 1: Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: adminUser.email,
      password: adminUser.password,
      email_confirm: true, // Auto-confirm email (no confirmation needed)
      user_metadata: {
        full_name: adminUser.full_name
      }
    });

    if (authError) {
      console.error('Error creating auth user:', authError);
      return;
    }

    console.log('✅ Auth user created:', authData.user.id);

    // Step 2: Create profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: authData.user.id,
        full_name: adminUser.full_name,
        role: adminUser.role,
        status: 'free',
        avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(adminUser.full_name)}&background=4F46E5&color=fff&size=128`
      });

    if (profileError) {
      console.error('Error creating profile:', profileError);
      return;
    }

    console.log('✅ Profile created successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('   Email:', adminUser.email);
    console.log('   Password:', adminUser.password);
    console.log('\n🎉 You can now login to the admin panel!');

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the function
createAdminUser();
