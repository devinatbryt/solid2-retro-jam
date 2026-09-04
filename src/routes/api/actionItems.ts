import type { APIHandler } from "filesystem-routing/api";
import { listActionItems, postActionItem } from "../../server/db";
import { getMe } from "../../lib/jam";

export const GET: APIHandler = () => Response.json(listActionItems());

export const POST: APIHandler = async (request) => {
  const data = await request.request.json();
  if (data.ok) {
    const me = await getMe();
    return postActionItem({ ...me, ...data });
  }
};
