import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, Users, Plus, Mail, CheckCircle, Clock } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { api } from '../../utils/api';
import { CreateOrganizationForm } from './CreateOrganizationForm';
import type { Organization, OrganizationSuggestion, Invitation } from '../../types';

interface OrganizationSelectorProps {
  userEmail: string;
  userId: string;
  organizations: Organization[];
  onOrganizationSelected: (org: Organization) => void;
  onOrganizationCreated: (org: Organization) => void;
}

export function OrganizationSelector({
  userEmail,
  userId,
  organizations,
  onOrganizationSelected,
  onOrganizationCreated
}: OrganizationSelectorProps) {
  const [suggestions, setSuggestions] = useState<OrganizationSuggestion[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [joiningOrg, setJoiningOrg] = useState<string | null>(null);
  const [acceptingInvite, setAcceptingInvite] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    checkEmailSuggestions();
  }, [userEmail]);

  const checkEmailSuggestions = async () => {
    try {
      const response = await api.post<{
        has_account: boolean;
        suggested_organizations: OrganizationSuggestion[];
        pending_invitations: Invitation[];
      }>('/auth/check-email', { email: userEmail });

      setSuggestions(response.suggested_organizations);
      setInvitations(response.pending_invitations);
    } catch (error) {
      console.error('Failed to check email suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinOrganization = async (orgId: string) => {
    setJoiningOrg(orgId);
    try {
      await api.post(`/organizations/join`, {
        organization_id: orgId,
        user_id: userId,
      });

      toast({
        title: "Request Sent",
        description: "Your request to join has been sent to the organization admins for approval.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send join request",
        variant: "destructive",
      });
    } finally {
      setJoiningOrg(null);
    }
  };

  const handleAcceptInvitation = async (token: string) => {
    setAcceptingInvite(token);
    try {
      const response = await api.post<{
        organization: Organization;
      }>('/organizations/accept-invitation', {
        token,
        user_id: userId,
      });

      toast({
        title: "Welcome!",
        description: `You've successfully joined ${response.organization.name}`,
      });

      onOrganizationSelected(response.organization);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to accept invitation",
        variant: "destructive",
      });
    } finally {
      setAcceptingInvite(null);
    }
  };

  if (loading) {
    return (
      <Card className="w-full max-w-2xl">
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Checking for organizations...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-4xl space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Choose Your Organization</h2>
        <p className="text-gray-600">
          Join an existing organization or create a new one to get started
        </p>
      </div>

      <Tabs defaultValue={invitations.length > 0 ? "invitations" : "existing"} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="invitations" className="relative">
            Invitations
            {invitations.length > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 text-xs">
                {invitations.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="existing">Join Existing</TabsTrigger>
          <TabsTrigger value="create">Create New</TabsTrigger>
        </TabsList>

        <TabsContent value="invitations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-blue-600" />
                Pending Invitations
              </CardTitle>
              <CardDescription>
                You have been invited to join these organizations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {invitations.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Mail className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No pending invitations</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {invitations.map((invitation) => (
                    <div
                      key={invitation.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div>
                        <h3 className="font-medium">{invitation.organization_name}</h3>
                        <p className="text-sm text-gray-600">
                          Invited by {invitation.invited_by_name}
                        </p>
                      </div>
                      <Button
                        onClick={() => handleAcceptInvitation(invitation.token)}
                        disabled={acceptingInvite === invitation.token}
                      >
                        {acceptingInvite === invitation.token ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Accepting...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Accept
                          </>
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="existing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-green-600" />
                Suggested Organizations
              </CardTitle>
              <CardDescription>
                Organizations with members from your domain ({userEmail.split('@')[1]})
              </CardDescription>
            </CardHeader>
            <CardContent>
              {suggestions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Building2 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No organizations found for your domain</p>
                  <p className="text-sm mt-2">Try creating a new organization instead</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {suggestions.map((org) => (
                    <div
                      key={org.id}
                      className="border rounded-lg p-4 hover:border-blue-300 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-medium">{org.name}</h3>
                          <p className="text-sm text-gray-600 flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {org.member_count} members
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleJoinOrganization(org.id)}
                        disabled={joiningOrg === org.id}
                        className="w-full"
                        variant="outline"
                      >
                        {joiningOrg === org.id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                            Requesting...
                          </>
                        ) : (
                          <>
                            <Clock className="w-4 h-4 mr-2" />
                            Request to Join
                          </>
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {organizations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Your Organizations</CardTitle>
                <CardDescription>
                  Organizations you're already a member of
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {organizations.map((org) => (
                    <div
                      key={org.id}
                      className="border rounded-lg p-4 hover:border-blue-300 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-medium">{org.name}</h3>
                          <Badge variant={org.role === 'admin' ? 'default' : 'secondary'}>
                            {org.role}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        onClick={() => onOrganizationSelected(org)}
                        className="w-full"
                      >
                        Continue
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="create">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-purple-600" />
                Create New Organization
              </CardTitle>
              <CardDescription>
                Start fresh with your own organization and invite your team
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CreateOrganizationForm
                userId={userId}
                onOrganizationCreated={onOrganizationCreated}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
