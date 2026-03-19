# TeamConnect - Supabase Setup Guide

## Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name**: `teamconnect` (or your preferred name)
   - **Database Password**: Create a strong password
   - **Region**: Choose closest to your users
5. Click "Create new project" (takes ~2 minutes)

## Step 2: Get Your API Keys

1. In your Supabase dashboard, go to **Project Settings** → **API**
2. Copy these values:
   - **Project URL** (e.g., `https://abcdefgh12345678.supabase.co`)
   - **anon public** API key (starts with `eyJ...`)

## Step 3: Set Up Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

## Step 4: Create Database Tables

1. In Supabase dashboard, go to **SQL Editor**
2. Click "New query"
3. Copy and paste the entire contents of `supabase/schema.sql`
4. Click "Run" to execute all the SQL commands

This will create:
- `profiles` table (extends auth.users)
- `posts` table
- `comments` table
- `likes` table
- `notifications` table
- All necessary triggers and policies

## Step 5: Set Up Storage (for Images)

1. In Supabase dashboard, go to **Storage**
2. Click "New bucket"
3. Create a bucket named `teamconnect`
4. Set **Public bucket** to ON
5. Click "Save"

### Storage Policies

Add these policies to allow image uploads:

1. Go to **Storage** → **Policies** → `teamconnect` bucket
2. Add these policies:

**SELECT policy**:
- Name: `Allow public access`
- Allowed operation: SELECT
- Target roles: anon, authenticated
- Policy definition: `true`

**INSERT policy**:
- Name: `Allow authenticated uploads`
- Allowed operation: INSERT
- Target roles: authenticated
- Policy definition: `true`

## Step 6: Test Your Setup

1. Build the app:
   ```bash
   npm run build
   ```

2. Test locally:
   ```bash
   npm run dev
   ```

3. Open http://localhost:5173 and try:
   - Registering a new account
   - Creating a post with images
   - Liking and commenting

## Step 7: Deploy

### Option A: Vercel (Recommended)

1. Push your code to GitHub
2. Go to [https://vercel.com](https://vercel.com)
3. Import your repository
4. Add environment variables in Vercel dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Deploy!

### Option B: Netlify

1. Push your code to GitHub
2. Go to [https://netlify.com](https://netlify.com)
3. Connect your repository
4. Add build command: `npm run build`
5. Add publish directory: `dist`
6. Add environment variables
7. Deploy!

## Step 8: Add Team Members

Share the deployed URL with your team. Each person can:
1. Register with their company email
2. Complete their profile
3. Start posting and interacting!

## Troubleshooting

### "Invalid API key" error
- Double-check your `VITE_SUPABASE_ANON_KEY` in `.env`
- Make sure you're using the **anon** key, not the service_role key

### "Failed to fetch" error
- Check your `VITE_SUPABASE_URL` is correct
- Ensure your Supabase project is active (not paused)

### Images not uploading
- Verify the `teamconnect` storage bucket exists
- Check storage policies allow INSERT for authenticated users

### Real-time updates not working
- Go to **Database** → **Replication** in Supabase
- Ensure `supabase_realtime` publication includes your tables

## Free Tier Limits (Supabase)

- **Database**: 500MB
- **Storage**: 1GB
- **Bandwidth**: 2GB/month
- **Auth**: 50,000 users/month
- **Real-time**: 200 concurrent connections

For a small-medium team, this should be plenty! Upgrade when needed.

## Next Steps

1. **Custom Domain**: Add your company domain in Supabase settings
2. **Email Templates**: Customize auth emails in Supabase
3. **Backup**: Set up daily backups in Supabase
4. **Monitoring**: Check usage in Supabase dashboard

## Need Help?

- Supabase Docs: [https://supabase.com/docs](https://supabase.com/docs)
- Supabase Discord: [https://discord.supabase.com](https://discord.supabase.com)
