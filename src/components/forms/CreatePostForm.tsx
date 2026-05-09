import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createPostSchema, CreatePostInput } from '@/lib/validation/schemas';
import { validatePost } from '@/lib/validation/validators';
import { supabase } from '@/lib/supabase';

/**
 * CreatePostForm Component
 * Demonstrates form validation with React Hook Form + Zod
 */
export function CreatePostForm({ groupId, onPostCreated }: { groupId: string; onPostCreated?: () => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
    watch,
  } = useForm<CreatePostInput>({
    resolver: zodResolver(createPostSchema),
    mode: 'onChange',
    defaultValues: {
      groupId,
      content: '',
      images: [],
    },
  });

  const content = watch('content');
  const contentLength = content?.length || 0;
  const maxLength = 5000;
  const charRemaining = maxLength - contentLength;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (!files) return;

    // Validate file size
    Array.from(files).forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        setSubmitError(`File ${file.name} is too large (max 5MB)`);
        return;
      }
    });

    // TODO: Upload files and get URLs
    // This is where you'd call uploadImage from supabase.ts
  };

  const onSubmit = async (data: CreatePostInput) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Custom validation with extra checks
      const validation = validatePost(data);
      if (!validation.success) {
        setSubmitError(Object.values(validation.errors || {}).join(', '));
        setIsSubmitting(false);
        return;
      }

      // Insert post into database
      const { error } = await supabase
        .from('posts')
        .insert({
          group_id: data.groupId,
          content: data.content,
          images: data.images || [],
        });

      if (error) throw error;

      // Success
      reset();
      setUploadedImages([]);
      onPostCreated?.();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to create post');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-4 bg-white rounded-lg shadow">
      {/* Content Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          What's on your mind?
        </label>
        <textarea
          {...register('content')}
          maxLength={maxLength}
          placeholder="Share your thoughts with the group..."
          className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 ${
            errors.content ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
          }`}
          rows={4}
        />
        <div className="flex justify-between mt-1 text-sm">
          <span className={charRemaining < 100 ? 'text-red-500' : 'text-gray-500'}>
            {charRemaining} characters remaining
          </span>
          {errors.content && (
            <span className="text-red-500 text-sm">{errors.content.message}</span>
          )}
        </div>
      </div>

      {/* Image Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Add Images (Optional)
        </label>
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleImageUpload}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
        <p className="text-xs text-gray-500 mt-1">Max 10 images, 5MB each</p>
        {uploadedImages.length > 0 && (
          <div className="mt-2 grid grid-cols-3 gap-2">
            {uploadedImages.map((url, i) => (
              <img
                key={i}
                src={url}
                alt={`Uploaded ${i}`}
                className="w-full h-20 object-cover rounded"
              />
            ))}
          </div>
        )}
      </div>

      {/* Error Message */}
      {submitError && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {submitError}
        </div>
      )}

      {/* Submit Button */}
      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={() => reset()}
          className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!isValid || isSubmitting}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition"
        >
          {isSubmitting ? 'Posting...' : 'Post'}
        </button>
      </div>
    </form>
  );
}
