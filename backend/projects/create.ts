import { api } from "encore.dev/api";
import { db } from "../database/db";

interface CreateProjectRequest {
  organization_id: string;
  name: string;
  description?: string;
  created_by: string;
}

interface CreateProjectResponse {
  project: {
    id: string;
    name: string;
    description?: string;
    is_archived: boolean;
    created_by: string;
    created_at: string;
  };
}

// Create a new project
export const create = api<CreateProjectRequest, CreateProjectResponse>(
  { expose: true, method: "POST", path: "/organizations/:organization_id/projects" },
  async (req) => {
    const project = await db.queryRow`
      INSERT INTO projects (organization_id, name, description, created_by)
      VALUES (${req.organization_id}, ${req.name}, ${req.description || null}, ${req.created_by})
      RETURNING id, name, description, is_archived, created_at
    `;

    const creator = await db.queryRow`
      SELECT name FROM users WHERE id = ${req.created_by}
    `;

    return {
      project: {
        id: project.id,
        name: project.name,
        description: project.description,
        is_archived: project.is_archived,
        created_by: creator.name,
        created_at: project.created_at,
      },
    };
  }
);
