import { useState, useEffect, useCallback } from 'react';
import type { Group, GroupMember, GroupInvitation, User } from '@/types';
import {
  getGroups,
  getGroupById,
  getGroupByInviteCode,
  createGroup,
  updateGroup,
  deleteGroup,
  getSubGroups,
  getGroupHierarchy,
  getAllDescendantGroups,
  getGroupMembers,
  getUserGroups,
  isGroupMember,
  isGroupAdmin,
  removeGroupMember,
  updateMemberRole,
  createInvitation,
  acceptInvitation,
  canViewGroup,
  canPostInGroup,
  getVisibleGroups,
  getAdminGroups,
  generateInviteCode,
} from '@/lib/groups';
import { getUserById } from '@/lib/db';

export function useGroups(currentUser: User | null) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [userGroups, setUserGroups] = useState<Group[]>([]);
  const [visibleGroups, setVisibleGroups] = useState<Group[]>([]);
  const [adminGroups, setAdminGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Refresh all group data
  const refreshGroups = useCallback(() => {
    if (!currentUser) {
      setGroups([]);
      setUserGroups([]);
      setVisibleGroups([]);
      setAdminGroups([]);
      setIsLoading(false);
      return;
    }

    const allGroups = getGroups();
    const myGroups = getUserGroups(currentUser.id);
    const visible = getVisibleGroups(currentUser.id);
    const admin = getAdminGroups(currentUser.id);

    setGroups(allGroups);
    setUserGroups(myGroups);
    setVisibleGroups(visible);
    setAdminGroups(admin);
    setIsLoading(false);
  }, [currentUser]);

  useEffect(() => {
    refreshGroups();
  }, [refreshGroups]);

  // Create a new group
  const createNewGroup = useCallback((
    name: string,
    description: string,
    parentId: string | null = null,
    isPublic: boolean = false
  ): Group | null => {
    if (!currentUser) return null;
    
    // If creating a sub-group, check if user is admin of parent
    if (parentId && !isGroupAdmin(parentId, currentUser.id)) {
      console.error('Only admins can create sub-groups');
      return null;
    }

    const newGroup = createGroup(name, description, currentUser.id, parentId, isPublic);
    refreshGroups();
    return newGroup;
  }, [currentUser, refreshGroups]);

  // Update group
  const updateGroupInfo = useCallback((groupId: string, updates: Partial<Group>): boolean => {
    if (!currentUser) return false;
    if (!isGroupAdmin(groupId, currentUser.id)) {
      console.error('Only admins can update group');
      return false;
    }

    const result = updateGroup(groupId, updates);
    if (result) {
      refreshGroups();
    }
    return !!result;
  }, [currentUser, refreshGroups]);

  // Delete group
  const deleteGroupById = useCallback((groupId: string): boolean => {
    if (!currentUser) return false;
    if (!isGroupAdmin(groupId, currentUser.id)) {
      console.error('Only admins can delete group');
      return false;
    }

    const result = deleteGroup(groupId);
    if (result) {
      refreshGroups();
    }
    return result;
  }, [currentUser, refreshGroups]);

  // Get group members with enriched user data
  const getMembers = useCallback((groupId: string): GroupMember[] => {
    const members = getGroupMembers(groupId);
    return members.map(m => ({
      ...m,
      user: getUserById(m.userId) || { id: m.userId, name: 'Unknown', email: '', createdAt: '' },
    }));
  }, []);

  // Invite user to group
  const inviteUser = useCallback((groupId: string, invitedUserId?: string, invitedEmail?: string): GroupInvitation | null => {
    if (!currentUser) return null;
    if (!isGroupAdmin(groupId, currentUser.id)) {
      console.error('Only admins can invite users');
      return null;
    }

    const invitation = createInvitation(groupId, currentUser.id, invitedUserId, invitedEmail);
    return invitation;
  }, [currentUser]);

  // Join group via invite code
  const joinGroup = useCallback((inviteCode: string): Group | null => {
    if (!currentUser) return null;

    const group = acceptInvitation(inviteCode, currentUser.id);
    if (group) {
      refreshGroups();
    }
    return group;
  }, [currentUser, refreshGroups]);

  // Leave group
  const leaveGroup = useCallback((groupId: string): boolean => {
    if (!currentUser) return false;

    const result = removeGroupMember(groupId, currentUser.id);
    if (result) {
      refreshGroups();
    }
    return result;
  }, [currentUser, refreshGroups]);

  // Promote member to admin
  const promoteMember = useCallback((groupId: string, userId: string): boolean => {
    if (!currentUser) return false;
    if (!isGroupAdmin(groupId, currentUser.id)) {
      console.error('Only admins can promote members');
      return false;
    }

    const result = updateMemberRole(groupId, userId, 'admin');
    if (result) {
      refreshGroups();
    }
    return !!result;
  }, [currentUser, refreshGroups]);

  // Demote admin to member
  const demoteMember = useCallback((groupId: string, userId: string): boolean => {
    if (!currentUser) return false;
    if (!isGroupAdmin(groupId, currentUser.id)) {
      console.error('Only admins can demote members');
      return false;
    }

    // Prevent demoting yourself
    if (userId === currentUser.id) {
      console.error('Cannot demote yourself');
      return false;
    }

    const result = updateMemberRole(groupId, userId, 'member');
    if (result) {
      refreshGroups();
    }
    return !!result;
  }, [currentUser, refreshGroups]);

  // Remove member from group
  const removeMember = useCallback((groupId: string, userId: string): boolean => {
    if (!currentUser) return false;
    if (!isGroupAdmin(groupId, currentUser.id)) {
      console.error('Only admins can remove members');
      return false;
    }

    // Prevent removing yourself
    if (userId === currentUser.id) {
      console.error('Cannot remove yourself. Use leave group instead.');
      return false;
    }

    const result = removeGroupMember(groupId, userId);
    if (result) {
      refreshGroups();
    }
    return result;
  }, [currentUser, refreshGroups]);

  // Check permissions
  const canView = useCallback((groupId: string): boolean => {
    if (!currentUser) return false;
    return canViewGroup(groupId, currentUser.id);
  }, [currentUser]);

  const canPost = useCallback((groupId: string): boolean => {
    if (!currentUser) return false;
    return canPostInGroup(groupId, currentUser.id);
  }, [currentUser]);

  const checkIsAdmin = useCallback((groupId: string): boolean => {
    if (!currentUser) return false;
    return isGroupAdmin(groupId, currentUser.id);
  }, [currentUser]);

  const checkIsMember = useCallback((groupId: string): boolean => {
    if (!currentUser) return false;
    return isGroupMember(groupId, currentUser.id);
  }, [currentUser]);

  // Get hierarchy helpers
  const getHierarchy = useCallback((groupId: string): Group[] => {
    return getGroupHierarchy(groupId);
  }, []);

  const getSubGroupsList = useCallback((groupId: string): Group[] => {
    return getSubGroups(groupId);
  }, []);

  const getAllDescendants = useCallback((groupId: string): Group[] => {
    return getAllDescendantGroups(groupId);
  }, []);

  // Generate new invite code
  const regenerateInviteCode = useCallback((groupId: string): string | null => {
    if (!currentUser) return null;
    if (!isGroupAdmin(groupId, currentUser.id)) {
      console.error('Only admins can regenerate invite code');
      return null;
    }

    const newCode = generateInviteCode();
    const result = updateGroup(groupId, { inviteCode: newCode });
    if (result) {
      refreshGroups();
      return newCode;
    }
    return null;
  }, [currentUser, refreshGroups]);

  return {
    groups,
    userGroups,
    visibleGroups,
    adminGroups,
    isLoading,
    refreshGroups,
    createGroup: createNewGroup,
    updateGroup: updateGroupInfo,
    deleteGroup: deleteGroupById,
    getMembers,
    inviteUser,
    joinGroup,
    leaveGroup,
    promoteMember,
    demoteMember,
    removeMember,
    canView,
    canPost,
    isAdmin: checkIsAdmin,
    isMember: checkIsMember,
    getHierarchy,
    getSubGroups: getSubGroupsList,
    getAllDescendants,
    regenerateInviteCode,
    getGroupById,
    getGroupByInviteCode,
  };
}
