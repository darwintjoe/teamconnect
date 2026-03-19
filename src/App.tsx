import { useState, useCallback, useEffect } from 'react';
import type { User, Comment, Group } from '@/types';
import { useGroups } from '@/hooks/useGroups';
import { useSupabasePosts } from '@/hooks/useSupabasePosts';
import { useSupabaseNotifications } from '@/hooks/useSupabaseNotifications';
import * as db from '@/lib/db-supabase';
import { supabase } from '@/lib/supabase';
import { FeedPage } from '@/pages/FeedPage';
import { PostDetailPage } from '@/pages/PostDetailPage';
import { NotificationsPage } from '@/pages/NotificationsPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { MyGroupsPage } from '@/pages/MyGroupsPage';
import { AdminPage } from '@/pages/AdminPage';
import { BottomTabBar } from '@/components/BottomTabBar';
import { getGroupByInviteCode, getGroupInvitations, getGroups } from '@/lib/groups';
import { getUsers } from '@/lib/db';

type ViewType = 'feed' | 'post' | 'notifications' | 'profile' | 'join' | 'my-groups' | 'admin';

interface AppProps {
  user: User;
  onLogout: () => void;
}

function App({ user: initialUser, onLogout }: AppProps) {
  const [user, setUser] = useState<User>(initialUser);
  const {
    visibleGroups,
    adminGroups,
    createGroup,
    getMembers,
    joinGroup,
    leaveGroup,
    promoteMember,
    demoteMember,
    removeMember,
    isAdmin,
    regenerateInviteCode,
  } = useGroups(user);
  
  const [currentGroup, setCurrentGroup] = useState<Group | null>(null);
  const { posts, refreshPosts, addPost, deletePost, toggleLike } = useSupabasePosts(user, currentGroup?.id);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useSupabaseNotifications(user?.id);
  
  const [currentView, setCurrentView] = useState<ViewType>('feed');
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [postComments, setPostComments] = useState<Comment[]>([]);
  
  // Join group via invite code
  const [joinCode, setJoinCode] = useState<string>('');
  const [joinError, setJoinError] = useState<string>('');

  // Get all invitations
  const invitations = getGroupInvitations();

  // Get all users for admin
  const allUsers = getUsers();
  const allGroups = getGroups();

  // Load comments when viewing a post
  useEffect(() => {
    const loadComments = async () => {
      if (selectedPostId) {
        try {
          const comments = await db.getComments(selectedPostId);
          setPostComments(comments);
        } catch (error) {
          console.error('Error loading comments:', error);
        }
      }
    };
    loadComments();
  }, [selectedPostId]);

  // Check for invite code in URL (supports both /join/:code and /invite/:code)
  useEffect(() => {
    const path = window.location.pathname;
    const match = path.match(/\/(join|invite)\/(.+)/);
    if (match) {
      const code = match[2];
      setJoinCode(code);
      setCurrentView('join');
    }
  }, []);

  const handleSelectGroup = useCallback((group: Group | null) => {
    setCurrentGroup(group);
  }, []);

  const handleCreateGroup = useCallback((name: string, description: string, parentId: string | null) => {
    const newGroup = createGroup(name, description, parentId);
    if (newGroup) {
      setCurrentGroup(newGroup);
    }
  }, [createGroup]);

  const handleCreatePost = useCallback(async (content: string, images: string[]) => {
    if (user && currentGroup) {
      await addPost(content, images, user.id, currentGroup.id);
    }
  }, [addPost, user, currentGroup]);

  const handleDeletePost = useCallback(async (postId: string) => {
    const success = await deletePost(postId);
    if (success && currentView === 'post') {
      setCurrentView('feed');
      setSelectedPostId(null);
    }
    return success;
  }, [deletePost, currentView]);

  const handleLike = useCallback(async (postId: string): Promise<{ liked: boolean; likes: number } | void> => {
    if (!user) return;
    const result = await toggleLike(postId);
    if (result) {
      return result;
    }
  }, [user, toggleLike]);

  const handleNavigateToPost = useCallback((postId: string) => {
    setSelectedPostId(postId);
    setCurrentView('post');
  }, []);

  const handleAddComment = useCallback(async (postId: string, content: string) => {
    if (!user) return;
    await db.createComment({ postId, content, authorId: user.id });
    const comments = await db.getComments(postId);
    setPostComments(comments);
    refreshPosts();
  }, [user, refreshPosts]);

  const handleBackFromPost = useCallback(() => {
    setCurrentView('feed');
    setSelectedPostId(null);
    setPostComments([]);
  }, []);

  const handleTabChange = useCallback((tab: 'home' | 'notifications' | 'profile' | 'my-groups' | 'admin') => {
    switch (tab) {
      case 'home':
        setCurrentView('feed');
        setSelectedPostId(null);
        break;
      case 'notifications':
        setCurrentView('notifications');
        break;
      case 'profile':
        setSelectedUserId(null);
        setCurrentView('profile');
        break;
      case 'my-groups':
        setCurrentView('my-groups');
        break;
      case 'admin':
        setCurrentView('admin');
        break;
    }
  }, []);

  const handleUpdateProfile = useCallback(async (updates: Partial<User>) => {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        name: updates.name,
        email: updates.email,
        avatar_url: updates.avatar,
        role: updates.role,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select()
      .single();

    if (error || !data) {
      console.error('Error updating profile:', error);
      return null;
    }

    const updatedUser = {
      id: data.id,
      email: data.email,
      name: data.name,
      avatar: data.avatar_url,
      role: data.role,
      createdAt: data.created_at,
    };

    setUser(updatedUser);
    refreshPosts();
    return updatedUser;
  }, [user.id, refreshPosts]);

  const handleLogout = useCallback(async () => {
    onLogout();
  }, [onLogout]);

  // Handle join group
  const handleJoinGroup = useCallback(() => {
    if (!user || !joinCode) return;
    
    const group = joinGroup(joinCode);
    if (group) {
      setCurrentGroup(group);
      setCurrentView('feed');
      setJoinError('');
      // Clear URL
      window.history.replaceState({}, '', '/');
    } else {
      setJoinError('Invalid or expired invite code');
    }
  }, [user, joinCode, joinGroup]);

  // Show join group page
  if (currentView === 'join') {
    const group = getGroupByInviteCode(joinCode);
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F2F4F7] p-4">
        <div className="bg-white rounded-xl shadow-sm p-6 max-w-md w-full text-center">
          {group ? (
            <>
              <img
                src={group.avatar}
                alt={group.name}
                className="w-20 h-20 rounded-xl mx-auto mb-4"
              />
              <h1 className="text-xl font-bold text-[#050505] mb-2">
                Join {group.name}
              </h1>
              <p className="text-[#65676B] mb-6">{group.description}</p>
              {joinError && (
                <p className="text-red-500 text-sm mb-4">{joinError}</p>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setCurrentView('feed');
                    window.history.replaceState({}, '', '/');
                  }}
                  className="flex-1 py-2.5 border border-[#DADDE1] rounded-lg text-[#65676B] font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleJoinGroup}
                  className="flex-1 py-2.5 bg-[#1877F2] text-white rounded-lg font-medium"
                >
                  Join Group
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="w-20 h-20 bg-[#F0F2F5] rounded-xl mx-auto mb-4 flex items-center justify-center">
                <span className="text-4xl">❓</span>
              </div>
              <h1 className="text-xl font-bold text-[#050505] mb-2">
                Group Not Found
              </h1>
              <p className="text-[#65676B] mb-6">
                This invite link is invalid or has expired.
              </p>
              <button
                onClick={() => {
                  setCurrentView('feed');
                  window.history.replaceState({}, '', '/');
                }}
                className="w-full py-2.5 bg-[#1877F2] text-white rounded-lg font-medium"
              >
                Go Home
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  // Get the selected post for detail view
  const selectedPost = selectedPostId ? posts.find(p => p.id === selectedPostId) : undefined;

  // Get posts for profile view
  const profileUserId = selectedUserId || user.id;
  const profileUser = profileUserId === user.id 
    ? user 
    : posts.find(p => p.authorId === profileUserId)?.author;
  const profilePosts = posts.filter(p => p.authorId === profileUserId);

  // Get current group members
  const groupMembers = currentGroup ? getMembers(currentGroup.id) : [];
  const isGroupAdmin = currentGroup ? isAdmin(currentGroup.id) : false;

  // Render current view
  const renderView = () => {
    switch (currentView) {
      case 'feed':
        return (
          <FeedPage
            currentUser={user}
            posts={posts}
            groups={visibleGroups}
            adminGroups={adminGroups}
            currentGroup={currentGroup}
            onSelectGroup={handleSelectGroup}
            onCreateGroup={handleCreateGroup}
            onLike={handleLike}
            onCreatePost={handleCreatePost}
            onDeletePost={handleDeletePost}
            onNavigateToPost={handleNavigateToPost}
            groupMembers={groupMembers}
            isGroupAdmin={isGroupAdmin}
            onPromoteMember={promoteMember}
            onDemoteMember={demoteMember}
            onRemoveMember={removeMember}
            onRegenerateInviteCode={regenerateInviteCode}
          />
        );
      case 'post':
        return (
          <PostDetailPage
            post={selectedPost}
            comments={postComments}
            currentUser={user}
            onLike={handleLike}
            onAddComment={handleAddComment}
            onDeletePost={handleDeletePost}
            onBack={handleBackFromPost}
          />
        );
      case 'notifications':
        return (
          <NotificationsPage
            notifications={notifications}
            currentUser={user}
            onMarkAsRead={markAsRead}
            onMarkAllAsRead={markAllAsRead}
            onNavigateToPost={handleNavigateToPost}
          />
        );
      case 'profile':
        return (
          <ProfilePage
            user={profileUser || user}
            posts={profilePosts}
            currentUser={user}
            isOwnProfile={profileUserId === user.id}
            onLike={handleLike}
            onDeletePost={handleDeletePost}
            onNavigateToPost={handleNavigateToPost}
            onUpdateProfile={handleUpdateProfile}
            onLogout={handleLogout}
            onNavigateToGroups={() => setCurrentView('my-groups')}
            onNavigateToAdmin={() => setCurrentView('admin')}
            isAdmin={user.id === 'user-1'}
          />
        );
      case 'my-groups':
        return (
          <MyGroupsPage
            user={user}
            groups={visibleGroups}
            adminGroups={adminGroups}
            invitations={invitations}
            groupMembers={new Map(visibleGroups.map(g => [g.id, getMembers(g.id)]))}
            onBack={() => setCurrentView('profile')}
            onJoinGroup={joinGroup}
            onLeaveGroup={leaveGroup}
            onAcceptInvitation={joinGroup}
            onDeclineInvitation={() => {}}
            onNavigateToGroup={(group) => {
              setCurrentGroup(group);
              setCurrentView('feed');
            }}
          />
        );
      case 'admin':
        return (
          <AdminPage
            currentUser={user}
            allUsers={allUsers}
            allGroups={allGroups}
            allPosts={posts}
            onBack={() => setCurrentView('profile')}
          />
        );
      default:
        return null;
    }
  };

  // Determine active tab
  const getActiveTab = (): 'home' | 'notifications' | 'profile' => {
    switch (currentView) {
      case 'feed':
      case 'post':
        return 'home';
      case 'notifications':
        return 'notifications';
      case 'profile':
        return 'profile';
      default:
        return 'home';
    }
  };

  return (
    <div className="min-h-screen bg-[#F2F4F7]">
      {renderView()}
      
      {/* Bottom tab bar - only show on main views */}
      {(currentView === 'feed' || currentView === 'notifications' || currentView === 'profile') && (
        <BottomTabBar
          activeTab={getActiveTab()}
          onTabChange={handleTabChange}
          unreadCount={unreadCount}
        />
      )}
    </div>
  );
}

export default App;
