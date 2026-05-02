const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// =====================================================
// TeamConnect - localStorage to Supabase Migration
// =====================================================

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env');
  console.error('   Set: VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Helper functions
const loadJSON = (filename) => {
  try {
    const filepath = path.join(__dirname, filename);
    if (!fs.existsSync(filepath)) {
      console.warn(`⚠️  File not found: ${filename}`);
      return [];
    }
    return JSON.parse(fs.readFileSync(filepath, 'utf-8'));
  } catch (error) {
    console.error(`❌ Error loading ${filename}:`, error.message);
    return [];
  }
};

const log = (step, message) => {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`${step}: ${message}`);
  console.log('='.repeat(70));
};

// Migration functions
async function migrateGroups() {
  log('STEP 1', 'Migrating Groups');
  
  const groups = loadJSON('groups.json');
  if (groups.length === 0) {
    console.log('📦 No groups to migrate');
    return 0;
  }

  console.log(`📦 Found ${groups.length} groups to migrate`);

  try {
    const { data, error } = await supabase
      .from('groups')
      .insert(
        groups.map(g => ({
          id: g.id,
          name: g.name,
          description: g.description,
          avatar_url: g.avatar,
          parent_id: g.parentId || null,
          level: g.level,
          created_by: g.createdBy,
          created_at: g.createdAt,
          updated_at: g.updatedAt,
          invite_code: g.inviteCode,
          is_public: g.isPublic || false,
        }))
      );

    if (error) throw error;

    console.log(`✅ Successfully migrated ${groups.length} groups`);
    return groups.length;
  } catch (error) {
    console.error('❌ Error migrating groups:', error.message);
    return 0;
  }
}

async function migrateGroupMembers() {
  log('STEP 2', 'Migrating Group Members');
  
  const members = loadJSON('group_members.json');
  if (members.length === 0) {
    console.log('📦 No members to migrate');
    return 0;
  }

  console.log(`📦 Found ${members.length} group members to migrate`);

  try {
    const { data, error } = await supabase
      .from('group_members')
      .insert(
        members.map(m => ({
          id: m.id,
          group_id: m.groupId,
          user_id: m.userId,
          role: m.role,
          joined_at: m.joinedAt,
          invited_by: m.invitedBy || null,
        }))
      );

    if (error) throw error;

    console.log(`✅ Successfully migrated ${members.length} group members`);
    return members.length;
  } catch (error) {
    console.error('❌ Error migrating group members:', error.message);
    return 0;
  }
}

async function migratePosts() {
  log('STEP 3', 'Migrating Posts');
  
  const posts = loadJSON('posts.json');
  if (posts.length === 0) {
    console.log('📦 No posts to migrate');
    return 0;
  }

  console.log(`📦 Found ${posts.length} posts to migrate`);

  try {
    const { data, error } = await supabase
      .from('posts')
      .insert(
        posts.map(p => ({
          id: p.id,
          group_id: p.groupId,
          user_id: p.authorId,
          content: p.content,
          images: p.images || [],
          likes_count: p.likes || 0,
          comments_count: p.commentsCount || 0,
          created_at: p.createdAt,
          updated_at: p.updatedAt,
        }))
      );

    if (error) throw error;

    console.log(`✅ Successfully migrated ${posts.length} posts`);
    return posts.length;
  } catch (error) {
    console.error('❌ Error migrating posts:', error.message);
    return 0;
  }
}

async function migrateLikes() {
  log('STEP 4', 'Migrating Post Likes');
  
  const posts = loadJSON('posts.json');
  const likesData = [];

  posts.forEach(post => {
    if (post.likedBy && Array.isArray(post.likedBy)) {
      post.likedBy.forEach(userId => {
        likesData.push({
          post_id: post.id,
          user_id: userId,
        });
      });
    }
  });

  if (likesData.length === 0) {
    console.log('📦 No likes to migrate');
    return 0;
  }

  console.log(`📦 Found ${likesData.length} post likes to migrate`);

  try {
    const { data, error } = await supabase
      .from('post_likes')
      .insert(likesData);

    if (error) throw error;

    console.log(`✅ Successfully migrated ${likesData.length} post likes`);
    return likesData.length;
  } catch (error) {
    console.error('❌ Error migrating likes:', error.message);
    return 0;
  }
}

async function migrateComments() {
  log('STEP 5', 'Migrating Comments');
  
  const comments = loadJSON('comments.json');
  if (comments.length === 0) {
    console.log('📦 No comments to migrate');
    return 0;
  }

  console.log(`📦 Found ${comments.length} comments to migrate`);

  try {
    const { data, error } = await supabase
      .from('comments')
      .insert(
        comments.map(c => ({
          id: c.id,
          post_id: c.postId,
          user_id: c.authorId,
          content: c.content,
          parent_id: c.parentId || null,
          created_at: c.createdAt,
        }))
      );

    if (error) throw error;

    console.log(`✅ Successfully migrated ${comments.length} comments`);
    return comments.length;
  } catch (error) {
    console.error('❌ Error migrating comments:', error.message);
    return 0;
  }
}

async function verifyMigration(counts) {
  log('STEP 6', 'Verifying Migration');

  try {
    const [groupsResult, membersResult, postsResult, likesResult, commentsResult] = 
      await Promise.all([
        supabase.from('groups').select('id', { count: 'exact', head: true }),
        supabase.from('group_members').select('id', { count: 'exact', head: true }),
        supabase.from('posts').select('id', { count: 'exact', head: true }),
        supabase.from('post_likes').select('id', { count: 'exact', head: true }),
        supabase.from('comments').select('id', { count: 'exact', head: true }),
      ]);

    const verify = (name, dbCount, sourceCount) => {
      const match = dbCount === sourceCount;
      const status = match ? '✅' : '❌';
      console.log(`${status} ${name}: ${dbCount} in DB vs ${sourceCount} source`);
      return match;
    };

    const allMatch = 
      verify('Groups', groupsResult.count || 0, counts.groups) &&
      verify('Members', membersResult.count || 0, counts.members) &&
      verify('Posts', postsResult.count || 0, counts.posts) &&
      verify('Likes', likesResult.count || 0, counts.likes) &&
      verify('Comments', commentsResult.count || 0, counts.comments);

    if (allMatch) {
      console.log('\n✅ Migration Complete!');
    } else {
      console.warn('\n⚠️  Some counts do not match. Please review.');
    }

    return allMatch;
  } catch (error) {
    console.error('❌ Error verifying migration:', error.message);
    return false;
  }
}

// Main migration
async function runMigration() {
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║     TeamConnect - localStorage to Supabase Migration         ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  try {
    const counts = {
      groups: 0,
      members: 0,
      posts: 0,
      likes: 0,
      comments: 0,
    };

    counts.groups = await migrateGroups();
    counts.members = await migrateGroupMembers();
    counts.posts = await migratePosts();
    counts.likes = await migrateLikes();
    counts.comments = await migrateComments();

    const success = await verifyMigration(counts);

    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

// Run it!
runMigration();
