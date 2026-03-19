import { useState, useCallback } from 'react';
import { Search } from 'lucide-react';
import type { User, Post, Group } from '@/types';
import { PostCard } from '@/components/PostCard';
import { CreatePost } from '@/components/CreatePost';
import { PhotoLightbox } from '@/components/PhotoLightbox';
import { GroupSelector } from '@/components/GroupSelector';
import { GroupManagement } from '@/components/GroupManagement';
import { Button } from '@/components/ui/button';

interface FeedPageProps {
  currentUser: User | null;
  posts: Post[];
  groups: Group[];
  adminGroups: Group[];
  currentGroup: Group | null;
  onSelectGroup: (group: Group | null) => void;
  onCreateGroup: (name: string, description: string, parentId: string | null) => void;
  onLike: (postId: string) => Promise<{ liked: boolean; likes: number } | void> | { liked: boolean; likes: number } | void;
  onCreatePost: (content: string, images: string[]) => void;
  onDeletePost: (postId: string) => void;
  onNavigateToPost: (postId: string) => void;
  // Group management
  groupMembers: any[];
  isGroupAdmin: boolean;
  onPromoteMember: (groupId: string, userId: string) => boolean;
  onDemoteMember: (groupId: string, userId: string) => boolean;
  onRemoveMember: (groupId: string, userId: string) => boolean;
  onRegenerateInviteCode: (groupId: string) => string | null;
}

export function FeedPage({
  currentUser,
  posts,
  groups,
  adminGroups,
  currentGroup,
  onSelectGroup,
  onCreateGroup,
  onLike,
  onCreatePost,
  onDeletePost,
  onNavigateToPost,
  groupMembers,
  isGroupAdmin,
  onPromoteMember,
  onDemoteMember,
  onRemoveMember,
  onRegenerateInviteCode,
}: FeedPageProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const handlePhotoClick = useCallback((images: string[], index: number) => {
    setLightboxImages(images);
    setLightboxIndex(index);
    setLightboxOpen(true);
  }, []);

  // Filter posts by current group
  const filteredPosts = currentGroup
    ? posts.filter(p => p.groupId === currentGroup.id)
    : posts;

  // Wrap handlers to include groupId
  const handlePromote = (userId: string) => {
    if (currentGroup) {
      onPromoteMember(currentGroup.id, userId);
    }
  };

  const handleDemote = (userId: string) => {
    if (currentGroup) {
      onDemoteMember(currentGroup.id, userId);
    }
  };

  const handleRemove = (userId: string) => {
    if (currentGroup) {
      onRemoveMember(currentGroup.id, userId);
    }
  };

  const handleRegenerate = () => {
    if (currentGroup) {
      return onRegenerateInviteCode(currentGroup.id);
    }
    return null;
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-[#DADDE1]">
        <div className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto">
          <h1 className="text-[18px] font-bold text-[#1877F2]">TeamConnect</h1>
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <Search className="w-5 h-5 text-[#050505]" />
          </Button>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-lg mx-auto p-3 space-y-3">
        {/* Group Selector */}
        <div className="flex items-center justify-between">
          <GroupSelector
            groups={groups}
            currentGroup={currentGroup}
            onSelectGroup={onSelectGroup}
            onCreateGroup={onCreateGroup}
            adminGroups={adminGroups}
          />
        </div>

        {/* Group Management (if a group is selected) */}
        {currentGroup && (
          <GroupManagement
            group={currentGroup}
            members={groupMembers}
            currentUser={currentUser!}
            isAdmin={isGroupAdmin}
            onPromote={handlePromote}
            onDemote={handleDemote}
            onRemove={handleRemove}
            onRegenerateInviteCode={handleRegenerate}
          />
        )}

        {/* Create post */}
        <CreatePost currentUser={currentUser} onSubmit={onCreatePost} />

        {/* Posts feed */}
        {filteredPosts.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 bg-[#F0F2F5] rounded-full flex items-center justify-center">
              <svg
                className="w-12 h-12 text-[#65676B]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
                />
              </svg>
            </div>
            <h3 className="text-[16px] font-semibold text-[#050505] mb-1">
              No posts yet
            </h3>
            <p className="text-[14px] text-[#65676B]">
              {currentGroup 
                ? `Be the first to post in ${currentGroup.name}!`
                : 'Be the first to share something with your team!'}
            </p>
          </div>
        ) : (
          filteredPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUser={currentUser}
              onLike={onLike}
              onComment={onNavigateToPost}
              onDelete={currentUser?.id === post.authorId ? onDeletePost : undefined}
              onPhotoClick={handlePhotoClick}
            />
          ))
        )}
      </main>

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
