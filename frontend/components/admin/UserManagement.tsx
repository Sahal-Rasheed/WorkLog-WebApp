import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Check, Clock, Mail } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { validateEmail } from '../../utils/validation';
import type { OrganizationMember } from '../../types';

interface UserManagementProps {
  members: OrganizationMember[];
  onMemberApproved: (memberId: string) => void;
  onDataRefresh: () => Promise<void>;
  loading: boolean;
}

export function UserManagement({ members, onMemberApproved, onDataRefresh, loading }: UserManagementProps) {
  const { user, currentOrganization } = useAuth();
  const [newUser, setNewUser] = useState({ email: '', role: 'member' });
  const [showDialog, setShowDialog] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [approvingMember, setApprovingMember] = useState<string | null>(null);
  const { toast } = useToast();

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.email.trim() || !currentOrganization || !user) {
      toast({
        title: "Error",
        description: "Email is required",
        variant: "destructive",
      });
      return;
    }

    if (!validateEmail(newUser.email)) {
      toast({
        title: "Error",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    setInviting(true);
    try {
      // Generate invitation token
      const token = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

      const { error } = await supabase
        .from('invitations')
        .insert({
          organization_id: currentOrganization.id,
          email: newUser.email.trim(),
          role: newUser.role as 'admin' | 'member',
          invited_by: user.id,
          token,
          expires_at: expiresAt.toISOString(),
        });

      if (error) throw error;

      setNewUser({ email: '', role: 'member' });
      setShowDialog(false);
      toast({
        title: "Invitation Sent",
        description: `Invitation sent to ${newUser.email}`,
      });
    } catch (error) {
      console.error('Failed to invite user:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send invitation",
        variant: "destructive",
      });
    } finally {
      setInviting(false);
    }
  };

  const handleApproveMember = async (memberId: string) => {
    if (!currentOrganization) return;

    setApprovingMember(memberId);
    try {
      const { error } = await supabase
        .from('organization_members')
        .update({
          status: 'active',
          joined_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', memberId)
        .eq('organization_id', currentOrganization.id)
        .eq('status', 'pending');

      if (error) throw error;

      onMemberApproved(memberId);
      toast({
        title: "Member Approved",
        description: "Member has been approved and can now access the organization",
      });
    } catch (error) {
      console.error('Failed to approve member:', error);
      toast({
        title: "Error",
        description: "Failed to approve member",
        variant: "destructive",
      });
    } finally {
      setApprovingMember(null);
    }
  };

  const activeMembers = members.filter(m => m.status === 'active');
  const pendingMembers = members.filter(m => m.status === 'pending');

  return (
    <div className="space-y-6">
      {/* Pending Approvals */}
      {pendingMembers.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <Clock className="w-5 h-5" />
              Pending Approvals
            </CardTitle>
            <CardDescription className="text-orange-700">
              Members waiting for approval to join your organization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 bg-white rounded-lg border"
                >
                  <div>
                    <div className="font-medium">{member.name}</div>
                    <div className="text-sm text-gray-600">{member.email}</div>
                  </div>
                  <Button
                    onClick={() => handleApproveMember(member.id)}
                    disabled={approvingMember === member.id}
                    size="sm"
                  >
                    {approvingMember === member.id ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Approving...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Approve
                      </>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* User Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>
                Manage team members and invite new users
              </CardDescription>
            </div>
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Invite User
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invite Team Member</DialogTitle>
                  <DialogDescription>
                    Send an invitation to join your organization
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleInviteUser}>
                  <div className="space-y-4 py-4">
                    <div>
                      <Label htmlFor="user-email">Email Address</Label>
                      <Input
                        id="user-email"
                        type="email"
                        placeholder="user@company.com"
                        value={newUser.email}
                        onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="user-role">Role</Label>
                      <Select
                        value={newUser.role}
                        onValueChange={(value) => setNewUser(prev => ({ ...prev, role: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="member">Member</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={inviting}>
                      {inviting ? 'Sending...' : 'Send Invitation'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                    No team members found. Invite users above.
                  </TableCell>
                </TableRow>
              ) : (
                members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">{member.name}</TableCell>
                    <TableCell>{member.email}</TableCell>
                    <TableCell>
                      <Badge variant={member.role === 'admin' ? "default" : "secondary"}>
                        {member.role === 'admin' ? 'Administrator' : 'Member'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          member.status === 'active' ? "default" : 
                          member.status === 'pending' ? "secondary" : "outline"
                        }
                      >
                        {member.status === 'active' && <Check className="w-3 h-3 mr-1" />}
                        {member.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                        {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {member.joined_at ? new Date(member.joined_at).toLocaleDateString() : '-'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
