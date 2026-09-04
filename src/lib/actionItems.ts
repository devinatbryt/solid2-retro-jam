import { query } from "@solidjs/router";
import { listActionItems } from "../server/db";

export const getActionItems = query(async () => {
  "use server";
  return listActionItems();
}, "actionItems");
