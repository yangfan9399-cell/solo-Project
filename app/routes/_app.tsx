import { Outlet, useOutletContext, useNavigate, useLocation } from "react-router";
import { useState, useEffect } from "react";
import { Layout } from "~/components/Layout";
import type { UserRole } from "~/lib/utils";

export function useCurrentRole() {
  return useOutletContext<{ currentRole: UserRole }>();
}

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentRole, setCurrentRole] = useState<UserRole>("SECURITY_OFFICER");

  useEffect(() => {
    if (location.pathname === "/" || location.pathname === "") {
      navigate("/permits");
    }
  }, [location.pathname, navigate]);

  return (
    <Layout currentRole={currentRole} onRoleChange={setCurrentRole}>
      <Outlet context={{ currentRole }} />
    </Layout>
  );
}
