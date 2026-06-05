import { useState } from "react";
import { Outlet, useLoaderData } from "react-router";
import { Layout } from "~/components/Layout";
import type { UserRole } from "~/lib/utils";

export const loader = async () => {
  return { currentRole: "SECURITY_OFFICER" as UserRole };
};

export default function AppLayout() {
  const initialData = useLoaderData<typeof loader>();
  const [currentRole, setCurrentRole] = useState<UserRole>(initialData.currentRole);

  return (
    <Layout currentRole={currentRole} onRoleChange={setCurrentRole}>
      <Outlet context={{ currentRole }} />
    </Layout>
  );
}
