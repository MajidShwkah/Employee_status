-- =====================================================
-- Create First Admin User
-- =====================================================
-- After running create_new_profiles.sql, use this to create your first admin
-- =====================================================

-- =====================================================
-- IMPORTANT: Hash Your Password First!
-- =====================================================
-- You need to hash your password using SHA-256 before inserting
-- 
-- Option 1: Use online tool
-- Go to: https://emn178.github.io/online-tools/sha256.html
-- Enter your password, copy the hash
--
-- Option 2: Use browser console
-- Open browser console (F12) and run:
-- const encoder = new TextEncoder();
-- const data = encoder.encode('yourpassword');
-- crypto.subtle.digest('SHA-256', data).then(hash => {
--   const hashArray = Array.from(new Uint8Array(hash));
--   const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
--   console.log(hashHex);
-- });
--
-- Option 3: Use the app (after creating one user via SQL)
-- The app will hash passwords automatically when creating users

-- =====================================================
-- INSERT FIRST ADMIN
-- =====================================================
-- Replace 'YOUR_HASHED_PASSWORD' with the SHA-256 hash of your password
-- Replace 'admin' with your desired username
-- Replace 'Admin User' with your name

INSERT INTO profiles (username, password_hash, full_name, role, status, avatar_url)
VALUES (
  'admin',                                    -- Username (change this)
  'YOUR_HASHED_PASSWORD_HERE',               -- SHA-256 hash of password (replace this!)
  'Admin User',                               -- Full name (change this)
  'admin',                                    -- Role
  'free',                                     -- Status
  'https://ui-avatars.com/api/?name=Admin+User&background=4F46E5&color=fff&size=128'  -- Avatar
);

-- =====================================================
-- EXAMPLE WITH PASSWORD HASH
-- =====================================================
-- If your password is "admin123", the SHA-256 hash is:
-- "240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9"
--
-- So the INSERT would be:
/*
INSERT INTO profiles (username, password_hash, full_name, role, status, avatar_url)
VALUES (
  'admin',
  '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9',
  'Admin User',
  'admin',
  'free',
  'https://ui-avatars.com/api/?name=Admin+User&background=4F46E5&color=fff&size=128'
);
*/

-- =====================================================
-- VERIFY ADMIN WAS CREATED
-- =====================================================
-- Run this to check:
-- SELECT id, username, full_name, role, status, created_at
-- FROM profiles
-- WHERE role = 'admin';

-- =====================================================
-- DONE!
-- =====================================================
-- You can now login with:
-- Username: admin (or whatever you set)
-- Password: admin123 (or whatever you hashed)
-- =====================================================
