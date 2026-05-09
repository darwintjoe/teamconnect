# TeamConnect - Supabase Migration Guide

**Objective**: Move all data from localStorage to Supabase  
**Time Required**: 30-60 minutes  
**Risk Level**: Low (non-destructive)

---

## Pre-Migration Checklist

- [ ] All team members notified
- [ ] Backup of Supabase database (auto-backup enabled)
- [ ] Backup of localStorage data (exported to files)
- [ ] Test environment ready
- [ ] .env file ready with Supabase credentials

---

## Step 1: Set Up Supabase

### 1.1 Create Supabase Project

1. Go to [supabase.com](https://supabase.com) → New Project
2. Enter project name: `teamconnect`
3. Set strong database password
4. Choose closest region
5. Click Create (wait ~2 minutes)

### 1.2 Get API Keys

1. Project Settings → API
2. Copy to `.env.local`:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

### 1.3 Run Schema Migration

1. Supabase Dashboard → SQL Editor → New Query
2. Copy entire `docs/sql/migration_schema.sql`
3. Click Run
4. Verify: No errors, all tables created

---

## Step 2: Export Data from Browser

### 2.1 Export localStorage

Open browser console (F12) and run:

```javascript
(function(self){
  self.console.save = function(data, filename){
    if(!data) { console.error('No data'); return; }
    if(typeof data === "object") data = JSON.stringify(data, undefined, 4)
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

// Export all data
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

### 2.2 Verify Exported Files

```bash
jq 'length' groups.json          # Shows count
jq 'length' group_members.json
jq 'length' posts.json
jq 'length' comments.json
```

---

## Step 3: Run Migration Script

### 3.1 Install Dependencies

```bash
npm install @supabase/supabase-js
```

### 3.2 Copy Files

```bash
cp ~/Downloads/groups.json scripts/
cp ~/Downloads/group_members.json scripts/
cp ~/Downloads/posts.json scripts/
cp ~/Downloads/comments.json scripts/
```

### 3.3 Set Environment

```bash
export VITE_SUPABASE_URL=https://your-project.supabase.co
export VITE_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3.4 Run Migration

```bash
node scripts/migrate-to-supabase.js
```

Expected output: `✅ Migration Complete!` with counts verified

---

## Step 4: Test Locally

1. Clear localStorage:
   ```javascript
   localStorage.clear()
   ```

2. Restart app: `npm run dev`

3. Test:
   - [ ] Can see groups
   - [ ] Can create post
   - [ ] Can like post
   - [ ] Can comment

---

## Step 5: Deploy

1. Create PR with migration changes
2. Get approval
3. Deploy to staging first
4. Backup Supabase (automatic)
5. Deploy to production
6. Monitor logs

---

## Rollback Plan

If needed:

**Option 1**: Revert code commit
```bash
git revert HEAD
git push
```

**Option 2**: Restore Supabase backup
- Supabase Dashboard → Backups → Restore

**Option 3**: Rerun migration if data issues

---

## Post-Migration Cleanup

1. Remove `src/lib/db.ts` (old demo data)
2. Remove localStorage fallback logic
3. Update documentation
4. Monitor for issues

---

**Time**: 30-60 minutes  
**Risk**: Low  
**Reversible**: Yes
