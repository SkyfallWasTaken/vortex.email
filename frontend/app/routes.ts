import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
	index("routes/home.tsx"),
	route("/credits", "routes/credits.tsx"),
	route("/support-the-project", "routes/support-the-project.tsx"),

	route("/legal", "routes/legal.tsx"),
	route("/legal/privacy", "routes/privacy.tsx"),
	route("/legal/terms", "routes/terms.tsx"),
] satisfies RouteConfig;
