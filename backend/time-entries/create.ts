import { api } from "encore.dev/api";
import { db } from "../database/db";

interface CreateTimeEntryRequest {
  organization_id: string;
  project_id: string;
  user_id: string;
  date: string;
  task: string;
  hours: number;
}

interface CreateTimeEntryResponse {
  time_entry: {
    id: string;
    project_id: string;
    user_id: string;
    date: string;
    task: string;
    hours: number;
    created_at: string;
    updated_at: string;
  };
}

// Create a new time entry
export const create = api<CreateTimeEntryRequest, CreateTimeEntryResponse>(
  { expose: true, method: "POST", path: "/organizations/:organization_id/time-entries" },
  async (req) => {
    if (req.hours <= 0 || req.hours > 24) {
      throw new Error("Hours must be between 0 and 24");
    }

    const timeEntry = await db.queryRow`
      INSERT INTO time_entries (organization_id, project_id, user_id, date, task, hours)
      VALUES (${req.organization_id}, ${req.project_id}, ${req.user_id}, ${req.date}, ${req.task}, ${req.hours})
      RETURNING id, project_id, user_id, date, task, hours, created_at, updated_at
    `;

    return { time_entry: timeEntry };
  }
);
