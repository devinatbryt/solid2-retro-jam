import type { APIHandler } from "filesystem-routing/api";
import { listWentWell } from "../../server/db";

export const GET: APIHandler = () => Response.json(listWentWell());
