import { useState } from "react";
import { LuX } from "react-icons/lu";
import { NavLink } from "react-router";
import links from "~/utils/links";

export default function Footer() {
	const commitHash = __GIT_COMMIT_HASH__;
	const commitUrl = __GIT_COMMIT_URL__;
	const commitTime = Number(__GIT_COMMIT_TIME__) * 1000; // Convert UNIX timestamp to milliseconds
	const [isInfoOpen, setIsInfoOpen] = useState(false);

	function timeAgo(timestamp: number) {
		const now = new Date();
		const diff = Math.floor((now.getTime() - timestamp) / 1000); // Difference in seconds

		if (diff < 60) return `${diff} second${diff !== 1 ? "s" : ""} ago`;
		if (diff < 3600)
			return `${Math.floor(diff / 60)} minute${
				Math.floor(diff / 60) !== 1 ? "s" : ""
			} ago`;
		if (diff < 86400)
			return `${Math.floor(diff / 3600)} hour${
				Math.floor(diff / 3600) !== 1 ? "s" : ""
			} ago`;
		return `${Math.floor(diff / 86400)} day${
			Math.floor(diff / 86400) !== 1 ? "s" : ""
		} ago`;
	}

	const commitAge = timeAgo(commitTime);

	return (
		<footer className="relative text-text/50 text-xs flex flex-col items-center py-4 mt-auto">
			{/*
        This div is always rendered in the DOM to ensure its content is available for SEO crawlers like Google.
        User visibility and interactivity are controlled with CSS classes based on the `isInfoOpen` state.
        When closed, it's visually hidden with `opacity-0` and `pointer-events-none`, but the text content
        remains in the HTML for scrapers.
      */}
			<div
				className={`absolute bottom-full mb-4 w-11/12 max-w-2xl bg-base p-6 rounded-lg shadow-lg border border-surface0 text-sm text-text/80 text-left sm:text-center transition-all duration-300 ease-in-out ${
					isInfoOpen
						? "opacity-100 translate-y-0"
						: "opacity-0 translate-y-4 pointer-events-none"
				}`}
			>
				<button
					type="button"
					onClick={() => setIsInfoOpen(false)}
					className="absolute top-2 right-2 p-1 text-text/50 hover:text-text transition"
					aria-label="Close"
				>
					<LuX size={20} />
				</button>
				<h3 className="font-bold text-base text-text mb-2">What's Vortex?</h3>
				<p>
					Tired of spam clogging up your inbox? Vortex provides{" "}
					<b>free, disposable email addresses</b> that you can use for anything
					- from signing up for newsletters and new accounts to{" "}
					<b>keeping your real email address safe from prying eyes.</b>
					<br />
					<br />
					With Vortex, you get a temporary email address to receive messages
					without the commitment (or the spam). It's simple, fast, and perfect
					for protecting your privacy and for keeping your real inbox tidy. Give
					it a try :)
				</p>
			</div>

			<div className="flex flex-col sm:flex-row items-center gap-2">
				<p>
					Running on build{" "}
					<a
						href={commitUrl}
						target="_blank"
						className="underline"
						rel="noreferrer"
					>
						{commitHash}
					</a>{" "}
					from about {commitAge}.
				</p>
				<span className="hidden sm:inline text-text/30">|</span>
				<button
					type="button"
					onClick={() => setIsInfoOpen(!isInfoOpen)}
					className="underline hover:text-text transition"
				>
					What's Vortex?
				</button>
			</div>
			<nav className="flex gap-4 my-2 text-xs sm:hidden">
				{links.map((link) => (
					<NavLink
						key={link.name}
						to={link.to}
						className={({ isActive }) =>
							`hover:text-blue transition ${
								isActive ? "text-blue font-medium" : "text-text/80"
							}`
						}
					>
						{link.name}
					</NavLink>
				))}
			</nav>
		</footer>
	);
}
