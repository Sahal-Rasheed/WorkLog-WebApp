import { api } from "encore.dev/api";
import { db } from "../database/db";

interface CreateOrganizationRequest {
  name: string;
  user_id: string;
}

interface CreateOrganizationResponse {
  organization: {
    id: string;
    name: string;
    slug: string;
  };
}

// Create a new organization
export const create = api<CreateOrganizationRequest, CreateOrganizationResponse>(
  { expose: true, method: "POST", path: "/organizations" },
  async (req) => {
    // Generate slug from name
    const slug = req.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

    // Check if slug already exists
    const existingOrg = await db.queryRow`
      SELECT id FROM organizations WHERE slug = ${slug}
    `;

    if (existingOrg) {
      throw new Error("Organization name already taken");
    }

    // Create organization
    const organization = await db.queryRow`
      INSERT INTO organizations (name, slug)
      VALUES (${req.name}, ${slug})
      RETURNING id, name, slug
    `;

    // Add user as admin
    await db.exec`
      INSERT INTO organization_members (organization_id, user_id, role, status, joined_at)
      VALUES (${organization.id}, ${req.user_id}, 'admin', 'active', NOW())
    `;

    // Create default project
    await db.exec`
      INSERT INTO projects (organization_id, name, description, created_by)
      VALUES (${organization.id}, 'General', 'Default project for general tasks', ${req.user_id})
    `;

    return {
      organization: {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
      },
    };
  }
);
