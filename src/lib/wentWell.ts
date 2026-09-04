import { query } from "@solidjs/router";
import { listWentWell } from "../server/db";

export const getWentWell = query(async () => {
  "use server";
  return listWentWell();
}, "wentWell");
