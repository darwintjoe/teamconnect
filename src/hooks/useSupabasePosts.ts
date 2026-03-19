import { useState, useEffect, useCallback } from 'react';
import type { Post, User } from '@/types';
import * as db from '@/lib/db-supabase';

export function useSupabasePosts(currentUser: User | null, groupId?: string) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch posts
  const fetchPosts = useCallback(async () => {
    if (!currentUser) {
      setPosts([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      let data: Post[];
      if (groupId) {
        data = await db.getPostsByGroupId(groupId);
      } else {
        data = await db.getPosts();
      }
      
      // Check which posts the current user has liked
      const postsWithLikes = await Promise.all(
        data.map(async (post) => {
          const hasLiked = await db.hasUserLikedPost(post.id, currentUser.id);
          return { ...post, likedBy: hasLiked ? [currentUser.id] : [] };
        })
      );
      
      setPosts(postsWithLikes);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, groupId]);

  // Initial fetch
  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!currentUser) return;

    const subscription = db.subscribeToPosts((newPost) => {
      setPosts((prev) => {
        const exists = prev.find((p) => p.id === newPost.id);
        if (exists) {
          return prev.map((p) => (p.id === newPost.id ? { ...p, ...newPost } : p));
        }
        return [newPost, ...prev];
      });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [currentUser]);

  // Add a new post
  const addPost = useCallback(async (
    content: string,
    images: string[],
    authorId: string,
    groupId: string
  ): Promise<Post | null> => {
    const newPost = await db.createPost({
      content,
      images,
      authorId,
      groupId,
    });

    if (newPost) {
      setPosts((prev) => [newPost, ...prev]);
    }

    return newPost;
  }, []);

  // Delete a post
  const deletePost = useCallback(async (postId: string): Promise<boolean> => {
    const success = await db.deletePost(postId);
    if (success) {
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    }
    return success;
  }, []);

  // Toggle like
  const toggleLike = useCallback(async (postId: string): Promise<{ liked: boolean; likes: number } | null> => {
    if (!currentUser) return null;
    
    const result = await db.toggleLike(postId, currentUser.id);
    if (result) {
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                likes: result.likes,
                likedBy: result.liked
                  ? [...p.likedBy, currentUser.id]
                  : p.likedBy.filter((id) => id !== currentUser.id),
              }
            : p
        )
      );
    }
    return result;
  }, [currentUser]);

  // Refresh posts
  const refreshPosts = useCallback(async () => {
    await fetchPosts();
  }, [fetchPosts]);

  return {
    posts,
    isLoading,
    addPost,
    deletePost,
    toggleLike,
    refreshPosts,
  };
}
