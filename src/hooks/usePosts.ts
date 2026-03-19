import { useState, useEffect, useCallback } from 'react';
import type { Post, Comment, User } from '@/types';
import { createPost, deletePost, toggleLike, getComments, createComment, getPostsByGroupId, getPostsByGroupIds } from '@/lib/db';
import { getVisibleGroups } from '@/lib/groups';

export function usePosts(currentUser: User | null, groupId?: string) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshPosts = useCallback(() => {
    if (!currentUser) {
      setPosts([]);
      setIsLoading(false);
      return;
    }

    let filteredPosts: Post[] = [];

    if (groupId) {
      // Get posts for specific group
      filteredPosts = getPostsByGroupId(groupId);
    } else {
      // Get posts from all visible groups
      const visibleGroups = getVisibleGroups(currentUser.id);
      const visibleGroupIds = visibleGroups.map(g => g.id);
      filteredPosts = getPostsByGroupIds(visibleGroupIds);
    }

    setPosts(filteredPosts);
    setIsLoading(false);
  }, [currentUser, groupId]);

  useEffect(() => {
    refreshPosts();
  }, [refreshPosts]);

  const addPost = useCallback((content: string, images: string[], authorId: string, targetGroupId?: string): Post | null => {
    const postGroupId = targetGroupId || groupId;
    if (!postGroupId) {
      console.error('No group specified for post');
      return null;
    }

    const newPost = createPost({
      groupId: postGroupId,
      content,
      images,
      authorId,
    });

    setPosts(prev => [newPost, ...prev]);
    return newPost;
  }, [groupId]);

  const removePost = useCallback((postId: string): boolean => {
    const success = deletePost(postId);
    if (success) {
      setPosts(prev => prev.filter(p => p.id !== postId));
    }
    return success;
  }, []);

  const handleToggleLike = useCallback((postId: string, userId: string): { liked: boolean; likes: number } | null => {
    const result = toggleLike(postId, userId);
    refreshPosts();
    return result;
  }, [refreshPosts]);

  const getPostComments = useCallback((postId: string): Comment[] => {
    return getComments(postId);
  }, []);

  const addComment = useCallback((postId: string, content: string, authorId: string): Comment | null => {
    const newComment = createComment({
      postId,
      content,
      authorId,
    });
    refreshPosts();
    return newComment;
  }, [refreshPosts]);

  return {
    posts,
    isLoading,
    refreshPosts,
    addPost,
    deletePost: removePost,
    toggleLike: handleToggleLike,
    getPostComments,
    addComment,
  };
}
