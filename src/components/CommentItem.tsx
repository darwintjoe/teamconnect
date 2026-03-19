import { useState } from 'react';
import type { Comment, User } from '@/types';
import { formatDistanceToNow } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

interface CommentItemProps {
  comment: Comment;
  currentUser: User | null;
  onReply?: (authorName: string) => void;
}

export function CommentItem({ comment, currentUser: _currentUser, onReply }: CommentItemProps) {
  const [isLiked, setIsLiked] = useState(false);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="flex gap-2 animate-fade-up">
      <Avatar className="w-8 h-8 flex-shrink-0">
        <AvatarImage src={comment.author?.avatar} alt={comment.author?.name} />
        <AvatarFallback className="bg-gray-200 text-gray-600 text-xs">
          {getInitials(comment.author?.name || 'U')}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="bg-[#F0F2F5] rounded-2xl rounded-tl-sm px-3 py-2 inline-block max-w-full">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[14px] text-[#050505]">
              {comment.author?.name}
            </span>
          </div>
          <p className="text-[14px] text-[#050505] leading-relaxed break-words">
            {comment.content}
          </p>
        </div>
        <div className="flex items-center gap-3 mt-1 ml-1">
          <Button
            variant="ghost"
            size="sm"
            className={`h-auto p-0 text-[12px] font-semibold ${
              isLiked ? 'text-[#1877F2]' : 'text-[#65676B]'
            }`}
            onClick={() => setIsLiked(!isLiked)}
          >
            Like
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-auto p-0 text-[12px] font-semibold text-[#65676B]"
            onClick={() => onReply?.(comment.author?.name || '')}
          >
            Reply
          </Button>
          <span className="text-[12px] text-[#65676B]">
            {formatDistanceToNow(new Date(comment.createdAt))}
          </span>
        </div>
      </div>
    </div>
  );
}
