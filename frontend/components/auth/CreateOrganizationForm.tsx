import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Building2, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '../../lib/supabase';
import { validateOrganizationName } from '../../utils/validation';
import type { Organization } from '../../types';

interface CreateOrganizationFormProps {
  userId: string;
  onOrganizationCreated: (org: Organization) => void;
}

export function CreateOrganizationForm({ userId, onOrganizationCreated }: CreateOrganizationFormProps) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = validateOrganizationName(name);
    setErrors(validation.errors);

    if (!validation.isValid) return;

    setLoading(true);
    try {
      // Generate slug
      const { data: slug } = await supabase.rpc('generate_organization_slug', {
        org_name: name.trim(),
      });

      // Create organization
      const { data: organization, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: name.trim(),
          slug,
        })
        .select()
        .single();

      if (orgError) throw orgError;

      // Add user as admin
      const { error: memberError } = await supabase
        .from('organization_members')
        .insert({
          organization_id: organization.id,
          user_id: userId,
          role: 'admin',
          status: 'active',
          joined_at: new Date().toISOString(),
        });

      if (memberError) throw memberError;

      // Create default project
      const { error: projectError } = await supabase
        .from('projects')
        .insert({
          organization_id: organization.id,
          name: 'General',
          description: 'Default project for general tasks',
          created_by: userId,
        });

      if (projectError) throw projectError;

      toast({
        title: "Organization Created",
        description: `${organization.name} has been created successfully!`,
      });

      const orgWithRole: Organization = {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        role: 'admin',
        status: 'active',
      };

      onOrganizationCreated(orgWithRole);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create organization",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc list-inside">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="org-name">Organization Name</Label>
        <div className="relative">
          <Building2 className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            id="org-name"
            type="text"
            placeholder="Acme Corporation"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="pl-10"
            disabled={loading}
          />
        </div>
        <p className="text-sm text-gray-600">
          This will be the name displayed to all team members
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">What happens next?</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• You'll become the organization administrator</li>
          <li>• A default "General" project will be created</li>
          <li>• You can invite team members from the admin panel</li>
          <li>• Start logging time immediately</li>
        </ul>
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Creating Organization...
          </>
        ) : (
          <>
            <Building2 className="w-4 h-4 mr-2" />
            Create Organization
          </>
        )}
      </Button>
    </form>
  );
}
