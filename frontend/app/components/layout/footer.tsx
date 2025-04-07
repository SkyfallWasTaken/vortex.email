import { NavLink } from "react-router";

const links = [
    { name: "Home", to: "/" },
    { name: "Credits", to: "/credits" },
    { name: "Support the project", to: "/support-the-project" },
]

export default function Footer() {
    const commitHash = __GIT_COMMIT_HASH__;
    const commitUrl = __GIT_COMMIT_URL__;
    const commitTime = Number(__GIT_COMMIT_TIME__) * 1000; // Convert UNIX timestamp to milliseconds

    function timeAgo(timestamp: number) {
        const now = new Date();
        const diff = Math.floor((now.getTime() - timestamp) / 1000); // Difference in seconds

        if (diff < 60) return `${diff} second${diff !== 1 ? "s" : ""} ago`;
        if (diff < 3600)
            return `${Math.floor(diff / 60)} minute${Math.floor(diff / 60) !== 1 ? "s" : ""} ago`;
        if (diff < 86400)
            return `${Math.floor(diff / 3600)} hour${Math.floor(diff / 3600) !== 1 ? "s" : ""} ago`;
        return `${Math.floor(diff / 86400)} day${Math.floor(diff / 86400) !== 1 ? "s" : ""} ago`;
    }

    const commitAge = timeAgo(commitTime);

    return (
        <div className="text-text/50 text-sm flex flex-col items-center py-4 mt-auto">
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
            <nav className="flex gap-3 mt-4">
                {links.map((link) => (
                    <NavLink
                        key={link.name}
                        to={link.to}
                        className={({ isActive }) =>
                            `hover:text-blue transition ${isActive ? "text-blue font-medium" : "text-text/80"
                            }`
                        }
                    >
                        {link.name}
                    </NavLink>
                ))}
            </nav>
        </div>
    );
}
