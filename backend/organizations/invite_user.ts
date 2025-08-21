import { api } from "encore.dev/api";
import { db } from "../database/db";
import { secret } from "encore.dev/config";

interface InviteUserRequest {
  organization_id: string;
  email: string;
  role: string;
  invited_by: string;
}

interface InviteUserResponse {
  success: boolean;
  invitation_id: string;
}

// Invite a user to join the organization
export const inviteUser = api<InviteUserRequest, InviteUserResponse>(
  { expose: true, method: "POST", path: "/organizations/:organization_id/invite" },
  async (req) => {
    // Check if user is already a member or has pending invitation
    const existingMember = await db.queryRow`
      SELECT id FROM organization_members 
      WHERE organization_id = ${req.organization_id} 
        AND user_id = (SELECT id FROM users WHERE email = ${req.email})
    `;

    if (existingMember) {
      throw new Error("User is already a member of this organization");
    }

    const existingInvitation = await db.queryRow`
      SELECT id FROM invitations 
      WHERE organization_id = ${req.organization_id} 
        AND email = ${req.email}
        AND accepted_at IS NULL
        AND expires_at > NOW()
    `;

    if (existingInvitation) {
      throw new Error("User already has a pending invitation");
    }

    // Generate invitation token
    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    // Create invitation
    const invitation = await db.queryRow`
      INSERT INTO invitations (organization_id, email, role, invited_by, token, expires_at)
      VALUES (${req.organization_id}, ${req.email}, ${req.role}, ${req.invited_by}, ${token}, ${expiresAt.toISOString()})
      RETURNING id
    `;

    return {
      success: true,
      invitation_id: invitation.id,
    };
  }
);
