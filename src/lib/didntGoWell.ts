import { query } from "@solidjs/router";
import { listDidntGoWell } from "../server/db";

export const getDidntGoWell = query(async () => {
  "use server";
  return listDidntGoWell();
}, "didntGoWell");
