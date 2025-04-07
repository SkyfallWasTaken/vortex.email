import { SiGithub, SiX } from '@icons-pack/react-simple-icons';

export default function Header() {
    return (
        <header className="flex items-center justify-between py-4 px-5 md:px-10 border-b border-surface0">
            <div className="flex items-center gap-2">
                <span className="font-medium text-lg">vortex.skyfall.dev</span>
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