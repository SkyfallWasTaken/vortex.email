import {
	Links,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
	isRouteErrorResponse,
} from "react-router";
import type { Route } from "./+types/root";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import stylesheet from "~/app.css?url";
import Footer from "~/components/layout/footer";
import Header from "~/components/layout/header";

export const links: Route.LinksFunction = () => [
	{ rel: "preconnect", href: "https://fonts.googleapis.com" },
	{
		rel: "preconnect",
		href: "https://fonts.gstatic.com",
		crossOrigin: "anonymous",
	},
	{
		rel: "stylesheet",
		href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
	},
	{ rel: "stylesheet", href: stylesheet },
];

const queryClient = new QueryClient();

export function Layout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" className="dark">
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<Meta />
				<Links />
				{import.meta.env.VITE_UMAMI_SCRIPT && (
					<script
						defer
						data-website-id={import.meta.env.VITE_UMAMI_WEBSITE_ID}
						src={import.meta.env.VITE_UMAMI_SCRIPT}
					/>
				)}
			</head>
			<body className="bg-mantle text-text">
				<QueryClientProvider client={queryClient}>
					<div className="flex flex-col min-h-screen">
						<Header />
						<main className="flex-grow mx-auto">{children}</main>
						<Footer />
					</div>
					<ScrollRestoration />
					<Scripts />
				</QueryClientProvider>
			</body>
		</html>
	);
}

export default function App() {
	return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
	let message = "Oops!";
	let details = "An unexpected error occurred.";
	let stack: string | undefined;

	if (isRouteErrorResponse(error)) {
		message = error.status === 404 ? "404" : "Error";
		details =
			error.status === 404
				? "The requested page could not be found."
				: error.statusText || details;
	} else if (import.meta.env.DEV && error && error instanceof Error) {
		details = error.message;
		stack = error.stack;
	}

	return (
		<main className="pt-12 p-4 container mx-auto space-y-2 text-center">
			<h1 className="text-4xl font-semibold">{message}</h1>
			<p>{details}</p>
			{stack && (
				<pre className="w-full p-4 overflow-x-auto">
					<code>{stack}</code>
				</pre>
			)}
		</main>
	);
}
