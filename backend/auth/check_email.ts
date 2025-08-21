import { api } from "encore.dev/api";
import { db } from "../database/db";

interface CheckEmailRequest {
  email: string;
}

interface OrganizationSuggestion {
  id: string;
  name: string;
  slug: string;
  member_count: number;
}

interface CheckEmailResponse {
  has_account: boolean;
  suggested_organizations: OrganizationSuggestion[];
  pending_invitations: {
    id: string;
    organization_name: string;
    organization_slug: string;
    invited_by_name: string;
    token: string;
  }[];
}

// Check if email has existing account or pending invitations
export const checkEmail = api<CheckEmailRequest, CheckEmailResponse>(
  { expose: true, method: "POST", path: "/auth/check-email" },
  async (req) => {
    // Check if user exists
    const user = await db.queryRow`
      SELECT id FROM users WHERE email = ${req.email}
    `;

    // Get suggested organizations (organizations with similar domain)
    const emailDomain = req.email.split('@')[1];
    const suggestedOrgs = await db.queryAll<OrganizationSuggestion>`
      SELECT DISTINCT
        o.id,
        o.name,
        o.slug,
        COUNT(om.id) as member_count
      FROM organizations o
      JOIN organization_members om ON o.id = om.organization_id
      JOIN users u ON om.user_id = u.id
      WHERE u.email LIKE ${'%@' + emailDomain}
        AND om.status = 'active'
      GROUP BY o.id, o.name, o.slug
      HAVING COUNT(om.id) >= 2
      ORDER BY member_count DESC
      LIMIT 5
    `;

    // Get pending invitations
    const pendingInvitations = await db.queryAll`
      SELECT 
        i.id,
        o.name as organization_name,
        o.slug as organization_slug,
        u.name as invited_by_name,
        i.token
      FROM invitations i
      JOIN organizations o ON i.organization_id = o.id
      JOIN users u ON i.invited_by = u.id
      WHERE i.email = ${req.email}
        AND i.accepted_at IS NULL
        AND i.expires_at > NOW()
      ORDER BY i.created_at DESC
    `;

    return {
      has_account: !!user,
      suggested_organizations: suggestedOrgs,
      pending_invitations: pendingInvitations,
    };
  }
);
