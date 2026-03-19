import { useState, useRef } from 'react';
import { Camera, X } from 'lucide-react';
import type { User } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface CreatePostProps {
  currentUser: User | null;
  onSubmit: (content: string, images: string[]) => void;
}

export function CreatePost({ currentUser, onSubmit }: CreatePostProps) {
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const handleSubmit = () => {
    if (!content.trim() && images.length === 0) return;
    onSubmit(content, images);
    setContent('');
    setImages([]);
    setIsExpanded(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImages(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  if (!currentUser) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm p-3">
      <div className="flex gap-3">
        <Avatar className="w-10 h-10 flex-shrink-0">
          <AvatarImage src={currentUser.avatar} alt={currentUser.name} />
          <AvatarFallback className="bg-gray-200 text-gray-600">
            {getInitials(currentUser.name)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          {!isExpanded ? (
            <button
              onClick={() => setIsExpanded(true)}
              className="w-full text-left px-4 py-2.5 bg-[#F0F2F5] hover:bg-[#E4E6EB] rounded-full text-[15px] text-[#65676B] transition-colors"
            >
              What's on your mind?
            </button>
          ) : (
            <div className="space-y-3">
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What's on your mind?"
                className="w-full min-h-[100px] resize-none border-0 focus-visible:ring-0 text-[15px] p-0 placeholder:text-[#65676B]"
                autoFocus
              />
              
              {/* Image previews */}
              {images.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {images.map((image, index) => (
                    <div key={index} className="relative">
                      <img
                        src={image}
                        alt={`Upload ${index + 1}`}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                      <button
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-gray-800 rounded-full flex items-center justify-center text-white hover:bg-gray-700"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-[#DADDE1]">
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    multiple
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 text-[#65676B] hover:bg-[#F0F2F5]"
                  >
                    <Camera className="w-5 h-5 text-[#45BD62]" />
                    <span className="text-[14px]">Photo</span>
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsExpanded(false);
                      setContent('');
                      setImages([]);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleSubmit}
                    disabled={!content.trim() && images.length === 0}
                    className="bg-[#1877F2] hover:bg-[#166fe5] text-white px-6"
                  >
                    Post
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {!isExpanded && (
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#DADDE1]">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            multiple
            className="hidden"
          />
          <Button
            type="button"
            variant="ghost"
            className="flex-1 flex items-center justify-center gap-2 py-2 text-[#65676B] hover:bg-[#F0F2F5]"
            onClick={() => fileInputRef.current?.click()}
          >
            <Camera className="w-5 h-5 text-[#45BD62]" />
            <span className="text-[14px] font-medium">Photo</span>
          </Button>
        </div>
      )}
    </div>
  );
}
