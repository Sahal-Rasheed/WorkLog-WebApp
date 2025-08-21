import { api } from "encore.dev/api";
import { db } from "../database/db";

interface GetMembersRequest {
  organization_id: string;
}

interface Member {
  id: string;
  user_id: string;
  email: string;
  name: string;
  avatar_url?: string;
  role: string;
  status: string;
  joined_at?: string;
  invited_by_name?: string;
}

interface GetMembersResponse {
  members: Member[];
}

// Get organization members
export const getMembers = api<GetMembersRequest, GetMembersResponse>(
  { expose: true, method: "GET", path: "/organizations/:organization_id/members" },
  async (req) => {
    const members = await db.queryAll<Member>`
      SELECT 
        om.id,
        om.user_id,
        u.email,
        u.name,
        u.avatar_url,
        om.role,
        om.status,
        om.joined_at,
        invited_by.name as invited_by_name
      FROM organization_members om
      JOIN users u ON om.user_id = u.id
      LEFT JOIN users invited_by ON om.invited_by = invited_by.id
      WHERE om.organization_id = ${req.organization_id}
      ORDER BY 
        CASE om.status 
          WHEN 'active' THEN 1 
          WHEN 'pending' THEN 2 
          ELSE 3 
        END,
        om.created_at ASC
    `;

    return { members };
  }
);
