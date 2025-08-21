import { api } from "encore.dev/api";
import { db } from "../database/db";

interface ListTimeEntriesRequest {
  organization_id: string;
  project_id?: string;
  user_id?: string;
  start_date?: string;
  end_date?: string;
}

interface TimeEntry {
  id: string;
  project_id: string;
  project_name: string;
  user_id: string;
  user_name: string;
  user_email: string;
  date: string;
  task: string;
  hours: number;
  created_at: string;
  updated_at: string;
}

interface ListTimeEntriesResponse {
  time_entries: TimeEntry[];
}

// List time entries with optional filters
export const list = api<ListTimeEntriesRequest, ListTimeEntriesResponse>(
  { expose: true, method: "GET", path: "/organizations/:organization_id/time-entries" },
  async (req) => {
    let query = `
      SELECT 
        te.id,
        te.project_id,
        p.name as project_name,
        te.user_id,
        u.name as user_name,
        u.email as user_email,
        te.date,
        te.task,
        te.hours,
        te.created_at,
        te.updated_at
      FROM time_entries te
      JOIN projects p ON te.project_id = p.id
      JOIN users u ON te.user_id = u.id
      WHERE te.organization_id = $1
    `;

    const params: any[] = [req.organization_id];
    let paramIndex = 2;

    if (req.project_id) {
      query += ` AND te.project_id = $${paramIndex}`;
      params.push(req.project_id);
      paramIndex++;
    }

    if (req.user_id) {
      query += ` AND te.user_id = $${paramIndex}`;
      params.push(req.user_id);
      paramIndex++;
    }

    if (req.start_date) {
      query += ` AND te.date >= $${paramIndex}`;
      params.push(req.start_date);
      paramIndex++;
    }

    if (req.end_date) {
      query += ` AND te.date <= $${paramIndex}`;
      params.push(req.end_date);
      paramIndex++;
    }

    query += ` ORDER BY te.date DESC, te.created_at DESC`;

    const timeEntries = await db.rawQueryAll<TimeEntry>(query, ...params);

    return { time_entries: timeEntries };
  }
);
