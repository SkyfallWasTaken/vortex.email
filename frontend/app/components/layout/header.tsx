import { SiGithub, SiX } from "react-icons/si";
import { Link, NavLink } from "react-router";

const links = [
	{ name: "Home", to: "/" },
	{ name: "Credits", to: "/credits" },
	{ name: "Support the project", to: "/support-the-project" },
	{ name: "Privacy ", to: "/privacy" },
	{ name: "Contact", to: "https://skyfall.dev/contact" },
];
export default function Header() {
	return (
		<header className="flex items-center justify-between py-4 px-5 md:px-8 border-b border-surface0">
			<div className="flex items-center ">
				<Link to="/" className="font-medium text-lg">
					vortex.skyfall.dev
				</Link>
				<nav className="hidden md:flex gap-3 lowercase mx-5">
					{links.map((link) => (
						<NavLink
							key={link.name}
							to={link.to}
							className={({ isActive, isPending }) =>
								`hover:text-blue transition ${
									isActive || isPending
										? "text-blue font-medium"
										: "text-text/80"
								}`
							}
						>
							{link.name}
						</NavLink>
					))}
				</nav>
			</div>
			<div className="flex items-center gap-4">
				<a
					href="https://github.com/SkyfallWasTaken/vortex.email"
					target="_blank"
					rel="noreferrer"
					className="hover:text-blue transition"
				>
					<SiGithub size={24} />
				</a>
				<a
					href="https://x.com/skyfall_ggs"
					target="_blank"
					rel="noreferrer"
					className="hover:text-blue transition"
				>
					<SiX size={24} />
				</a>
			</div>
		</header>
	);
}
