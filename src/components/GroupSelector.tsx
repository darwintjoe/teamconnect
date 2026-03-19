import { useState } from 'react';
import { ChevronDown, Plus, Users, ChevronRight } from 'lucide-react';
import type { Group } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface GroupSelectorProps {
  groups: Group[];
  currentGroup: Group | null;
  onSelectGroup: (group: Group | null) => void;
  onCreateGroup: (name: string, description: string, parentId: string | null) => void;
  adminGroups: Group[];
}

export function GroupSelector({
  groups,
  currentGroup,
  onSelectGroup,
  onCreateGroup,
  adminGroups,
}: GroupSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [parentGroupId, setParentGroupId] = useState<string | null>(null);

  const handleCreateGroup = () => {
    if (!newGroupName.trim()) return;
    onCreateGroup(newGroupName.trim(), newGroupDescription.trim(), parentGroupId);
    setNewGroupName('');
    setNewGroupDescription('');
    setParentGroupId(null);
    setShowCreateDialog(false);
  };

  const renderGroupTree = (parentId: string | null = null, level = 0) => {
    const children = groups.filter(g => g.parentId === parentId);
    
    return children.map(group => (
      <div key={group.id}>
        <button
          onClick={() => {
            onSelectGroup(group);
            setIsOpen(false);
          }}
          className={`w-full flex items-center gap-2 px-3 py-2.5 hover:bg-[#F0F2F5] transition-colors text-left ${
            currentGroup?.id === group.id ? 'bg-[#E7F3FF] text-[#1877F2]' : 'text-[#050505]'
          }`}
          style={{ paddingLeft: `${12 + level * 20}px` }}
        >
          <img
            src={group.avatar}
            alt={group.name}
            className="w-8 h-8 rounded-lg object-cover"
          />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-[14px] truncate">{group.name}</p>
            <p className="text-[12px] text-[#65676B] truncate">{group.description}</p>
          </div>
          {groups.some(g => g.parentId === group.id) && (
            <ChevronRight className="w-4 h-4 text-[#65676B]" />
          )}
        </button>
        {renderGroupTree(group.id, level + 1)}
      </div>
    ));
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
      >
        {currentGroup ? (
          <>
            <img
              src={currentGroup.avatar}
              alt={currentGroup.name}
              className="w-6 h-6 rounded object-cover"
            />
            <span className="font-medium text-[14px]">{currentGroup.name}</span>
          </>
        ) : (
          <>
            <Users className="w-5 h-5 text-[#65676B]" />
            <span className="font-medium text-[14px]">All Groups</span>
          </>
        )}
        <ChevronDown className={`w-4 h-4 text-[#65676B] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-[#DADDE1] z-50 max-h-[70vh] overflow-auto">
            <div className="p-2 border-b border-[#DADDE1]">
              <button
                onClick={() => {
                  onSelectGroup(null);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2.5 hover:bg-[#F0F2F5] transition-colors text-left rounded-lg ${
                  !currentGroup ? 'bg-[#E7F3FF] text-[#1877F2]' : 'text-[#050505]'
                }`}
              >
                <Users className="w-5 h-5" />
                <span className="font-medium text-[14px]">All Groups</span>
              </button>
            </div>

            <div className="py-1">
              {renderGroupTree()}
            </div>

            <div className="p-2 border-t border-[#DADDE1]">
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full flex items-center gap-2 justify-start text-[#1877F2]"
                  >
                    <Plus className="w-5 h-5" />
                    <span className="font-medium text-[14px]">Create New Group</span>
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Group</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div>
                      <Label htmlFor="group-name">Group Name</Label>
                      <Input
                        id="group-name"
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                        placeholder="e.g., Engineering Team"
                      />
                    </div>
                    <div>
                      <Label htmlFor="group-description">Description</Label>
                      <Textarea
                        id="group-description"
                        value={newGroupDescription}
                        onChange={(e) => setNewGroupDescription(e.target.value)}
                        placeholder="What is this group about?"
                        rows={3}
                      />
                    </div>
                    {adminGroups.length > 0 && (
                      <div>
                        <Label htmlFor="parent-group">Parent Group (Optional)</Label>
                        <select
                          id="parent-group"
                          value={parentGroupId || ''}
                          onChange={(e) => setParentGroupId(e.target.value || null)}
                          className="w-full px-3 py-2 border border-[#DADDE1] rounded-lg text-[14px]"
                        >
                          <option value="">No parent (top-level group)</option>
                          {adminGroups.map(group => (
                            <option key={group.id} value={group.id}>
                              {group.name}
                            </option>
                          ))}
                        </select>
                        <p className="text-[12px] text-[#65676B] mt-1">
                          You can only create sub-groups under groups you admin
                        </p>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => setShowCreateDialog(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        className="flex-1 bg-[#1877F2] hover:bg-[#166fe5]"
                        onClick={handleCreateGroup}
                        disabled={!newGroupName.trim()}
                      >
                        Create Group
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
