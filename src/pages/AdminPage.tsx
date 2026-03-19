import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Users,
  Shield,
  MapPin,
  Search,
  Trash2,
  Activity,
  Globe,
  Clock,
  Settings,
  Ban,
  CheckCircle,
  UserCog,
  MoreVertical,
  FileText,
  Image as ImageIcon,
} from 'lucide-react';
import type { User, Group, Post } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

// Admin user IDs - in production this would come from backend
const ADMIN_USER_IDS = ['user-1'];

interface UserActivity {
  userId: string;
  user: User;
  lastActive: string;
  location: string;
  ipAddress: string;
  device: string;
  browser: string;
}

interface AdminPageProps {
  currentUser: User;
  allUsers: User[];
  allGroups: Group[];
  allPosts: Post[];
  onBack: () => void;
}

export function AdminPage({
  currentUser,
  allUsers,
  allGroups,
  allPosts,
  onBack,
}: AdminPageProps) {
  const [activeTab, setActiveTab] = useState<'users' | 'groups' | 'posts' | 'monitoring' | 'settings'>('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showUserDetailDialog, setShowUserDetailDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [itemToDelete, setItemToDelete] = useState<{ type: string; id: string; name: string } | null>(null);
  const [userActivities, setUserActivities] = useState<UserActivity[]>([]);
  const [users, setUsers] = useState<User[]>(allUsers);
  const [posts, setPosts] = useState<Post[]>(allPosts);
  const [groups] = useState<Group[]>(allGroups);
  const [isLoading, setIsLoading] = useState(false);

  // App settings state
  const [appSettings, setAppSettings] = useState({
    appName: 'TeamConnect',
    allowPublicRegistration: true,
    requireApproval: false,
    maxPostLength: 2000,
    maxImagesPerPost: 10,
    mediaRetentionDays: 180,
  });

  // Check if current user is admin
  const isAdmin = ADMIN_USER_IDS.includes(currentUser.id);

  // Load users from Supabase
  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading users:', error);
      } else if (data) {
        setUsers(data.map(p => ({
          id: p.id,
          email: p.email,
          name: p.name,
          avatar: p.avatar_url,
          role: p.role || 'user',
          createdAt: p.created_at,
        })));
      }
    } catch (err) {
      console.error('Error loading users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Load posts from Supabase
  const loadPosts = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`*, author:profiles(*)`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading posts:', error);
      } else if (data) {
        setPosts(data.map(p => ({
          id: p.id,
          groupId: p.group_id || 'default',
          authorId: p.user_id,
          author: p.author ? {
            id: p.author.id,
            email: p.author.email,
            name: p.author.name,
            avatar: p.author.avatar_url,
            role: p.author.role,
            createdAt: p.author.created_at,
          } : { id: p.user_id, name: 'Unknown', email: '', createdAt: p.created_at },
          content: p.content,
          images: p.images || [],
          likes: p.likes_count || 0,
          likedBy: [],
          commentsCount: p.comments_count || 0,
          createdAt: p.created_at,
          updatedAt: p.updated_at,
        })));
      }
    } catch (err) {
      console.error('Error loading posts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Load mock user activity data
  useEffect(() => {
    const activities: UserActivity[] = users.map((user, index) => ({
      userId: user.id,
      user,
      lastActive: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString(),
      location: ['Jakarta, Indonesia', 'Singapore', 'Kuala Lumpur, Malaysia', 'Bangkok, Thailand', 'Manila, Philippines', 'Ho Chi Minh City, Vietnam'][index % 6],
      ipAddress: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      device: ['iPhone 14 Pro', 'Samsung Galaxy S23', 'MacBook Pro', 'Windows PC', 'iPad Pro', 'Android Tablet'][index % 6],
      browser: ['Chrome', 'Safari', 'Firefox', 'Edge', 'Opera', 'Brave'][index % 6],
    }));
    setUserActivities(activities);
  }, [users]);

  // Load data on mount
  useEffect(() => {
    loadUsers();
    loadPosts();
  }, []);

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredGroups = groups.filter(
    (group) =>
      group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPosts = posts.filter(
    (post) =>
      post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.author?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDeleteUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) {
        toast.error('Failed to delete user');
        console.error(error);
      } else {
        toast.success('User deleted');
        setUsers(users.filter(u => u.id !== userId));
      }
    } catch (err) {
      toast.error('Failed to delete user');
      console.error(err);
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);

      if (error) {
        toast.error('Failed to delete post');
        console.error(error);
      } else {
        toast.success('Post deleted');
        setPosts(posts.filter(p => p.id !== postId));
      }
    } catch (err) {
      toast.error('Failed to delete post');
      console.error(err);
    }
  };

  const handleToggleAdmin = async (user: User) => {
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', user.id);

      if (error) {
        toast.error('Failed to update role');
        console.error(error);
      } else {
        toast.success(`${user.name} is now ${newRole}`);
        setUsers(users.map(u => u.id === user.id ? { ...u, role: newRole } : u));
      }
    } catch (err) {
      toast.error('Failed to update role');
      console.error(err);
    }
  };

  const handleDelete = () => {
    if (!itemToDelete) return;

    switch (itemToDelete.type) {
      case 'user':
        handleDeleteUser(itemToDelete.id);
        break;
      case 'post':
        handleDeletePost(itemToDelete.id);
        break;
    }
    setShowDeleteDialog(false);
    setItemToDelete(null);
  };

  const confirmDelete = (type: string, id: string, name: string) => {
    setItemToDelete({ type, id, name });
    setShowDeleteDialog(true);
  };

  const viewUserDetail = (user: User) => {
    setSelectedUser(user);
    setShowUserDetailDialog(true);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  const formatLastActive = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const saveSettings = () => {
    // In production, save to Supabase
    localStorage.setItem('teamconnect_settings', JSON.stringify(appSettings));
    toast.success('Settings saved');
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#F2F4F7] flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-[#050505] mb-2">Access Denied</h1>
          <p className="text-[#65676B] mb-4">You don't have permission to access this page.</p>
          <Button onClick={onBack} className="bg-[#1877F2] hover:bg-[#166fe5]">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F2F4F7] pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-[#DADDE1]">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 -ml-2 hover:bg-[#F0F2F5] rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-[#050505]" />
          </button>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#1877F2]" />
            <h1 className="text-[17px] font-semibold text-[#050505]">Admin Panel</h1>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="max-w-lg mx-auto px-4 py-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl shadow-sm p-4 text-center">
            <Users className="w-6 h-6 text-[#1877F2] mx-auto mb-2" />
            <p className="text-[20px] font-bold text-[#050505]">{users.length}</p>
            <p className="text-[12px] text-[#65676B]">Users</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 text-center">
            <Globe className="w-6 h-6 text-[#42B72A] mx-auto mb-2" />
            <p className="text-[20px] font-bold text-[#050505]">{groups.length}</p>
            <p className="text-[12px] text-[#65676B]">Groups</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 text-center">
            <Activity className="w-6 h-6 text-[#F7B928] mx-auto mb-2" />
            <p className="text-[20px] font-bold text-[#050505]">{posts.length}</p>
            <p className="text-[12px] text-[#65676B]">Posts</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-lg mx-auto px-4">
        <div className="bg-white rounded-xl shadow-sm p-1 flex gap-1 overflow-x-auto">
          {(['users', 'groups', 'posts', 'monitoring', 'settings'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 text-[13px] font-medium rounded-lg capitalize transition-colors whitespace-nowrap ${
                activeTab === tab
                  ? 'bg-[#1877F2] text-white'
                  : 'text-[#65676B] hover:bg-[#F0F2F5]'
              }`}
            >
              {tab === 'settings' ? (
                <span className="flex items-center justify-center gap-1">
                  <Settings className="w-3 h-3" />
                  Settings
                </span>
              ) : (
                tab
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      {activeTab !== 'settings' && (
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#65676B]" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${activeTab}...`}
              className="pl-10"
            />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-lg mx-auto px-4">
        {activeTab === 'users' && (
          <div className="space-y-3">
            {isLoading ? (
              <div className="text-center py-8">
                <Activity className="w-8 h-8 animate-spin text-[#1877F2] mx-auto" />
                <p className="text-[#65676B] mt-2">Loading users...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-[#DADDE1] mx-auto mb-3" />
                <p className="text-[#65676B]">No users found</p>
              </div>
            ) : (
              filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="bg-white rounded-xl shadow-sm p-4"
                >
                  <div className="flex items-center justify-between">
                    <div 
                      className="flex items-center gap-3 flex-1 cursor-pointer"
                      onClick={() => viewUserDetail(user)}
                    >
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={user.avatar} alt={user.name} />
                        <AvatarFallback className="bg-[#1877F2] text-white">
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-[15px] font-medium text-[#050505]">{user.name}</p>
                          {user.role === 'admin' && (
                            <Shield className="w-4 h-4 text-[#1877F2]" />
                          )}
                        </div>
                        <p className="text-[13px] text-[#65676B]">{user.email}</p>
                        <p className="text-[12px] text-[#65676B]">
                          Joined {new Date(user.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-2 hover:bg-[#F0F2F5] rounded-full">
                          <MoreVertical className="w-5 h-5 text-[#65676B]" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => viewUserDetail(user)}>
                          <UserCog className="w-4 h-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleAdmin(user)}>
                          {user.role === 'admin' ? (
                            <>
                              <Ban className="w-4 h-4 mr-2" />
                              Remove Admin
                            </>
                          ) : (
                            <>
                              <Shield className="w-4 h-4 mr-2" />
                              Make Admin
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => confirmDelete('user', user.id, user.name)}
                          className="text-red-500"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'groups' && (
          <div className="space-y-3">
            {filteredGroups.length === 0 ? (
              <div className="text-center py-8">
                <Globe className="w-12 h-12 text-[#DADDE1] mx-auto mb-3" />
                <p className="text-[#65676B]">No groups found</p>
              </div>
            ) : (
              filteredGroups.map((group) => (
                <div
                  key={group.id}
                  className="bg-white rounded-xl shadow-sm p-4"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12 rounded-xl">
                      <AvatarImage src={group.avatar} alt={group.name} />
                      <AvatarFallback className="bg-[#1877F2] text-white rounded-xl">
                        {getInitials(group.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-[15px] font-medium text-[#050505]">{group.name}</p>
                      <p className="text-[13px] text-[#65676B]">{group.description}</p>
                      <p className="text-[12px] text-[#65676B]">
                        Level {group.level}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'posts' && (
          <div className="space-y-3">
            {isLoading ? (
              <div className="text-center py-8">
                <Activity className="w-8 h-8 animate-spin text-[#1877F2] mx-auto" />
                <p className="text-[#65676B] mt-2">Loading posts...</p>
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-[#DADDE1] mx-auto mb-3" />
                <p className="text-[#65676B]">No posts found</p>
              </div>
            ) : (
              filteredPosts.map((post) => (
                <div
                  key={post.id}
                  className="bg-white rounded-xl shadow-sm p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={post.author?.avatar} alt={post.author?.name} />
                        <AvatarFallback className="bg-[#1877F2] text-white">
                          {getInitials(post.author?.name || 'U')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-[14px] font-medium text-[#050505]">
                          {post.author?.name}
                        </p>
                        <p className="text-[12px] text-[#65676B]">
                          {new Date(post.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => confirmDelete('post', post.id, 'Post')}
                      className="p-2 hover:bg-red-50 rounded-full transition-colors"
                    >
                      <Trash2 className="w-5 h-5 text-red-500" />
                    </button>
                  </div>
                  <p className="text-[14px] text-[#050505] mt-3 line-clamp-3">{post.content}</p>
                  <div className="flex items-center gap-4 mt-3 text-[12px] text-[#65676B]">
                    <span className="flex items-center gap-1">
                      <Activity className="w-3 h-3" />
                      {post.likes} likes
                    </span>
                    <span className="flex items-center gap-1">
                      <FileText className="w-3 h-3" />
                      {post.commentsCount} comments
                    </span>
                    {post.images.length > 0 && (
                      <span className="flex items-center gap-1">
                        <ImageIcon className="w-3 h-3" />
                        {post.images.length} images
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'monitoring' && (
          <div className="space-y-3">
            {userActivities.map((activity) => (
              <div
                key={activity.userId}
                className="bg-white rounded-xl shadow-sm p-4"
              >
                <div className="flex items-center gap-3 mb-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={activity.user.avatar} alt={activity.user.name} />
                    <AvatarFallback className="bg-[#1877F2] text-white">
                      {getInitials(activity.user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-[14px] font-medium text-[#050505]">
                      {activity.user.name}
                    </p>
                    <div className="flex items-center gap-2 text-[12px] text-[#65676B]">
                      <Clock className="w-3 h-3" />
                      <span>{formatLastActive(activity.lastActive)}</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[12px]">
                  <div className="flex items-center gap-2 text-[#65676B]">
                    <MapPin className="w-3 h-3" />
                    <span>{activity.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#65676B]">
                    <Globe className="w-3 h-3" />
                    <span>{activity.ipAddress}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#65676B]">
                    <Activity className="w-3 h-3" />
                    <span>{activity.device}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#65676B]">
                    <Globe className="w-3 h-3" />
                    <span>{activity.browser}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-4">
            {/* App Settings */}
            <div className="bg-white rounded-xl shadow-sm p-4">
              <h3 className="text-[16px] font-semibold text-[#050505] mb-4 flex items-center gap-2">
                <Settings className="w-5 h-5 text-[#1877F2]" />
                App Settings
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-[14px] font-medium text-[#050505]">App Name</label>
                  <Input
                    value={appSettings.appName}
                    onChange={(e) => setAppSettings({ ...appSettings, appName: e.target.value })}
                    className="mt-1"
                  />
                </div>

                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-[14px] font-medium text-[#050505]">Public Registration</p>
                    <p className="text-[12px] text-[#65676B]">Allow anyone to register</p>
                  </div>
                  <button
                    onClick={() => setAppSettings({ ...appSettings, allowPublicRegistration: !appSettings.allowPublicRegistration })}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      appSettings.allowPublicRegistration ? 'bg-[#1877F2]' : 'bg-gray-300'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      appSettings.allowPublicRegistration ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>

                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-[14px] font-medium text-[#050505]">Require Approval</p>
                    <p className="text-[12px] text-[#65676B]">New users need admin approval</p>
                  </div>
                  <button
                    onClick={() => setAppSettings({ ...appSettings, requireApproval: !appSettings.requireApproval })}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      appSettings.requireApproval ? 'bg-[#1877F2]' : 'bg-gray-300'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      appSettings.requireApproval ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>
              </div>
            </div>

            {/* Content Settings */}
            <div className="bg-white rounded-xl shadow-sm p-4">
              <h3 className="text-[16px] font-semibold text-[#050505] mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#42B72A]" />
                Content Settings
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-[14px] font-medium text-[#050505]">Max Post Length</label>
                  <Input
                    type="number"
                    value={appSettings.maxPostLength}
                    onChange={(e) => setAppSettings({ ...appSettings, maxPostLength: parseInt(e.target.value) })}
                    className="mt-1"
                  />
                </div>

                <div>
                  <label className="text-[14px] font-medium text-[#050505]">Max Images Per Post</label>
                  <Input
                    type="number"
                    value={appSettings.maxImagesPerPost}
                    onChange={(e) => setAppSettings({ ...appSettings, maxImagesPerPost: parseInt(e.target.value) })}
                    className="mt-1"
                  />
                </div>

                <div>
                  <label className="text-[14px] font-medium text-[#050505]">Media Retention (days)</label>
                  <Input
                    type="number"
                    value={appSettings.mediaRetentionDays}
                    onChange={(e) => setAppSettings({ ...appSettings, mediaRetentionDays: parseInt(e.target.value) })}
                    className="mt-1"
                  />
                  <p className="text-[12px] text-[#65676B] mt-1">
                    Media older than this will be automatically deleted
                  </p>
                </div>
              </div>
            </div>

            <Button 
              onClick={saveSettings}
              className="w-full bg-[#1877F2] hover:bg-[#166fe5]"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Save Settings
            </Button>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{' '}
              <span className="font-medium text-[#050505]">{itemToDelete?.name}</span>?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 mt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setShowDeleteDialog(false);
                setItemToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button variant="destructive" className="flex-1" onClick={handleDelete}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* User Detail Dialog */}
      <Dialog open={showUserDetailDialog} onOpenChange={setShowUserDetailDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="pt-4">
              <div className="flex items-center gap-4 mb-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={selectedUser.avatar} alt={selectedUser.name} />
                  <AvatarFallback className="bg-[#1877F2] text-white text-lg">
                    {getInitials(selectedUser.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-[18px] font-semibold text-[#050505]">{selectedUser.name}</p>
                  <p className="text-[14px] text-[#65676B]">{selectedUser.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[12px] px-2 py-0.5 rounded-full ${
                      selectedUser.role === 'admin' 
                        ? 'bg-[#1877F2] text-white' 
                        : 'bg-[#F0F2F5] text-[#65676B]'
                    }`}>
                      {selectedUser.role || 'user'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 text-[14px]">
                <div className="flex justify-between py-2 border-b border-[#F0F2F5]">
                  <span className="text-[#65676B]">User ID</span>
                  <span className="text-[#050505] font-mono text-[12px]">{selectedUser.id.slice(0, 8)}...</span>
                </div>
                <div className="flex justify-between py-2 border-b border-[#F0F2F5]">
                  <span className="text-[#65676B]">Joined</span>
                  <span className="text-[#050505]">{new Date(selectedUser.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-[#F0F2F5]">
                  <span className="text-[#65676B]">Posts</span>
                  <span className="text-[#050505]">{posts.filter(p => p.authorId === selectedUser.id).length}</span>
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowUserDetailDialog(false)}
                >
                  Close
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => {
                    handleToggleAdmin(selectedUser);
                    setShowUserDetailDialog(false);
                  }}
                >
                  {selectedUser.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
