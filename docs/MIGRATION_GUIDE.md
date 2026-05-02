# Supabase Migration Guide

**Objective**: Move all data from localStorage to Supabase  
**Time Required**: 30-60 minutes  
**Risk Level**: Low (non-destructive)

---

## Table of Contents

1. [Pre-Migration Checklist](#pre-migration-checklist)
2. [Step 1: Set Up Supabase](#step-1-set-up-supabase)
3. [Step 2: Export Data from Browser](#step-2-export-data-from-browser)
4. [Step 3: Run Migration](#step-3-run-migration)
5. [Step 4: Update App Code](#step-4-update-app-code)
6. [Step 5: Verify & Deploy](#step-5-verify--deploy)
7. [Rollback Plan](#rollback-plan)

---

## Pre-Migration Checklist

- [ ] All team members notified
- [ ] Backup of Supabase database (auto-backup enabled)
- [ ] Backup of localStorage data (exported to files)
- [ ] Test environment ready
- [ ] Staging deployment planned
- [ ] Production deployment window scheduled
- [ ] .env file ready with Supabase credentials

---

## Step 1: Set Up Supabase

### 1.1 Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name**: `teamconnect`
   - **Database Password**: Strong password (save it!)
   - **Region**: Choose closest to your users
5. Click "Create new project" (wait ~2 minutes)

### 1.2 Get API Keys

1. Go to **Project Settings** → **API**
2. Copy these values to `.env`:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   VITE_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

### 1.3 Run Schema Migration

1. Go to Supabase dashboard → **SQL Editor**
2. Click "New query"
3. Copy entire contents of `docs/sql/migration_schema.sql`
4. Paste into SQL editor
5. Click "Run" button
6. Wait for all queries to complete (check logs)

**Expected Output**: No errors, all tables created

### 1.4 Create Storage Bucket

1. Go to Supabase dashboard → **Storage**
2. Click "New bucket"
3. Name: `teamconnect`
4. Set **Public bucket** to ON
5. Click "Save"

### 1.5 Test Connection from App

1. Update `.env.local` with new Supabase credentials
2. Run app locally: `npm run dev`
3. Open browser console
4. Run:
   ```javascript
   import { supabase } from './src/lib/supabase';
   const { data, error } = await supabase
     .from('groups')
     .select('*');
   console.log(data, error);
   ```
5. Should return empty array (no error)

---

## Step 2: Export Data from Browser

### 2.1 Load App and Export

1. Open TeamConnect app in browser
2. Load a profile (login) to populate localStorage
3. Open browser Developer Tools (F12)
4. Go to **Console** tab
5. Paste this code:

```javascript
(function(self){
  self.console.save = function(data, filename){
    if(!data) {
      console.error('Console.save: No data');
      return;
    }
    if(typeof data === "object") {
      data = JSON.stringify(data, undefined, 4)
    }
    var blob = new Blob([data], {type: 'text/json'}),
        e = document.createEvent('MouseEvents'),
        a = document.createElement('a');
    a.download = filename;
    a.href = window.URL.createObjectURL(blob);
    a.dataset.downloadurl = ['text/json', a.download, a.href].join(':');
    e.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
    a.dispatchEvent(e);
  }
})(window);

// Export each data set
const groups = localStorage.getItem('teamconnect_groups');
if(groups) console.save(groups, 'groups.json');

const members = localStorage.getItem('teamconnect_group_members');
if(members) console.save(members, 'group_members.json');

const posts = localStorage.getItem('teamconnect_posts');
if(posts) console.save(posts, 'posts.json');

const comments = localStorage.getItem('teamconnect_comments');
if(comments) console.save(comments, 'comments.json');

console.log('✅ All files downloaded!');
```

6. Press Enter
7. Browser will download:
   - `groups.json`
   - `group_members.json`
   - `posts.json`
   - `comments.json`

### 2.2 Verify Exported Data

Check that files were downloaded. Each should contain valid JSON:

```bash
# Verify JSON is valid
cat groups.json | jq . > /dev/null && echo "✅ Valid"

# Check counts
jq 'length' groups.json          # Should show number > 0
jq 'length' group_members.json
jq 'length' posts.json
jq 'length' comments.json
```

---

## Step 3: Run Migration

### 3.1 Prepare Migration Script

1. Create `scripts/migrate-to-supabase.js` (provided in repo)
2. Install dependency:
   ```bash
   npm install @supabase/supabase-js
   ```

### 3.2 Run Migration

1. Copy exported JSON files to `scripts/` directory:
   ```bash
   cp ~/Downloads/groups.json scripts/
   cp ~/Downloads/group_members.json scripts/
   cp ~/Downloads/posts.json scripts/
   cp ~/Downloads/comments.json scripts/
   ```

2. Set environment variables:
   ```bash
   export VITE_SUPABASE_URL=https://your-project.supabase.co
   export VITE_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

3. Run migration:
   ```bash
   node scripts/migrate-to-supabase.js
   ```

### 3.3 Check Output

Should see:
```
======================================================================
STEP 1: Migrating Groups
======================================================================
📦 Found 5 groups to migrate
✅ Successfully migrated 5 groups

======================================================================
STEP 2: Migrating Group Members
======================================================================
📦 Found 12 group members to migrate
✅ Successfully migrated 12 group members

[... etc for posts, likes, comments ...]

======================================================================
STEP 6: Verifying Migration
======================================================================
Groups: 5 in DB vs 5 source → ✅
Members: 12 in DB vs 12 source → ✅
Posts: 24 in DB vs 24 source → ✅
Comments: 48 in DB vs 48 source → ✅
Likes: 156 in DB vs 156 source → ✅

✅ Migration Complete!
```

### 3.4 If Migration Fails

1. Check error message
2. Verify `.env` variables are set correctly
3. Check Supabase dashboard for table existence
4. Delete test data from tables
5. Re-run script

---

## Step 4: Update App Code

### 4.1 Migrate `useGroups` Hook

**File**: `src/hooks/useGroups.ts`

Replace localStorage calls with Supabase:

```typescript
// OLD
const refreshGroups = useCallback(() => {
  const allGroups = getGroups();  // From localStorage
  // ...
}, [currentUser]);

// NEW
const refreshGroups = useCallback(async () => {
  if (!currentUser) return;
  
  try {
    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    const allGroups = data.map(g => ({
      id: g.id,
      name: g.name,
      // ... map other fields
    }));
    
    setGroups(allGroups);
  } catch (error) {
    console.error('Error fetching groups:', error);
  }
}, [currentUser]);
```

### 4.2 Migrate Group Creation

```typescript
// OLD
const newGroup = createGroup(name, description, currentUser.id, parentId);

// NEW
const newGroup = async (name, description, parentId) => {
  try {
    const { data, error } = await supabase
      .from('groups')
      .insert({
        name,
        description,
        parent_id: parentId,
        created_by: currentUser.id,
        invite_code: generateInviteCode(),
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating group:', error);
    return null;
  }
};
```

### 4.3 Remove localStorage Fallback

In `src/lib/db-supabase.ts`, remove:

```typescript
// REMOVE THIS
const isSupabaseConfigured = () => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  return url && url !== 'your_supabase_project_url' && url.includes('supabase.co');
};

// REMOVE THIS
const getFromLocal = (key: string) => {
  const stored = localStorage.getItem(`teamconnect_${key}`);
  return stored ? JSON.parse(stored) : null;
};

// Instead, require Supabase:
if (!import.meta.env.VITE_SUPABASE_URL) {
  throw new Error('Supabase URL not configured in .env');
}
```

### 4.4 Clear localStorage Usage

Replace all `localStorage.setItem()` and `localStorage.getItem()` with Supabase queries.

---

## Step 5: Verify & Deploy

### 5.1 Local Testing

1. Clear browser localStorage:
   ```javascript
   localStorage.clear()
   ```

2. Refresh app: `npm run dev`

3. Test key features:
   - [ ] Can see existing groups
   - [ ] Can create new group
   - [ ] Can post in group
   - [ ] Can like post
   - [ ] Can comment
   - [ ] Can see notifications

### 5.2 Test in Staging

1. Deploy to staging environment
2. Run full test suite
3. Get team to test
4. Monitor error logs

### 5.3 Backup Production

Before deploying to production:

```bash
# Backup Supabase
# (Automatic daily backups in Supabase)

# Or export data:
# Go to Supabase dashboard → Tools → Export
# Download SQL backup
```

### 5.4 Deploy to Production

1. Create new branch: `git checkout -b migration/supabase`
2. Commit changes
3. Create PR with migration notes
4. Get approval
5. Merge to main
6. Deploy to production
7. Monitor logs for errors

### 5.5 Monitor After Deployment

Check logs every 5 minutes for first hour:

```bash
# If using Vercel
vercel logs --follow

# Or check Supabase logs
# Supabase dashboard → Logs
```

---

## Rollback Plan

If something breaks, you have these options:

### Option 1: Quick Rollback (< 5 minutes down)

1. Revert to previous commit:
   ```bash
   git revert HEAD
   git push
   ```

2. Redeploy previous version

3. Data remains in Supabase (no loss)

4. Users see cached version briefly

### Option 2: Full Rollback (Restore from backup)

1. Go to Supabase dashboard → Backups
2. Select backup from before migration
3. Click Restore
4. Wait for restore to complete
5. Verify data

### Option 3: Partial Rollback (Fix and retry)

1. Fix the issue in code
2. Make sure Supabase schema is correct
3. Rerun migration script
4. Redeploy

---

## Post-Migration Tasks

After successful migration and verified production:

### 1. Clean Up Old Code

Remove:
- `src/lib/db.ts` (demo in-memory data)
- `src/lib/groups.ts` (localStorage version)
- localStorage fallback logic

### 2. Update Documentation

Update these files:
- SETUP.md - Add Supabase URL/Key setup
- ARCHITECTURE.md - Update to show Supabase usage
- CODE_REVIEW.md - Mark these items as complete

### 3. Disable localStorage in Chrome DevTools

Add to prevent accidental data storage:

```typescript
// In src/main.tsx
if (import.meta.env.PROD) {
  // Prevent accidental localStorage usage in production
  const handler = {
    get: (target, prop) => {
      if (prop === 'setItem') {
        console.warn('⚠️  localStorage disabled in production - use Supabase');
        return () => {};
      }
      return target[prop];
    }
  };
  
  const proxyStorage = new Proxy(localStorage, handler);
  Object.defineProperty(window, 'localStorage', {
    value: proxyStorage,
    writable: false
  });
}
```

### 4. Monitor for Issues

- Check Supabase dashboard daily for first week
- Monitor error tracking (Sentry, etc.)
- Get user feedback
- Fix any issues that arise

---

## FAQ

### Q: Will migration cause downtime?

**A**: No! Migration happens in background. Users can continue using app.

### Q: What if migration fails halfway?

**A**: All changes are rolled back (Supabase transactions). Restart migration.

### Q: How long does migration take?

**A**: 
- Small (< 1000 posts): 10-30 seconds
- Medium (1000-10000 posts): 1-2 minutes
- Large (> 10000 posts): 5-10 minutes

### Q: Can I keep localhost fallback?

**A**: No, remove it for production. But keep in dev environment if needed.

### Q: How do I handle image migrations?

**A**: Images URLs are already stored. Just make sure Supabase Storage bucket `teamconnect` exists.

### Q: What about user data?

**A**: Profiles are automatically synced from Kinde on first login.

---

## Support

If migration fails:

1. Check error message in console
2. Review ARCHITECTURE.md → Database Schema
3. Verify Supabase tables created correctly
4. Try migration again
5. Contact support if still issues

---

**Migration Version**: 1.0  
**Last Updated**: 2026-05-02  
**Author**: Development Team
