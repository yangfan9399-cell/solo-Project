import { route, layout, index } from "@react-router/dev/routes";

export default [
  layout("routes/_dashboard.tsx", [
    index("routes/_dashboard._index.tsx"),
    route("permits", "routes/_dashboard.permits.tsx"),
    route("permits/new", "routes/_dashboard.permits.new.tsx"),
    route("permits/:id", "routes/_dashboard.permits.$id.tsx"),
    route("workers", "routes/_dashboard.workers.tsx"),
    route("contractors", "routes/_dashboard.contractors.tsx"),
    route("review/security", "routes/_dashboard.review.security.tsx"),
    route("review/safety", "routes/_dashboard.review.safety.tsx"),
    route("review/manager", "routes/_dashboard.review.manager.tsx"),
    route("dashboard", "routes/_dashboard.dashboard.tsx"),
  ]),
];
