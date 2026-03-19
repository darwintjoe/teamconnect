import { useState } from 'react';
import { Users, Copy, Check, Shield, UserX, ChevronUp, ChevronDown } from 'lucide-react';
import type { Group, GroupMember, User } from '@/types';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface GroupManagementProps {
  group: Group;
  members: GroupMember[];
  currentUser: User;
  isAdmin: boolean;
  onPromote: (userId: string) => void;
  onDemote: (userId: string) => void;
  onRemove: (userId: string) => void;
  onRegenerateInviteCode: () => string | null;
}

export function GroupManagement({
  group,
  members,
  currentUser,
  isAdmin,
  onPromote,
  onDemote,
  onRemove,
  onRegenerateInviteCode,
}: GroupManagementProps) {
  const [copied, setCopied] = useState(false);
  const [showMembers, setShowMembers] = useState(false);

  const inviteUrl = `${window.location.origin}/join/${group.inviteCode}`;

  const copyInviteLink = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerate = () => {
    const newCode = onRegenerateInviteCode();
    if (newCode) {
      alert(`New invite code generated: ${newCode}`);
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const admins = members.filter(m => m.role === 'admin');
  const regularMembers = members.filter(m => m.role === 'member');

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
      {/* Group Info */}
      <div className="flex items-center gap-3 mb-4">
        <img
          src={group.avatar}
          alt={group.name}
          className="w-12 h-12 rounded-xl object-cover"
        />
        <div className="flex-1">
          <h2 className="font-bold text-[16px] text-[#050505]">{group.name}</h2>
          <p className="text-[13px] text-[#65676B]">{group.description}</p>
        </div>
      </div>

      {/* Invite Link (Admin only) */}
      {isAdmin && (
        <div className="bg-[#F0F2F5] rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[13px] font-medium text-[#050505]">Invite Link</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRegenerate}
              className="text-[12px] text-[#1877F2]"
            >
              Regenerate
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-white px-3 py-2 rounded text-[13px] text-[#65676B] truncate">
              {inviteUrl}
            </code>
            <Button
              variant="ghost"
              size="icon"
              onClick={copyInviteLink}
              className="shrink-0"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>
          <p className="text-[12px] text-[#65676B] mt-2">
            Share this link to invite people to join this group
          </p>
        </div>
      )}

      {/* Members Section */}
      <div className="border-t border-[#DADDE1] pt-3">
        <button
          onClick={() => setShowMembers(!showMembers)}
          className="w-full flex items-center justify-between py-2"
        >
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[#65676B]" />
            <span className="font-medium text-[14px]">
              Members ({members.length})
            </span>
          </div>
          {showMembers ? (
            <ChevronUp className="w-5 h-5 text-[#65676B]" />
          ) : (
            <ChevronDown className="w-5 h-5 text-[#65676B]" />
          )}
        </button>

        {showMembers && (
          <div className="mt-3 space-y-2">
            {/* Admins */}
            {admins.map(member => (
              <div
                key={member.id}
                className="flex items-center justify-between p-2 hover:bg-[#F0F2F5] rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={member.user?.avatar} />
                    <AvatarFallback className="bg-gray-200 text-gray-600 text-xs">
                      {getInitials(member.user?.name || 'U')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-[14px] font-medium">{member.user?.name}</p>
                    <p className="text-[12px] text-[#1877F2] flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      Admin
                    </p>
                  </div>
                </div>
                {isAdmin && member.userId !== currentUser.id && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDemote(member.userId)}
                    className="text-[12px] text-[#65676B]"
                  >
                    Demote
                  </Button>
                )}
              </div>
            ))}

            {/* Regular Members */}
            {regularMembers.map(member => (
              <div
                key={member.id}
                className="flex items-center justify-between p-2 hover:bg-[#F0F2F5] rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={member.user?.avatar} />
                    <AvatarFallback className="bg-gray-200 text-gray-600 text-xs">
                      {getInitials(member.user?.name || 'U')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-[14px] font-medium">{member.user?.name}</p>
                    <p className="text-[12px] text-[#65676B]">Member</p>
                  </div>
                </div>
                {isAdmin && (
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onPromote(member.userId)}
                      className="text-[12px] text-[#1877F2]"
                    >
                      <Shield className="w-3 h-3 mr-1" />
                      Promote
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (confirm(`Remove ${member.user?.name} from the group?`)) {
                          onRemove(member.userId);
                        }
                      }}
                      className="text-[12px] text-red-500"
                    >
                      <UserX className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
