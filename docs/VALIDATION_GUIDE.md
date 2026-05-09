# TeamConnect - Input Validation Guide with Zod

**Objective**: Comprehensive validation layer for all user inputs  
**Framework**: Zod + React Hook Form  
**Risk Level**: Low (schema-based validation)

---

## Table of Contents

1. [Overview](#overview)
2. [Schema Definitions](#schema-definitions)
3. [Form Integration](#form-integration)
4. [Custom Validators](#custom-validators)
5. [Error Handling](#error-handling)
6. [Best Practices](#best-practices)
7. [Common Issues](#common-issues)

---

## Overview

### What is Zod?

**Zod** is a TypeScript-first schema validation library:

```typescript
import { z } from 'zod';

// Define a schema
const userSchema = z.object({
  email: z.string().email(),
  age: z.number().min(18),
});

// Validate data
const result = userSchema.parse(userData);
// Throws error if invalid, returns typed data if valid
```

**Benefits**:
- ✅ Type-safe (auto-generates TypeScript types)
- ✅ Runtime validation (works in browser & server)
- ✅ Great error messages
- ✅ Composable & reusable schemas
- ✅ Works with React Hook Form (via resolver)

---

## Schema Definitions

### 1. User Schema

```typescript
const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email('Invalid email address'),
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters'),
  avatar: z.string().url('Invalid avatar URL').optional(),
  role: z.enum(['user', 'admin', 'moderator']).default('user'),
  createdAt: z.string().datetime(),
});

type User = z.infer<typeof userSchema>; // Auto-generated type
```

### 2. Group Schema

```typescript
// Create Group (minimal required fields)
const createGroupSchema = z.object({
  name: z.string()
    .min(3, 'Group name must be at least 3 characters')
    .max(100, 'Group name must be less than 100 characters')
    .trim(), // Auto-trim whitespace
  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .optional()
    .or(z.literal('')), // Allow empty string
  avatar: z.string().url().optional().or(z.literal('')),
  parentId: z.string().uuid().optional().nullable(),
  isPublic: z.boolean().default(false),
});

type CreateGroupInput = z.infer<typeof createGroupSchema>;

// Update Group (all fields optional)
const updateGroupSchema = createGroupSchema.partial();
```

### 3. Post Schema

```typescript
const createPostSchema = z.object({
  groupId: z.string().uuid('Invalid group ID'),
  content: z.string()
    .min(1, 'Post content cannot be empty')
    .max(5000, 'Post content must be less than 5000 characters')
    .trim(),
  images: z.string()
    .url('Invalid image URL')
    .array()
    .max(10, 'Maximum 10 images allowed')
    .optional(),
});

type CreatePostInput = z.infer<typeof createPostSchema>;
```

### 4. Comment Schema

```typescript
const createCommentSchema = z.object({
  postId: z.string().uuid('Invalid post ID'),
  content: z.string()
    .min(1, 'Comment cannot be empty')
    .max(1000, 'Comment must be less than 1000 characters')
    .trim(),
  parentId: z.string().uuid().optional(), // For nested comments
});
```

### 5. Image Upload Schema

```typescript
const uploadImageSchema = z.object({
  file: z.instanceof(File)
    .refine(
      (file) => file.size <= 5 * 1024 * 1024,
      'File size must be less than 5MB'
    )
    .refine(
      (file) => ['image/jpeg', 'image/png', 'image/webp'].includes(file.type),
      'Only JPEG, PNG, and WebP images are allowed'
    ),
});
```

---

## Form Integration

### Using React Hook Form + Zod Resolver

#### Installation

```bash
npm install react-hook-form zod @hookform/resolvers
```

#### Example: Post Form

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createPostSchema, CreatePostInput } from '@/lib/validation/schemas';

export function PostForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
  } = useForm<CreatePostInput>({
    resolver: zodResolver(createPostSchema),
    mode: 'onChange', // Validate on every change
    defaultValues: {
      groupId: 'some-id',
      content: '',
      images: [],
    },
  });

  const content = watch('content');
  const contentLength = content?.length || 0;

  const onSubmit = async (data: CreatePostInput) => {
    // Data is already validated by Zod!
    console.log(data); // Type-safe
    // Submit to API
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <textarea
        {...register('content')}
        maxLength={5000}
        placeholder="What's on your mind?"
      />
      
      {/* Show validation errors */}
      {errors.content && (
        <span className="error">{errors.content.message}</span>
      )}
      
      {/* Show character count */}
      <span>{5000 - contentLength} characters remaining</span>
      
      {/* Disable button if form invalid */}
      <button type="submit" disabled={!isValid}>
        Post
      </button>
    </form>
  );
}
```

---

## Custom Validators

### 1. Validate Post Content for Spam

```typescript
export const validatePostContent = (content: string) => {
  // Check for excessive whitespace
  if (content.trim().length === 0) {
    return { valid: false, message: 'Post cannot be empty' };
  }

  // Check for all caps (spam indicator)
  const capsRatio = (content.match(/[A-Z]/g) || []).length / content.length;
  if (capsRatio > 0.8 && content.length > 10) {
    return { valid: false, message: 'Too much uppercase text' };
  }

  // Check for excessive links
  const linkCount = (content.match(/https?:\/\//g) || []).length;
  if (linkCount > 3) {
    return { valid: false, message: 'Too many links' };
  }

  return { valid: true };
};
```

### 2. Async Validation (Database Check)

```typescript
export const validateGroupName = async (
  name: string,
  excludeId?: string
) => {
  // Check database for duplicate
  const { data } = await supabase
    .from('groups')
    .select('id')
    .eq('name', name)
    .single();

  if (data && data.id !== excludeId) {
    return { valid: false, message: 'Group name already exists' };
  }

  return { valid: true };
};
```

### 3. Use Custom Validators in Form

```typescript
const onSubmit = async (data: CreateGroupInput) => {
  // Run custom async validation
  const nameCheck = await validateGroupName(data.name);
  if (!nameCheck.valid) {
    setError('name', { message: nameCheck.message });
    return;
  }

  // If we get here, all validations passed
  // Submit to API
};
```

---

## Error Handling

### Display Errors

```typescript
<form onSubmit={handleSubmit(onSubmit)}>
  <input {...register('email')} />
  
  {/* Single field error */}
  {errors.email && (
    <span className="text-red-500">{errors.email.message}</span>
  )}
  
  {/* Multiple field errors */}
  {Object.entries(errors).map(([field, error]) => (
    <div key={field} className="text-red-500">
      {field}: {error?.message}
    </div>
  ))}
</form>
```

### Format Errors for Display

```typescript
export const formatValidationErrors = (errors: Record<string, string>) => {
  return Object.entries(errors)
    .map(([field, message]) => `${field}: ${message}`)
    .join(', ');
};

// Usage
const errorMessage = formatValidationErrors(errors);
alert(errorMessage);
```

---

## Best Practices

### ✅ DO

- ✅ Use `z.infer<typeof schema>` for type safety
- ✅ Trim whitespace with `.trim()`
- ✅ Provide clear error messages
- ✅ Use `mode: 'onChange'` for better UX (real-time validation)
- ✅ Disable submit button while invalid (`disabled={!isValid}`)
- ✅ Show character counts for text fields
- ✅ Validate on both client & server
- ✅ Use `.refine()` for complex validation logic

### ❌ DON'T

- ❌ Skip server-side validation (always validate on server too!)
- ❌ Trust client-side validation alone
- ❌ Use unclear error messages
- ❌ Validate only on submit (`mode: 'onSubmit'`)
- ❌ Allow very large inputs without limits
- ❌ Mix validation logic with UI logic
- ❌ Create duplicate schemas (DRY principle)

---

## Common Issues

### Issue 1: "zodResolver is not a function"

**Cause**: Missing `@hookform/resolvers` package

```bash
npm install @hookform/resolvers
```

### Issue 2: Type errors with `z.infer`

**Cause**: Schema not exported or imported incorrectly

```typescript
// ✅ Correct
import { createPostSchema } from '@/lib/validation/schemas';
type CreatePostInput = z.infer<typeof createPostSchema>;

// ❌ Wrong
type CreatePostInput = z.infer<createPostSchema>; // schema not typeof
```

### Issue 3: Async validation not working

**Cause**: Not using `async` in validator function

```typescript
// ✅ Correct
const validateName = async (name: string) => {
  const result = await checkDatabase(name);
  return result;
};

// ❌ Wrong
const validateName = (name: string) => {
  return checkDatabase(name); // Missing async
};
```

### Issue 4: Validation errors not showing

**Cause**: Form mode not set to `onChange`

```typescript
// ✅ Correct
const { formState: { errors } } = useForm({
  mode: 'onChange', // Real-time validation
});

// ❌ Wrong
const { formState: { errors } } = useForm({
  mode: 'onSubmit', // Only validates on submit
});
```

---

## Testing Validation

### Unit Test Example

```typescript
import { describe, it, expect } from 'vitest';
import { createPostSchema, validatePost } from '@/lib/validation';

describe('Post Validation', () => {
  it('should reject empty content', () => {
    const result = createPostSchema.safeParse({
      groupId: '123e4567-e89b-12d3-a456-426614174000',
      content: '',
    });
    expect(result.success).toBe(false);
  });

  it('should reject content > 5000 chars', () => {
    const result = createPostSchema.safeParse({
      groupId: '123e4567-e89b-12d3-a456-426614174000',
      content: 'a'.repeat(5001),
    });
    expect(result.success).toBe(false);
  });

  it('should detect spam patterns', () => {
    const result = validatePost({
      groupId: '123e4567-e89b-12d3-a456-426614174000',
      content: 'CHECK THIS OUT!!! https://spam.com https://spam2.com https://spam3.com https://spam4.com',
    });
    expect(result.success).toBe(false);
  });
});
```

---

## Files Provided

1. **src/lib/validation/schemas.ts** (2.5 KB)
   - All Zod schemas (User, Group, Post, Comment, etc.)
   - Type inference

2. **src/lib/validation/validators.ts** (3.5 KB)
   - Custom validation functions
   - Spam detection
   - Input sanitization
   - Error formatting

3. **src/components/forms/CreatePostForm.tsx** (2.5 KB)
   - Complete post form with React Hook Form
   - Real-time validation
   - Image upload handling
   - Error display

4. **src/components/forms/CreateGroupForm.tsx** (3.5 KB)
   - Complete group form with async validation
   - React Hook Form integration
   - Character count display
   - Public/private toggle

---

## Next Steps

1. **Install dependencies**:
   ```bash
   npm install zod react-hook-form @hookform/resolvers
   ```

2. **Import schemas in your components**:
   ```typescript
   import { createPostSchema } from '@/lib/validation/schemas';
   ```

3. **Use form components**:
   ```typescript
   <CreatePostForm groupId="group-id" />
   ```

4. **Extend schemas**:
   - Add new schemas as you create more forms
   - Keep DRY - reuse schemas across components

5. **Always validate on server**:
   ```typescript
   // In your API route
   const parsed = createPostSchema.safeParse(req.body);
   if (!parsed.success) {
     return res.status(400).json({ errors: parsed.error.flatten() });
   }
   ```

---

**Version**: 1.0  
**Last Updated**: 2026-05-09  
**Author**: Development Team
