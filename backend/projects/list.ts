import { api } from "encore.dev/api";
import { db } from "../database/db";

interface ListProjectsRequest {
  organization_id: string;
}

interface Project {
  id: string;
  name: string;
  description?: string;
  is_archived: boolean;
  created_by: string;
  created_at: string;
}

interface ListProjectsResponse {
  projects: Project[];
}

// List all projects in an organization
export const list = api<ListProjectsRequest, ListProjectsResponse>(
  { expose: true, method: "GET", path: "/organizations/:organization_id/projects" },
  async (req) => {
    const projects = await db.queryAll<Project>`
      SELECT 
        p.id,
        p.name,
        p.description,
        p.is_archived,
        u.name as created_by,
        p.created_at
      FROM projects p
      JOIN users u ON p.created_by = u.id
      WHERE p.organization_id = ${req.organization_id}
      ORDER BY p.is_archived ASC, p.created_at DESC
    `;

    return { projects };
  }
);
