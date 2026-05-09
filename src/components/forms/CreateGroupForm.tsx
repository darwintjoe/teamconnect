import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createGroupSchema, CreateGroupInput } from '@/lib/validation/schemas';
import { validateGroupCreation } from '@/lib/validation/validators';
import { supabase } from '@/lib/supabase';

interface CreateGroupFormProps {
  onGroupCreated?: (groupId: string) => void;
  onCancel?: () => void;
  parentId?: string | null;
}

/**
 * CreateGroupForm Component
 * Demonstrates form validation with React Hook Form + Zod
 * Includes async validation for group name
 */
export function CreateGroupForm({ onGroupCreated, onCancel, parentId }: CreateGroupFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
    watch,
  } = useForm<CreateGroupInput>({
    resolver: zodResolver(createGroupSchema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      description: '',
      parentId: parentId || undefined,
      isPublic: false,
    },
  });

  const description = watch('description');
  const descLength = description?.length || 0;
  const maxDescLength = 500;

  const onSubmit = async (data: CreateGroupInput) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Async validation with database check
      const validation = await validateGroupCreation(data);
      if (!validation.success) {
        setSubmitError(Object.values(validation.errors || {}).join(', '));
        setIsSubmitting(false);
        return;
      }

      // Generate invite code
      const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

      // Insert group into database
      const { data: group, error } = await supabase
        .from('groups')
        .insert({
          name: data.name,
          description: data.description,
          avatar_url: data.avatar,
          parent_id: data.parentId,
          level: data.parentId ? 1 : 0,
          invite_code: inviteCode,
          is_public: data.isPublic,
        })
        .select()
        .single();

      if (error) throw error;

      // Success
      reset();
      onGroupCreated?.(group.id);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to create group');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-6 bg-white rounded-lg shadow">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">
        {parentId ? 'Create Sub-Group' : 'Create New Group'}
      </h2>

      {/* Name Input */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Group Name *
        </label>
        <input
          id="name"
          type="text"
          placeholder="e.g., Marketing Team, Product Feedback"
          {...register('name')}
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
            errors.name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
          }`}
        />
        {errors.name && (
          <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
        )}
      </div>

      {/* Description Input */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Description (Optional)
        </label>
        <textarea
          id="description"
          placeholder="What's this group about?"
          maxLength={maxDescLength}
          {...register('description')}
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
            errors.description ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
          }`}
          rows={3}
        />
        <div className="flex justify-between mt-1 text-sm">
          <span className={maxDescLength - descLength < 50 ? 'text-red-500' : 'text-gray-500'}>
            {maxDescLength - descLength} characters remaining
          </span>
          {errors.description && (
            <span className="text-red-500 text-sm">{errors.description.message}</span>
          )}
        </div>
      </div>

      {/* Avatar Input */}
      <div>
        <label htmlFor="avatar" className="block text-sm font-medium text-gray-700 mb-1">
          Avatar URL (Optional)
        </label>
        <input
          id="avatar"
          type="text"
          placeholder="https://example.com/image.jpg"
          {...register('avatar')}
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
            errors.avatar ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
          }`}
        />
        {errors.avatar && (
          <p className="text-red-500 text-sm mt-1">{errors.avatar.message}</p>
        )}
      </div>

      {/* Public Checkbox */}
      <div className="flex items-center">
        <input
          id="isPublic"
          type="checkbox"
          {...register('isPublic')}
          className="h-4 w-4 text-blue-600 rounded"
        />
        <label htmlFor="isPublic" className="ml-2 text-sm text-gray-700">
          Make this group public (discoverable without invite link)
        </label>
      </div>

      {/* Error Message */}
      {submitError && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {submitError}
        </div>
      )}

      {/* Submit Buttons */}
      <div className="flex gap-2 justify-end pt-4">
        <button
          type="button"
          onClick={() => {
            reset();
            onCancel?.();
          }}
          className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!isValid || isSubmitting}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition"
        >
          {isSubmitting ? 'Creating...' : 'Create Group'}
        </button>
      </div>
    </form>
  );
}
