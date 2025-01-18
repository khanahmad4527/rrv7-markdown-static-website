import { type RouteConfig, route } from "@react-router/dev/routes";

export default [
  route("/", "routes/postlist.tsx"),
  route("/:slug", "routes/post.tsx"),
] satisfies RouteConfig;
