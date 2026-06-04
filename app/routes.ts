import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/applications.tsx"),
  route("/applications/:id", "routes/application-detail.tsx"),
] satisfies RouteConfig;
