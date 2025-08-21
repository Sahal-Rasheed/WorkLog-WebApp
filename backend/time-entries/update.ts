import { api } from "encore.dev/api";
import { db } from "../database/db";

interface UpdateTimeEntryRequest {
  organization_id: string;
  entry_id: string;
  date?: string;
  task?: string;
  hours?: number;
}

interface UpdateTimeEntryResponse {
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

// Update a time entry
export const update = api<UpdateTimeEntryRequest, UpdateTimeEntryResponse>(
  { expose: true, method: "PUT", path: "/organizations/:organization_id/time-entries/:entry_id" },
  async (req) => {
    if (req.hours !== undefined && (req.hours <= 0 || req.hours > 24)) {
      throw new Error("Hours must be between 0 and 24");
    }

    let updateFields: string[] = [];
    let params: any[] = [];
    let paramIndex = 1;

    if (req.date !== undefined) {
      updateFields.push(`date = $${paramIndex}`);
      params.push(req.date);
      paramIndex++;
    }

    if (req.task !== undefined) {
      updateFields.push(`task = $${paramIndex}`);
      params.push(req.task);
      paramIndex++;
    }

    if (req.hours !== undefined) {
      updateFields.push(`hours = $${paramIndex}`);
      params.push(req.hours);
      paramIndex++;
    }

    if (updateFields.length === 0) {
      throw new Error("No fields to update");
    }

    updateFields.push(`updated_at = NOW()`);
    params.push(req.entry_id);
    params.push(req.organization_id);

    const query = `
      UPDATE time_entries 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex} AND organization_id = $${paramIndex + 1}
      RETURNING id, project_id, user_id, date, task, hours, created_at, updated_at
    `;

    const timeEntry = await db.rawQueryRow(query, ...params);

    if (!timeEntry) {
      throw new Error("Time entry not found");
    }

    return { time_entry: timeEntry };
  }
);
