import { useState, useRef } from 'react';
import { Camera, LogOut, Edit2, Users, Shield, ChevronRight } from 'lucide-react';
import type { User, Post } from '@/types';
import { PostCard } from '@/components/PostCard';
import { PhotoLightbox } from '@/components/PhotoLightbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ProfilePageProps {
  user: User | null;
  posts: Post[];
  currentUser: User | null;
  isOwnProfile: boolean;
  onLike: (postId: string) => Promise<{ liked: boolean; likes: number } | void> | { liked: boolean; likes: number } | void;
  onDeletePost: (postId: string) => void;
  onNavigateToPost: (postId: string) => void;
  onUpdateProfile: (updates: Partial<User>) => void;
  onLogout: () => void;
  onNavigateToGroups?: () => void;
  onNavigateToAdmin?: () => void;
  isAdmin?: boolean;
}

export function ProfilePage({
  user,
  posts,
  currentUser,
  isOwnProfile,
  onLike,
  onDeletePost,
  onNavigateToPost,
  onUpdateProfile,
  onLogout,
  onNavigateToGroups,
  onNavigateToAdmin,
  isAdmin = false,
}: ProfilePageProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editRole, setEditRole] = useState(user?.role || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const totalLikes = posts.reduce((sum, post) => sum + post.likes, 0);

  const handlePhotoClick = (images: string[], index: number) => {
    setLightboxImages(images);
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      onUpdateProfile({ avatar: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = () => {
    onUpdateProfile({
      name: editName,
      role: editRole,
    });
    setEditDialogOpen(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-[#65676B]">User not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      {/* Cover */}
      <div className="h-32 bg-gradient-to-r from-[#1877F2] to-[#42B72A]" />

      {/* Profile info */}
      <div className="max-w-lg mx-auto px-4">
        <div className="relative -mt-12 mb-4">
          <div className="relative inline-block">
            <Avatar className="w-24 h-24 border-4 border-white">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback className="bg-gray-200 text-gray-600 text-2xl">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            {isOwnProfile && (
              <>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarUpload}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 w-8 h-8 bg-[#F0F2F5] rounded-full flex items-center justify-center border-2 border-white hover:bg-[#E4E6EB]"
                >
                  <Camera className="w-4 h-4 text-[#65676B]" />
                </button>
              </>
            )}
          </div>
        </div>

        <div className="mb-6">
          <h1 className="text-[24px] font-bold text-[#050505]">{user.name}</h1>
          <p className="text-[15px] text-[#65676B]">{user.role}</p>
          <p className="text-[13px] text-[#65676B] mt-1">
            Joined {new Date(user.createdAt).toLocaleDateString('en-US', {
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-6 py-4 border-y border-[#DADDE1] mb-6">
          <div className="text-center">
            <p className="text-[18px] font-bold text-[#050505]">{posts.length}</p>
            <p className="text-[13px] text-[#65676B]">Posts</p>
          </div>
          <div className="text-center">
            <p className="text-[18px] font-bold text-[#050505]">{totalLikes}</p>
            <p className="text-[13px] text-[#65676B]">Likes received</p>
          </div>
        </div>

        {/* Actions */}
        {isOwnProfile && (
          <div className="space-y-2 mb-6">
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setEditDialogOpen(true)}
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
              <Button
                variant="outline"
                className="flex-1 text-red-500 hover:text-red-600"
                onClick={onLogout}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>

            {/* My Groups */}
            {onNavigateToGroups && (
              <button
                onClick={onNavigateToGroups}
                className="w-full flex items-center justify-between p-3 bg-white border border-[#DADDE1] rounded-lg hover:bg-[#F0F2F5] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#1877F2] rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="text-[14px] font-medium text-[#050505]">My Groups</p>
                    <p className="text-[12px] text-[#65676B]">Manage your groups</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-[#65676B]" />
              </button>
            )}

            {/* Admin Panel */}
            {isAdmin && onNavigateToAdmin && (
              <button
                onClick={onNavigateToAdmin}
                className="w-full flex items-center justify-between p-3 bg-white border border-[#DADDE1] rounded-lg hover:bg-[#F0F2F5] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#42B72A] rounded-lg flex items-center justify-center">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="text-[14px] font-medium text-[#050505]">Admin Panel</p>
                    <p className="text-[12px] text-[#65676B]">Manage users and content</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-[#65676B]" />
              </button>
            )}
          </div>
        )}

        {/* Posts */}
        <div>
          <h2 className="text-[18px] font-bold text-[#050505] mb-4">Posts</h2>
          {posts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-[14px] text-[#65676B]">
                {isOwnProfile
                  ? "You haven't posted anything yet."
                  : `${user.name} hasn't posted anything yet.`}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  currentUser={currentUser}
                  onLike={onLike}
                  onComment={onNavigateToPost}
                  onDelete={isOwnProfile ? onDeletePost : undefined}
                  onPhotoClick={handlePhotoClick}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Profile Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Your name"
              />
            </div>
            <div>
              <Label htmlFor="role">Role</Label>
              <Input
                id="role"
                value={editRole}
                onChange={(e) => setEditRole(e.target.value)}
                placeholder="Your role"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-[#1877F2] hover:bg-[#166fe5]"
                onClick={handleSaveProfile}
              >
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Photo Lightbox */}
      <PhotoLightbox
        images={lightboxImages}
        initialIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </div>
  );
}
