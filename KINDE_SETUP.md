# TeamConnect - Kinde OAuth Setup Guide

## Step 1: Create a Kinde Account

1. Go to [https://kinde.com](https://kinde.com)
2. Sign up for a free account (you can use GitHub, Google, or email)
3. Verify your email address

## Step 2: Create a New Application

1. In your Kinde dashboard, click **"Add application"**
2. Enter application details:
   - **Name**: `TeamConnect`
   - **Type**: `Front-end web`
3. Click **"Save"**

## Step 3: Get Your Credentials

1. Go to your application's **Details** page
2. Copy the following values:
   - **Client ID** (looks like: `abc123def456`)
   - **Domain** (looks like: `https://teamconnect.kinde.com`)

## Step 4: Configure Callback URLs

1. In your Kinde application, go to **Authentication** → **Callback URLs**
2. Add these URLs:
   - For local development: `http://localhost:5173`
   - For production: `https://yourdomain.com`
3. Click **"Save"**

## Step 5: Configure Logout URLs

1. Go to **Authentication** → **Logout URLs**
2. Add the same URLs as above
3. Click **"Save"**

## Step 6: Set Up Environment Variables

Create a `.env` file in your project root:

```env
VITE_KINDE_CLIENT_ID=your_kinde_client_id_here
VITE_KINDE_DOMAIN=https://yourapp.kinde.com
VITE_KINDE_REDIRECT_URI=http://localhost:5173
VITE_KINDE_LOGOUT_URI=http://localhost:5173
```

For production, update the redirect/logout URIs:

```env
VITE_KINDE_CLIENT_ID=your_kinde_client_id_here
VITE_KINDE_DOMAIN=https://yourapp.kinde.com
VITE_KINDE_REDIRECT_URI=https://yourdomain.com
VITE_KINDE_LOGOUT_URI=https://yourdomain.com
```

## Step 7: Test Locally

```bash
npm run dev
```

Open http://localhost:5173 and click "Sign in with Kinde"

## Step 8: Deploy to Production

### Option A: Vercel

1. Push your code to GitHub
2. Import to Vercel
3. Add environment variables in Vercel dashboard
4. Update Kinde callback URLs with your production domain

### Option B: Netlify

Same process - add env vars in Netlify dashboard.

## Features Enabled by Kinde

- ✅ **Secure OAuth 2.0 / OpenID Connect**
- ✅ **Social Login** (Google, GitHub, Microsoft, etc.)
- ✅ **Email/Password Auth**
- ✅ **Passwordless Login**
- ✅ **Multi-factor Authentication (MFA)**
- ✅ **User Management Dashboard**
- ✅ **Role-based Access Control**
- ✅ **Free tier up to 10,000 users**

## Troubleshooting

### "Invalid client_id" error
- Double-check your `VITE_KINDE_CLIENT_ID`
- Make sure there are no extra spaces

### "redirect_uri mismatch" error
- Verify your callback URLs in Kinde dashboard match exactly
- Include/exclude trailing slashes as needed

### Users can't log in
- Check that the user exists in your Kinde dashboard
- Verify they have the correct permissions

## Next Steps

1. **Customize Login Page**: Go to Kinde → Design to brand your login
2. **Add Social Providers**: Kinde → Authentication → Social connections
3. **Set Up Roles**: Create roles like "Admin", "Member" in Kinde
4. **Enable MFA**: For extra security (Kinde → Security → MFA)

## Free Tier Limits

- **Users**: 10,000
- **Authentication requests**: Unlimited
- **Social connections**: Unlimited
- **Custom domains**: 1

Perfect for small to medium teams!
