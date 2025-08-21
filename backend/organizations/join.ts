import { api } from "encore.dev/api";
import { db } from "../database/db";

interface JoinOrganizationRequest {
  organization_id: string;
  user_id: string;
}

interface JoinOrganizationResponse {
  success: boolean;
  requires_approval: boolean;
}

// Request to join an organization
export const join = api<JoinOrganizationRequest, JoinOrganizationResponse>(
  { expose: true, method: "POST", path: "/organizations/join" },
  async (req) => {
    // Check if user is already a member
    const existingMember = await db.queryRow`
      SELECT id, status FROM organization_members 
      WHERE organization_id = ${req.organization_id} AND user_id = ${req.user_id}
    `;

    if (existingMember) {
      if (existingMember.status === 'active') {
        throw new Error("You are already a member of this organization");
      } else if (existingMember.status === 'pending') {
        throw new Error("Your request to join is already pending approval");
      }
    }

    // Add user as pending member
    await db.exec`
      INSERT INTO organization_members (organization_id, user_id, role, status)
      VALUES (${req.organization_id}, ${req.user_id}, 'member', 'pending')
      ON CONFLICT (organization_id, user_id) 
      DO UPDATE SET status = 'pending', updated_at = NOW()
    `;

    return {
      success: true,
      requires_approval: true,
    };
  }
);
