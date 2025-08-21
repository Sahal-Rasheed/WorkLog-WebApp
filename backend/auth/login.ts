import { api } from "encore.dev/api";
import { db } from "../database/db";

interface LoginRequest {
  email: string;
  name: string;
  avatar_url?: string;
}

interface Organization {
  id: string;
  name: string;
  slug: string;
  role: string;
  status: string;
}

interface LoginResponse {
  user: {
    id: string;
    email: string;
    name: string;
    avatar_url?: string;
  };
  organizations: Organization[];
  needs_organization_selection: boolean;
}

// Login or register user and return their organizations
export const login = api<LoginRequest, LoginResponse>(
  { expose: true, method: "POST", path: "/auth/login" },
  async (req) => {
    // Create or update user
    let user = await db.queryRow`
      SELECT id, email, name, avatar_url 
      FROM users 
      WHERE email = ${req.email}
    `;

    if (!user) {
      user = await db.queryRow`
        INSERT INTO users (email, name, avatar_url)
        VALUES (${req.email}, ${req.name}, ${req.avatar_url || null})
        RETURNING id, email, name, avatar_url
      `;
    } else {
      // Update user info
      user = await db.queryRow`
        UPDATE users 
        SET name = ${req.name}, avatar_url = ${req.avatar_url || null}, updated_at = NOW()
        WHERE email = ${req.email}
        RETURNING id, email, name, avatar_url
      `;
    }

    // Get user's organizations
    const organizations = await db.queryAll<Organization>`
      SELECT 
        o.id,
        o.name,
        o.slug,
        om.role,
        om.status
      FROM organizations o
      JOIN organization_members om ON o.id = om.organization_id
      WHERE om.user_id = ${user.id}
      ORDER BY om.created_at DESC
    `;

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar_url: user.avatar_url,
      },
      organizations,
      needs_organization_selection: organizations.length === 0,
    };
  }
);
