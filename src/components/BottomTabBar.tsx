import { Home, Bell, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

type TabType = 'home' | 'notifications' | 'profile';

interface BottomTabBarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  unreadCount?: number;
}

export function BottomTabBar({ activeTab, onTabChange, unreadCount = 0 }: BottomTabBarProps) {
  const tabs = [
    { id: 'home' as TabType, icon: Home, label: 'Home' },
    { id: 'notifications' as TabType, icon: Bell, label: 'Notifications' },
    { id: 'profile' as TabType, icon: User, label: 'Profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#DADDE1] safe-bottom z-40">
      <div className="flex items-center justify-around h-14 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          
          return (
            <Button
              key={tab.id}
              variant="ghost"
              className={`relative flex-1 flex flex-col items-center justify-center h-full gap-0.5 rounded-none ${
                isActive ? 'text-[#1877F2]' : 'text-[#65676B]'
              }`}
              onClick={() => onTabChange(tab.id)}
            >
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-[#1877F2] rounded-full" />
              )}
              <div className="relative">
                <Icon className={`w-6 h-6 ${isActive ? 'fill-current' : ''}`} />
                {tab.id === 'notifications' && unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#FA383E] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>
              <span className={`text-[11px] ${isActive ? 'font-semibold' : ''}`}>
                {tab.label}
              </span>
            </Button>
          );
        })}
      </div>
    </nav>
  );
}
