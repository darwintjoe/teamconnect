import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Send } from 'lucide-react';
import type { User, Post, Comment } from '@/types';
import { PostCard } from '@/components/PostCard';
import { CommentItem } from '@/components/CommentItem';
import { PhotoLightbox } from '@/components/PhotoLightbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface PostDetailPageProps {
  post: Post | undefined;
  comments: Comment[];
  currentUser: User | null;
  onLike: (postId: string) => Promise<{ liked: boolean; likes: number } | void> | { liked: boolean; likes: number } | void;
  onAddComment: (postId: string, content: string) => void;
  onDeletePost: (postId: string) => void;
  onBack: () => void;
}

export function PostDetailPage({
  post,
  comments,
  currentUser,
  onLike,
  onAddComment,
  onDeletePost,
  onBack,
}: PostDetailPageProps) {
  const [commentText, setCommentText] = useState('');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of comments when new comment added
  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments.length]);

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#65676B]">Post not found</p>
          <Button onClick={onBack} className="mt-4">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const handleSubmitComment = () => {
    if (!commentText.trim() || !currentUser) return;
    onAddComment(post.id, commentText.trim());
    setCommentText('');
  };

  const handleReply = (authorName: string) => {
    setCommentText(`@${authorName} `);
    inputRef.current?.focus();
  };

  const handlePhotoClick = (images: string[], index: number) => {
    setLightboxImages(images);
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-[#DADDE1]">
        <div className="flex items-center px-4 py-3 max-w-lg mx-auto">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 mr-3"
            onClick={onBack}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-[18px] font-bold">Post</h1>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-lg mx-auto">
        {/* Post */}
        <PostCard
          post={post}
          currentUser={currentUser}
          onLike={onLike}
          onComment={() => inputRef.current?.focus()}
          onDelete={currentUser?.id === post.authorId ? onDeletePost : undefined}
          onPhotoClick={handlePhotoClick}
          expanded
        />

        {/* Comments section */}
        <div className="bg-white mt-3 p-4">
          <h2 className="text-[16px] font-semibold text-[#050505] mb-4">
            Comments ({comments.length})
          </h2>

          {comments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-[14px] text-[#65676B]">
                No comments yet. Be the first to share your thoughts!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  currentUser={currentUser}
                  onReply={handleReply}
                />
              ))}
              <div ref={commentsEndRef} />
            </div>
          )}
        </div>
      </main>

      {/* Comment input */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#DADDE1] p-3 safe-bottom z-40">
        <div className="max-w-lg mx-auto flex items-center gap-2">
          <Input
            ref={inputRef}
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSubmitComment();
            }}
            placeholder="Write a comment..."
            className="flex-1 rounded-full bg-[#F0F2F5] border-0 focus-visible:ring-1 focus-visible:ring-[#1877F2]"
          />
          <Button
            onClick={handleSubmitComment}
            disabled={!commentText.trim()}
            className="rounded-full w-10 h-10 p-0 bg-[#1877F2] hover:bg-[#166fe5]"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>

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
