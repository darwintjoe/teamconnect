import type { Group, GroupMember, GroupRole, GroupInvitation, User } from '@/types';
import { generateId } from './db';

// LocalStorage keys
const KEYS = {
  GROUPS: 'teamconnect_groups',
  GROUP_MEMBERS: 'teamconnect_group_members',
  GROUP_INVITATIONS: 'teamconnect_group_invitations',
};

// Generate invite code (6 characters)
export function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Initialize with demo groups
const initDemoGroups = () => {
  const groups: Group[] = [
    {
      id: 'group-1',
      name: 'Acme Corporation',
      description: 'Main company group - all employees',
      avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=ACME&backgroundColor=1877F2',
      parentId: null,
      level: 0,
      createdBy: 'user-1',
      createdAt: new Date(Date.now() - 86400000 * 60).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 60).toISOString(),
      inviteCode: 'ACME01',
      isPublic: false,
    },
    {
      id: 'group-2',
      name: 'Engineering Department',
      description: 'Engineering team discussions',
      avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=ENG&backgroundColor=42B72A',
      parentId: 'group-1',
      level: 1,
      createdBy: 'user-1',
      createdAt: new Date(Date.now() - 86400000 * 50).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 50).toISOString(),
      inviteCode: 'ENG001',
      isPublic: false,
    },
    {
      id: 'group-3',
      name: 'Frontend Team',
      description: 'Frontend developers - React, Vue, Angular',
      avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=FE&backgroundColor=F7B928',
      parentId: 'group-2',
      level: 2,
      createdBy: 'user-2',
      createdAt: new Date(Date.now() - 86400000 * 40).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 40).toISOString(),
      inviteCode: 'FE001',
      isPublic: false,
    },
    {
      id: 'group-4',
      name: 'Backend Team',
      description: 'Backend developers - Node, Python, Go',
      avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=BE&backgroundColor=FA383E',
      parentId: 'group-2',
      level: 2,
      createdBy: 'user-2',
      createdAt: new Date(Date.now() - 86400000 * 35).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 35).toISOString(),
      inviteCode: 'BE001',
      isPublic: false,
    },
    {
      id: 'group-5',
      name: 'Marketing Department',
      description: 'Marketing and communications',
      avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=MKT&backgroundColor=1877F2',
      parentId: 'group-1',
      level: 1,
      createdBy: 'user-1',
      createdAt: new Date(Date.now() - 86400000 * 45).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 45).toISOString(),
      inviteCode: 'MKT01',
      isPublic: false,
    },
  ];

  const members: GroupMember[] = [
    // Acme Corporation members
    { id: 'gm-1', groupId: 'group-1', userId: 'user-1', user: {} as User, role: 'admin', joinedAt: new Date(Date.now() - 86400000 * 60).toISOString() },
    { id: 'gm-2', groupId: 'group-1', userId: 'user-2', user: {} as User, role: 'member', joinedAt: new Date(Date.now() - 86400000 * 55).toISOString() },
    { id: 'gm-3', groupId: 'group-1', userId: 'user-3', user: {} as User, role: 'member', joinedAt: new Date(Date.now() - 86400000 * 50).toISOString() },
    { id: 'gm-4', groupId: 'group-1', userId: 'user-4', user: {} as User, role: 'member', joinedAt: new Date(Date.now() - 86400000 * 45).toISOString() },
    
    // Engineering members
    { id: 'gm-5', groupId: 'group-2', userId: 'user-1', user: {} as User, role: 'admin', joinedAt: new Date(Date.now() - 86400000 * 50).toISOString() },
    { id: 'gm-6', groupId: 'group-2', userId: 'user-2', user: {} as User, role: 'admin', joinedAt: new Date(Date.now() - 86400000 * 48).toISOString() },
    { id: 'gm-7', groupId: 'group-2', userId: 'user-3', user: {} as User, role: 'member', joinedAt: new Date(Date.now() - 86400000 * 45).toISOString() },
    
    // Frontend team
    { id: 'gm-8', groupId: 'group-3', userId: 'user-2', user: {} as User, role: 'admin', joinedAt: new Date(Date.now() - 86400000 * 40).toISOString() },
    { id: 'gm-9', groupId: 'group-3', userId: 'user-3', user: {} as User, role: 'member', joinedAt: new Date(Date.now() - 86400000 * 38).toISOString() },
    
    // Backend team
    { id: 'gm-10', groupId: 'group-4', userId: 'user-2', user: {} as User, role: 'admin', joinedAt: new Date(Date.now() - 86400000 * 35).toISOString() },
    
    // Marketing
    { id: 'gm-11', groupId: 'group-5', userId: 'user-1', user: {} as User, role: 'admin', joinedAt: new Date(Date.now() - 86400000 * 45).toISOString() },
    { id: 'gm-12', groupId: 'group-5', userId: 'user-4', user: {} as User, role: 'admin', joinedAt: new Date(Date.now() - 86400000 * 42).toISOString() },
  ];

  localStorage.setItem(KEYS.GROUPS, JSON.stringify(groups));
  localStorage.setItem(KEYS.GROUP_MEMBERS, JSON.stringify(members));
};

// Initialize
const initDB = () => {
  if (!localStorage.getItem(KEYS.GROUPS)) {
    initDemoGroups();
  }
};

// ==================== GROUP OPERATIONS ====================

export const getGroups = (): Group[] => {
  initDB();
  return JSON.parse(localStorage.getItem(KEYS.GROUPS) || '[]');
};

export const getGroupById = (id: string): Group | undefined => {
  return getGroups().find(g => g.id === id);
};

export const getGroupByInviteCode = (code: string): Group | undefined => {
  return getGroups().find(g => g.inviteCode === code.toUpperCase());
};

// Create a new group
export const createGroup = (
  name: string,
  description: string,
  createdBy: string,
  parentId: string | null = null,
  isPublic: boolean = false
): Group => {
  const groups = getGroups();
  
  // Calculate level based on parent
  let level = 0;
  if (parentId) {
    const parent = getGroupById(parentId);
    if (parent) {
      level = parent.level + 1;
    }
  }
  
  const newGroup: Group = {
    id: generateId(),
    name,
    description,
    avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=${['1877F2', '42B72A', 'F7B928', 'FA383E', 'E4E6EB'][Math.floor(Math.random() * 5)]}`,
    parentId,
    level,
    createdBy,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    inviteCode: generateInviteCode(),
    isPublic,
  };
  
  groups.push(newGroup);
  localStorage.setItem(KEYS.GROUPS, JSON.stringify(groups));
  
  // Creator automatically becomes admin
  addGroupMember(newGroup.id, createdBy, 'admin');
  
  return newGroup;
};

// Update group
export const updateGroup = (id: string, updates: Partial<Group>): Group | null => {
  const groups = getGroups();
  const index = groups.findIndex(g => g.id === id);
  if (index === -1) return null;
  
  groups[index] = { ...groups[index], ...updates, updatedAt: new Date().toISOString() };
  localStorage.setItem(KEYS.GROUPS, JSON.stringify(groups));
  return groups[index];
};

// Delete group (and all sub-groups)
export const deleteGroup = (id: string): boolean => {
  const groups = getGroups();
  
  // Find all sub-groups recursively
  const getSubGroupIds = (parentId: string): string[] => {
    const directChildren = groups.filter(g => g.parentId === parentId).map(g => g.id);
    const allChildren = [...directChildren];
    directChildren.forEach(childId => {
      allChildren.push(...getSubGroupIds(childId));
    });
    return allChildren;
  };
  
  const subGroupIds = getSubGroupIds(id);
  const allGroupIdsToDelete = [id, ...subGroupIds];
  
  // Remove groups
  const filteredGroups = groups.filter(g => !allGroupIdsToDelete.includes(g.id));
  localStorage.setItem(KEYS.GROUPS, JSON.stringify(filteredGroups));
  
  // Remove members
  const members = getGroupMembers();
  const filteredMembers = members.filter(m => !allGroupIdsToDelete.includes(m.groupId));
  localStorage.setItem(KEYS.GROUP_MEMBERS, JSON.stringify(filteredMembers));
  
  return true;
};

// Get sub-groups of a group
export const getSubGroups = (groupId: string): Group[] => {
  return getGroups().filter(g => g.parentId === groupId);
};

// Get parent group
export const getParentGroup = (groupId: string): Group | undefined => {
  const group = getGroupById(groupId);
  if (!group?.parentId) return undefined;
  return getGroupById(group.parentId);
};

// Get all ancestor groups (from top to current)
export const getGroupHierarchy = (groupId: string): Group[] => {
  const hierarchy: Group[] = [];
  let current: Group | undefined = getGroupById(groupId);
  
  while (current) {
    hierarchy.unshift(current);
    current = current.parentId ? getGroupById(current.parentId) : undefined;
  }
  
  return hierarchy;
};

// Get all descendant groups (current and all sub-groups)
export const getAllDescendantGroups = (groupId: string): Group[] => {
  const descendants: Group[] = [];
  const group = getGroupById(groupId);
  if (!group) return descendants;
  
  descendants.push(group);
  
  const addSubGroups = (parentId: string) => {
    const subGroups = getGroups().filter(g => g.parentId === parentId);
    subGroups.forEach(sub => {
      descendants.push(sub);
      addSubGroups(sub.id);
    });
  };
  
  addSubGroups(groupId);
  return descendants;
};

// ==================== MEMBER OPERATIONS ====================

export const getGroupMembers = (groupId?: string): GroupMember[] => {
  initDB();
  const members = JSON.parse(localStorage.getItem(KEYS.GROUP_MEMBERS) || '[]');
  if (groupId) {
    return members.filter((m: GroupMember) => m.groupId === groupId);
  }
  return members;
};

export const getUserGroups = (userId: string): Group[] => {
  const members = getGroupMembers();
  const userGroupIds = members
    .filter((m: GroupMember) => m.userId === userId)
    .map((m: GroupMember) => m.groupId);
  return getGroups().filter(g => userGroupIds.includes(g.id));
};

export const isGroupMember = (groupId: string, userId: string): boolean => {
  const members = getGroupMembers(groupId);
  return members.some(m => m.userId === userId);
};

export const getGroupMemberRole = (groupId: string, userId: string): GroupRole | null => {
  const members = getGroupMembers(groupId);
  const member = members.find(m => m.userId === userId);
  return member?.role || null;
};

export const isGroupAdmin = (groupId: string, userId: string): boolean => {
  return getGroupMemberRole(groupId, userId) === 'admin';
};

// Add member to group
export const addGroupMember = (
  groupId: string,
  userId: string,
  role: GroupRole = 'member',
  invitedBy?: string
): GroupMember => {
  const members = getGroupMembers();
  
  // Check if already member
  const existing = members.find(m => m.groupId === groupId && m.userId === userId);
  if (existing) {
    return existing;
  }
  
  const newMember: GroupMember = {
    id: generateId(),
    groupId,
    userId,
    user: {} as User,
    role,
    joinedAt: new Date().toISOString(),
    invitedBy,
  };
  
  members.push(newMember);
  localStorage.setItem(KEYS.GROUP_MEMBERS, JSON.stringify(members));
  
  return newMember;
};

// Remove member from group
export const removeGroupMember = (groupId: string, userId: string): boolean => {
  const members = getGroupMembers();
  const filtered = members.filter(m => !(m.groupId === groupId && m.userId === userId));
  
  if (filtered.length === members.length) return false;
  
  localStorage.setItem(KEYS.GROUP_MEMBERS, JSON.stringify(filtered));
  return true;
};

// Update member role
export const updateMemberRole = (
  groupId: string,
  userId: string,
  role: GroupRole
): GroupMember | null => {
  const members = getGroupMembers();
  const index = members.findIndex(m => m.groupId === groupId && m.userId === userId);
  
  if (index === -1) return null;
  
  members[index] = { ...members[index], role };
  localStorage.setItem(KEYS.GROUP_MEMBERS, JSON.stringify(members));
  
  return members[index];
};

// ==================== INVITATION OPERATIONS ====================

export const getGroupInvitations = (): GroupInvitation[] => {
  return JSON.parse(localStorage.getItem(KEYS.GROUP_INVITATIONS) || '[]');
};

// Create invitation
export const createInvitation = (
  groupId: string,
  invitedBy: string,
  invitedUserId?: string,
  invitedEmail?: string
): GroupInvitation => {
  const invitations = getGroupInvitations();
  
  const newInvitation: GroupInvitation = {
    id: generateId(),
    groupId,
    invitedBy,
    invitedUserId,
    invitedEmail,
    inviteCode: generateInviteCode(),
    status: 'pending',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
    createdAt: new Date().toISOString(),
  };
  
  invitations.push(newInvitation);
  localStorage.setItem(KEYS.GROUP_INVITATIONS, JSON.stringify(invitations));
  
  return newInvitation;
};

// Accept invitation
export const acceptInvitation = (inviteCode: string, userId: string): Group | null => {
  const invitations = getGroupInvitations();
  const invitation = invitations.find(i => i.inviteCode === inviteCode.toUpperCase());
  
  if (!invitation) return null;
  if (invitation.status !== 'pending') return null;
  if (new Date(invitation.expiresAt) < new Date()) {
    invitation.status = 'expired';
    localStorage.setItem(KEYS.GROUP_INVITATIONS, JSON.stringify(invitations));
    return null;
  }
  
  // Add user to group
  addGroupMember(invitation.groupId, userId, 'member', invitation.invitedBy);
  
  // Update invitation status
  invitation.status = 'accepted';
  localStorage.setItem(KEYS.GROUP_INVITATIONS, JSON.stringify(invitations));
  
  const group = getGroupById(invitation.groupId);
  return group || null;
};

// ==================== VISIBILITY & PERMISSIONS ====================

// Check if user can view a group (is member of this group or any ancestor group)
export const canViewGroup = (groupId: string, userId: string): boolean => {
  // Direct member
  if (isGroupMember(groupId, userId)) return true;
  
  // Check if member of any ancestor group (upper groups can see lower groups)
  const hierarchy = getGroupHierarchy(groupId);
  for (const ancestor of hierarchy) {
    if (ancestor.id !== groupId && isGroupMember(ancestor.id, userId)) {
      return true;
    }
  }
  
  return false;
};

// Check if user can post in a group
export const canPostInGroup = (groupId: string, userId: string): boolean => {
  // Must be direct member to post
  return isGroupMember(groupId, userId);
};

// Get all groups visible to a user (groups they're in + all sub-groups of those groups)
export const getVisibleGroups = (userId: string): Group[] => {
  const userGroups = getUserGroups(userId);
  const visibleGroups: Group[] = [...userGroups];
  
  // Add all sub-groups of user's groups
  userGroups.forEach(group => {
    const descendants = getAllDescendantGroups(group.id);
    descendants.forEach(descendant => {
      if (!visibleGroups.find(g => g.id === descendant.id)) {
        visibleGroups.push(descendant);
      }
    });
  });
  
  return visibleGroups.sort((a, b) => a.level - b.level);
};

// Get groups where user is admin (for creating sub-groups)
export const getAdminGroups = (userId: string): Group[] => {
  const members = getGroupMembers();
  const adminGroupIds = members
    .filter(m => m.userId === userId && m.role === 'admin')
    .map(m => m.groupId);
  return getGroups().filter(g => adminGroupIds.includes(g.id));
};
