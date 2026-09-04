import type { APIHandler } from "filesystem-routing/api";
import { listDidntGoWell } from "../../server/db";

export const GET: APIHandler = () => Response.json(listDidntGoWell());
