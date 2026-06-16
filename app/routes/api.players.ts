import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { createPlayer, getAllPlayers, getPlayer } from "~/repo.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (id) {
    const player = getPlayer(id);
    return json({ player });
  }
  const players = getAllPlayers();
  return json({ players });
}

export async function action({ request }: ActionFunctionArgs) {
  const form = await request.formData();
  const name = form.get("name") as string;
  if (!name || name.trim().length < 1) {
    return json({ error: "请输入玩家名称" }, { status: 400 });
  }
  const player = createPlayer(name.trim());
  return json({ player });
}
