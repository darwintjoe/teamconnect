import { Heart, MessageCircle, AtSign, Check } from 'lucide-react';
import type { User, Notification } from '@/types';
import { formatDistanceToNow } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

interface NotificationsPageProps {
  notifications: Notification[];
  currentUser: User | null;
  onMarkAsRead: (notificationId: string) => void;
  onMarkAllAsRead: () => void;
  onNavigateToPost: (postId: string) => void;
}

export function NotificationsPage({
  notifications,
  currentUser: _currentUser,
  onMarkAsRead,
  onMarkAllAsRead,
  onNavigateToPost,
}: NotificationsPageProps) {
  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'like':
        return <Heart className="w-4 h-4 text-white fill-white" />;
      case 'comment':
        return <MessageCircle className="w-4 h-4 text-white fill-white" />;
      case 'mention':
        return <AtSign className="w-4 h-4 text-white" />;
      default:
        return <Heart className="w-4 h-4 text-white" />;
    }
  };

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'like':
        return 'bg-[#1877F2]';
      case 'comment':
        return 'bg-[#42B72A]';
      case 'mention':
        return 'bg-[#F7B928]';
      default:
        return 'bg-[#1877F2]';
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-[#DADDE1]">
        <div className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto">
          <h1 className="text-[18px] font-bold">Notifications</h1>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onMarkAllAsRead}
              className="text-[#1877F2]"
            >
              <Check className="w-4 h-4 mr-1" />
              Mark all read
            </Button>
          )}
        </div>
      </header>

      {/* Notifications list */}
      <main className="max-w-lg mx-auto">
        {notifications.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 mx-auto mb-4 bg-[#F0F2F5] rounded-full flex items-center justify-center">
              <svg
                className="w-10 h-10 text-[#65676B]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
            </div>
            <h3 className="text-[16px] font-semibold text-[#050505] mb-1">
              No notifications yet
            </h3>
            <p className="text-[14px] text-[#65676B]">
              When someone interacts with your posts, you'll see it here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#DADDE1]">
            {notifications.map((notification) => (
              <button
                key={notification.id}
                onClick={() => {
                  if (!notification.read) {
                    onMarkAsRead(notification.id);
                  }
                  if (notification.postId) {
                    onNavigateToPost(notification.postId);
                  }
                }}
                className={`w-full flex items-center gap-3 p-4 hover:bg-[#F0F2F5] transition-colors text-left ${
                  !notification.read ? 'bg-[#E7F3FF]' : ''
                }`}
              >
                {/* Unread indicator */}
                {!notification.read && (
                  <div className="absolute left-1 w-2 h-2 bg-[#1877F2] rounded-full" />
                )}

                {/* Avatar with icon overlay */}
                <div className="relative flex-shrink-0">
                  <Avatar className="w-12 h-12">
                    <AvatarImage
                      src={notification.actor?.avatar}
                      alt={notification.actor?.name}
                    />
                    <AvatarFallback className="bg-gray-200 text-gray-600">
                      {getInitials(notification.actor?.name || 'U')}
                    </AvatarFallback>
                  </Avatar>
                  <div
                    className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center ${getNotificationColor(
                      notification.type
                    )}`}
                  >
                    {getNotificationIcon(notification.type)}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] text-[#050505]">
                    <span className="font-semibold">
                      {notification.actor?.name}
                    </span>{' '}
                    {notification.message.replace(
                      notification.actor?.name || '',
                      ''
                    )}
                  </p>
                  <p className="text-[13px] text-[#1877F2]">
                    {formatDistanceToNow(new Date(notification.createdAt))}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
