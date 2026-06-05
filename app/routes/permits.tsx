import { Outlet, useOutletContext } from "react-router";
import type { UserRole } from "~/lib/utils";

export default function PermitsLayout() {
  const context = useOutletContext<{ currentRole: UserRole }>();
  return <Outlet context={context} />;
}
