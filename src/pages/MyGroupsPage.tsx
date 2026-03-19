import { useState } from 'react';
import { ArrowLeft, Users, Shield, Link2, Check, X, UserPlus, LogOut } from 'lucide-react';
import type { User, Group, GroupMember, GroupInvitation } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';

interface MyGroupsPageProps {
  user: User;
  groups: Group[];
  adminGroups: Group[];
  invitations: GroupInvitation[];
  groupMembers: Map<string, GroupMember[]>;
  onBack: () => void;
  onJoinGroup: (inviteCode: string) => Group | null;
  onLeaveGroup: (groupId: string) => void;
  onAcceptInvitation: (inviteCode: string) => Group | null;
  onDeclineInvitation: (inviteCode: string) => void;
  onNavigateToGroup: (group: Group) => void;
}

export function MyGroupsPage({
  user,
  groups,
  adminGroups,
  invitations,
  groupMembers,
  onBack,
  onJoinGroup,
  onLeaveGroup,
  onAcceptInvitation,
  onDeclineInvitation,
  onNavigateToGroup,
}: MyGroupsPageProps) {
  const [inviteCode, setInviteCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [groupToLeave, setGroupToLeave] = useState<Group | null>(null);

  const pendingInvitations = invitations.filter(
    (inv) => inv.status === 'pending' && inv.invitedUserId === user.id
  );

  const handleJoinWithCode = () => {
    if (!inviteCode.trim()) return;
    setJoinError('');
    const group = onJoinGroup(inviteCode.trim());
    if (group) {
      toast.success(`Joined ${group.name}!`);
      setInviteCode('');
    } else {
      setJoinError('Invalid or expired invite code');
    }
  };

  const handleLeaveGroup = () => {
    if (groupToLeave) {
      onLeaveGroup(groupToLeave.id);
      toast.success(`Left ${groupToLeave.name}`);
      setShowLeaveDialog(false);
      setGroupToLeave(null);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  return (
    <div className="min-h-screen bg-[#F2F4F7] pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-[#DADDE1]">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 -ml-2 hover:bg-[#F0F2F5] rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-[#050505]" />
          </button>
          <h1 className="text-[17px] font-semibold text-[#050505]">My Groups</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* Join with Invite Code */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="text-[15px] font-semibold text-[#050505] mb-3">
            Join with Invite Code
          </h2>
          <div className="flex gap-2">
            <Input
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              placeholder="Enter invite code (e.g., ABC123)"
              className="flex-1"
              maxLength={10}
            />
            <Button
              onClick={handleJoinWithCode}
              disabled={!inviteCode.trim()}
              className="bg-[#1877F2] hover:bg-[#166fe5]"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Join
            </Button>
          </div>
          {joinError && (
            <p className="text-red-500 text-[13px] mt-2">{joinError}</p>
          )}
          <p className="text-[13px] text-[#65676B] mt-2">
            Or paste an invite link like:{' '}
            <span className="text-[#1877F2]">teamconnect8.vercel.app/join/ABC123</span>
          </p>
        </div>

        {/* Pending Invitations */}
        {pendingInvitations.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h2 className="text-[15px] font-semibold text-[#050505] mb-3">
              Pending Invitations ({pendingInvitations.length})
            </h2>
            <div className="space-y-3">
              {pendingInvitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className="flex items-center justify-between p-3 bg-[#F0F2F5] rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#1877F2] rounded-lg flex items-center justify-center">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-[14px] font-medium text-[#050505]">
                        Invitation to Group
                      </p>
                      <p className="text-[12px] text-[#65676B]">
                        Code: {invitation.inviteCode}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onDeclineInvitation(invitation.inviteCode)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      className="bg-[#1877F2] hover:bg-[#166fe5]"
                      onClick={() => {
                        const group = onAcceptInvitation(invitation.inviteCode);
                        if (group) {
                          toast.success(`Joined ${group.name}!`);
                        }
                      }}
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* My Groups */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="text-[15px] font-semibold text-[#050505] mb-3">
            My Groups ({groups.length})
          </h2>
          {groups.length === 0 ? (
            <div className="text-center py-6">
              <Users className="w-12 h-12 text-[#DADDE1] mx-auto mb-3" />
              <p className="text-[14px] text-[#65676B]">
                You haven't joined any groups yet.
              </p>
              <p className="text-[13px] text-[#65676B] mt-1">
                Use an invite code above to join a group.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {groups.map((group) => {
                const isAdmin = adminGroups.some((g) => g.id === group.id);
                const members = groupMembers.get(group.id) || [];
                return (
                  <div
                    key={group.id}
                    className="flex items-center justify-between p-3 bg-[#F0F2F5] rounded-lg cursor-pointer hover:bg-[#E4E6EB] transition-colors"
                    onClick={() => onNavigateToGroup(group)}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="w-12 h-12 rounded-xl">
                        <AvatarImage src={group.avatar} alt={group.name} />
                        <AvatarFallback className="bg-[#1877F2] text-white text-lg rounded-xl">
                          {getInitials(group.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-[15px] font-medium text-[#050505]">
                          {group.name}
                        </p>
                        <div className="flex items-center gap-2 text-[12px] text-[#65676B]">
                          <Users className="w-3 h-3" />
                          <span>{members.length} members</span>
                          {isAdmin && (
                            <>
                              <span>•</span>
                              <Shield className="w-3 h-3 text-[#1877F2]" />
                              <span className="text-[#1877F2]">Admin</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isAdmin && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const inviteUrl = `${window.location.origin}/join/${group.inviteCode}`;
                            navigator.clipboard.writeText(inviteUrl);
                            toast.success('Invite link copied!');
                          }}
                          className="p-2 hover:bg-white rounded-full transition-colors"
                          title="Copy invite link"
                        >
                          <Link2 className="w-4 h-4 text-[#65676B]" />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setGroupToLeave(group);
                          setShowLeaveDialog(true);
                        }}
                        className="p-2 hover:bg-white rounded-full transition-colors"
                        title="Leave group"
                      >
                        <LogOut className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Leave Group Dialog */}
      <Dialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Leave Group</DialogTitle>
          </DialogHeader>
          <div className="pt-4">
            <p className="text-[14px] text-[#65676B]">
              Are you sure you want to leave{' '}
              <span className="font-medium text-[#050505]">
                {groupToLeave?.name}
              </span>
              ?
            </p>
            <p className="text-[13px] text-red-500 mt-2">
              You will need a new invite to rejoin.
            </p>
            <div className="flex gap-2 mt-6">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowLeaveDialog(false);
                  setGroupToLeave(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleLeaveGroup}
              >
                Leave Group
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
