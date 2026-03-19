import { useState } from 'react';
import { Heart, MessageCircle, Share2, MoreHorizontal } from 'lucide-react';
import type { Post, User } from '@/types';
import { formatDistanceToNow } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface PostCardProps {
  post: Post;
  currentUser: User | null;
  onLike: (postId: string) => Promise<{ liked: boolean; likes: number } | void> | { liked: boolean; likes: number } | void;
  onComment: (postId: string) => void;
  onDelete?: (postId: string) => void;
  onPhotoClick?: (images: string[], index: number) => void;
  expanded?: boolean;
}

export function PostCard({
  post,
  currentUser,
  onLike,
  onComment,
  onDelete,
  onPhotoClick,
  expanded = false,
}: PostCardProps) {
  const [isLiked, setIsLiked] = useState(currentUser ? post.likedBy.includes(currentUser.id) : false);
  const [likeCount, setLikeCount] = useState(post.likes);
  const [isLikeAnimating, setIsLikeAnimating] = useState(false);

  const handleLike = () => {
    if (!currentUser) return;
    
    setIsLikeAnimating(true);
    setTimeout(() => setIsLikeAnimating(false), 150);
    
    const result = onLike(post.id);
    if (result && typeof result === 'object' && 'liked' in result) {
      setIsLiked(result.liked);
      setLikeCount(result.likes);
    } else {
      // Toggle local state if no result returned
      setIsLiked(!isLiked);
      setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);
    }
  };

  const getPhotoGridClass = () => {
    switch (post.images.length) {
      case 1: return 'photo-grid-1';
      case 2: return 'photo-grid-2';
      case 3: return 'photo-grid-3';
      case 4: return 'photo-grid-4';
      default: return 'photo-grid-4';
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <article className="bg-white rounded-xl shadow-sm animate-fade-up">
      {/* Header */}
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10">
            <AvatarImage src={post.author?.avatar} alt={post.author?.name} />
            <AvatarFallback className="bg-gray-200 text-gray-600">
              {getInitials(post.author?.name || 'U')}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold text-[15px] text-[#050505]">
              {post.author?.name}
            </h3>
            <p className="text-[13px] text-[#65676B]">
              {post.author?.role}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[13px] text-[#65676B]">
            {formatDistanceToNow(new Date(post.createdAt))}
          </span>
          {onDelete && currentUser?.id === post.authorId && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-5 w-5 text-[#65676B]" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem 
                  className="text-red-500"
                  onClick={() => onDelete(post.id)}
                >
                  Delete Post
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-3 pb-3">
        <p className={`text-[15px] text-[#050505] leading-relaxed ${expanded ? '' : 'line-clamp-3'}`}>
          {post.content}
        </p>
      </div>

      {/* Images */}
      {post.images.length > 0 && (
        <div 
          className={`${getPhotoGridClass()} overflow-hidden ${post.images.length > 4 ? 'grid grid-cols-2 grid-rows-2 gap-0.5' : ''}`}
          style={{ maxHeight: '500px' }}
        >
          {post.images.slice(0, 4).map((image, index) => (
            <div 
              key={index} 
              className="relative overflow-hidden cursor-pointer group"
              onClick={() => onPhotoClick?.(post.images, index)}
            >
              <img
                src={image}
                alt={`Post image ${index + 1}`}
                className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                loading="lazy"
              />
              {index === 3 && post.images.length > 4 && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <span className="text-white text-2xl font-semibold">
                    +{post.images.length - 4}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-[#DADDE1]">
        <div className="flex items-center gap-1">
          <div className="flex items-center justify-center w-5 h-5 bg-[#1877F2] rounded-full">
            <Heart className="w-3 h-3 text-white fill-white" />
          </div>
          <span className="text-[13px] text-[#65676B]">{likeCount}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[13px] text-[#65676B]">
            {post.commentsCount} comments
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-around px-2 py-1 border-t border-[#DADDE1]">
        <Button
          variant="ghost"
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 touch-target ${
            isLiked ? 'text-[#1877F2]' : 'text-[#65676B]'
          }`}
          onClick={handleLike}
        >
          <Heart 
            className={`w-5 h-5 transition-all ${isLiked ? 'fill-[#1877F2] animate-like' : ''} ${isLikeAnimating ? 'animate-like' : ''}`} 
          />
          <span className="text-[14px] font-semibold">Like</span>
        </Button>
        <Button
          variant="ghost"
          className="flex-1 flex items-center justify-center gap-2 py-2.5 text-[#65676B] touch-target"
          onClick={() => onComment(post.id)}
        >
          <MessageCircle className="w-5 h-5" />
          <span className="text-[14px] font-semibold">Comment</span>
        </Button>
        <Button
          variant="ghost"
          className="flex-1 flex items-center justify-center gap-2 py-2.5 text-[#65676B] touch-target"
          onClick={() => {
            // Share functionality
            if (navigator.share) {
              navigator.share({
                title: 'TeamConnect Post',
                text: post.content,
                url: window.location.href,
              });
            }
          }}
        >
          <Share2 className="w-5 h-5" />
          <span className="text-[14px] font-semibold">Share</span>
        </Button>
      </div>
    </article>
  );
}
