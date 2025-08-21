import { api } from "encore.dev/api";
import { db } from "../database/db";

interface DeleteTimeEntryRequest {
  organization_id: string;
  entry_id: string;
}

interface DeleteTimeEntryResponse {
  success: boolean;
}

// Delete a time entry
export const deleteEntry = api<DeleteTimeEntryRequest, DeleteTimeEntryResponse>(
  { expose: true, method: "DELETE", path: "/organizations/:organization_id/time-entries/:entry_id" },
  async (req) => {
    const result = await db.exec`
      DELETE FROM time_entries 
      WHERE id = ${req.entry_id} AND organization_id = ${req.organization_id}
    `;

    return { success: true };
  }
);
