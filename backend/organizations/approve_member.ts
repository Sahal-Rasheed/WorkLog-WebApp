import { api } from "encore.dev/api";
import { db } from "../database/db";

interface ApproveMemberRequest {
  organization_id: string;
  member_id: string;
}

interface ApproveMemberResponse {
  success: boolean;
}

// Approve a pending member
export const approveMember = api<ApproveMemberRequest, ApproveMemberResponse>(
  { expose: true, method: "POST", path: "/organizations/:organization_id/members/:member_id/approve" },
  async (req) => {
    await db.exec`
      UPDATE organization_members 
      SET status = 'active', joined_at = NOW(), updated_at = NOW()
      WHERE id = ${req.member_id} 
        AND organization_id = ${req.organization_id}
        AND status = 'pending'
    `;

    return { success: true };
  }
);
