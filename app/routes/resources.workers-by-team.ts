import { LoaderFunctionArgs } from "react-router";
import { getWorkersByTeamId } from "~/lib/services";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const teamId = parseInt(url.searchParams.get("teamId") || "0");

  if (!teamId) {
    return Response.json({ workers: [] }, { status: 400 });
  }

  const workers = await getWorkersByTeamId(teamId);
  return Response.json({ workers });
};
