import { api } from "encore.dev/api";
import { db } from "../database/db";

interface AcceptInvitationRequest {
  token: string;
  user_id: string;
}

interface AcceptInvitationResponse {
  organization: {
    id: string;
    name: string;
    slug: string;
  };
}

// Accept an invitation to join an organization
export const acceptInvitation = api<AcceptInvitationRequest, AcceptInvitationResponse>(
  { expose: true, method: "POST", path: "/organizations/accept-invitation" },
  async (req) => {
    // Find and validate invitation
    const invitation = await db.queryRow`
      SELECT i.*, o.id as org_id, o.name as org_name, o.slug as org_slug
      FROM invitations i
      JOIN organizations o ON i.organization_id = o.id
      WHERE i.token = ${req.token}
        AND i.accepted_at IS NULL
        AND i.expires_at > NOW()
    `;

    if (!invitation) {
      throw new Error("Invalid or expired invitation");
    }

    // Check if user email matches invitation
    const user = await db.queryRow`
      SELECT email FROM users WHERE id = ${req.user_id}
    `;

    if (!user || user.email !== invitation.email) {
      throw new Error("Invitation email does not match your account");
    }

    // Add user to organization
    await db.exec`
      INSERT INTO organization_members (organization_id, user_id, role, status, invited_by, invited_at, joined_at)
      VALUES (${invitation.organization_id}, ${req.user_id}, ${invitation.role}, 'active', ${invitation.invited_by}, ${invitation.created_at}, NOW())
      ON CONFLICT (organization_id, user_id) 
      DO UPDATE SET 
        role = ${invitation.role},
        status = 'active',
        joined_at = NOW(),
        updated_at = NOW()
    `;

    // Mark invitation as accepted
    await db.exec`
      UPDATE invitations 
      SET accepted_at = NOW() 
      WHERE id = ${invitation.id}
    `;

    return {
      organization: {
        id: invitation.org_id,
        name: invitation.org_name,
        slug: invitation.org_slug,
      },
    };
  }
);
