# Phase 1 Setup Guide - Bayver Recipes

This guide will walk you through setting up the infrastructure for your recipe app.

## Prerequisites

- ✅ Supabase account (created)
- ✅ Cloudflare account (created)
- Node.js installed (v18 or higher)

---

## Step 1: Supabase Database Setup

### 1.1 Create Database Schema

1. Go to your Supabase project dashboard
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the entire contents of `supabase-schema.sql`
5. Paste into the SQL editor
6. Click **Run** (or press Ctrl+Enter)

You should see: `Success. No rows returned`

### 1.2 Verify Tables Created

1. Click **Table Editor** in the left sidebar
2. You should see these tables:
   - recipes
   - ingredients
   - store_items
   - meal_plans
   - meal_plan_sides
   - favorites
   - recipe_ratings

### 1.3 Get API Credentials

1. Click **Settings** → **API**
2. Copy these values (you'll need them later):
   - **Project URL**: `https://xxxxxxxxxxxxx.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (long string)

---

## Step 2: Migrate Existing Recipes

### 2.1 Install Supabase Client

```bash
cd bayver-recipes
npm install @supabase/supabase-js
```

### 2.2 Run Migration Script

```bash
SUPABASE_URL=https://xxxxx.supabase.co \
SUPABASE_ANON_KEY=your-anon-key \
node migrate-recipes.js
```

Replace `xxxxx` with your actual Supabase URL and key from Step 1.3.

This will:
- Load all 30+ recipes from `recipes.json`
- Insert them into your Supabase database
- Preserve ingredients, cooking times, and metadata

You should see:
```
✅ Migration complete!
   Successful: 30/30
   Failed: 0/30
```

---

## Step 3: Cloudflare R2 Setup

### 3.1 Create R2 Bucket

1. Go to Cloudflare Dashboard → **R2**
2. Click **Create Bucket**
3. Name it: `bayver-recipes` (or your choice)
4. Click **Create Bucket**

### 3.2 Configure CORS

1. Click on your bucket → **Settings**
2. Scroll to **CORS Policy**
3. Click **Add CORS Policy**
4. Paste this:

```json
[
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

5. Click **Save**

### 3.3 Get R2 API Credentials

1. Go to **R2** → **Manage R2 API Tokens**
2. Click **Create API Token**
3. Token Name: `bayver-recipes-upload`
4. Permissions: **Object Read & Write**
5. Click **Create API Token**
6. Copy these values:

```
Account ID: xxxxxxxxxxxxxxxxxxxxxxxx
Access Key ID: xxxxxxxxxxxxxxxxxxxxxxxx
Secret Access Key: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**⚠️ Important:** Save these immediately - you can't view the Secret Access Key again!

### 3.4 Get Public URL Domain

1. Go to your R2 bucket → **Settings**
2. Scroll to **Public Access**
3. Click **Connect Domain** (or **Allow Access**)
4. Follow prompts to set up a public domain
5. Copy the domain URL: `https://pub-xxxxx.r2.dev`

---

## Step 4: Environment Variables

Create a `.env.local` file in the root directory:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Cloudflare R2
CLOUDFLARE_ACCOUNT_ID=xxxxxxxxxxxxxxxxxxxxxxxx
CLOUDFLARE_ACCESS_KEY_ID=xxxxxxxxxxxxxxxxxxxxxxxx
CLOUDFLARE_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
CLOUDFLARE_BUCKET_NAME=bayver-recipes
NEXT_PUBLIC_R2_PUBLIC_URL=https://pub-xxxxx.r2.dev
```

Replace all `xxxxx` values with your actual credentials.

---

## Step 5: Install Next.js Dependencies

We'll create the Next.js app in the next phase, but for now, install the base dependencies:

```bash
npm install next@14 react react-dom
npm install -D typescript @types/react @types/node
npm install @supabase/supabase-js
npm install @aws-sdk/client-s3 sharp  # For R2 uploads and image optimization
```

---

## Verification Checklist

Before moving to Phase 2, verify:

- [ ] Supabase database created with all 7 tables
- [ ] 30+ recipes migrated successfully to database
- [ ] Cloudflare R2 bucket created
- [ ] CORS policy configured on R2 bucket
- [ ] API credentials saved in `.env.local`
- [ ] Dependencies installed

---

## Troubleshooting

### Migration script fails

**Error:** `SUPABASE_URL and SUPABASE_ANON_KEY environment variables must be set`

**Solution:** Make sure you're passing the env vars on the same line as the command:
```bash
SUPABASE_URL=... SUPABASE_ANON_KEY=... node migrate-recipes.js
```

### Can't see tables in Supabase

**Solution:**
1. Check SQL Editor history to see if there were any errors
2. Make sure you ran the entire `supabase-schema.sql` file
3. Try refreshing the Table Editor page

### R2 bucket CORS errors

**Solution:**
- Make sure you saved the CORS policy
- Wait a few minutes for changes to propagate
- Try accessing the bucket from a browser to test

---

## What's Next?

Once you've completed all steps above, you're ready for:

**Phase 2:** Image Upload & Optimization
- Build API endpoint for uploading recipe photos
- Implement automatic image resizing (thumbnail, display, full)
- Convert to WebP format for 70-90% size reduction
- Upload optimized images to Cloudflare R2

---

## Cost Tracking

Your current setup costs:
- **Supabase Free Tier:** $0/month (500MB database, 2GB bandwidth)
- **Cloudflare R2 Free Tier:** $0/month (10GB storage, unlimited egress)
- **Total:** $0/month ✅

You won't hit paid tiers until you exceed 1000+ recipes with photos.
