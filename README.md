# Employee Status Dashboard

A real-time employee status dashboard built with React, Supabase, and Tailwind CSS.

## Setup Instructions

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure Supabase:**
   - Open `src/App.jsx`
   - Replace `YOUR_SUPABASE_URL` with your actual Supabase project URL
   - Replace `YOUR_SUPABASE_ANON_KEY` with your actual Supabase anon key

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```

## Features

- **Public Dashboard**: View all employees and their current status
- **Employee Panel**: Employees can update their status (free/busy) with notes and duration
- **Admin Panel**: Manage employees (add, edit, delete)
- **Real-time Updates**: Status changes are reflected instantly across all views
- **Authentication**: Secure login system with role-based access

## Database Setup

Make sure you've run the SQL commands in Supabase to create the `profiles` table and set up Row Level Security policies as shown in your setup.
