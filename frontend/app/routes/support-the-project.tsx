import KofiButton from "~/assets/kofi-button.png";

export default function Donate() {
	return (
		<div className="flex flex-col md:p-6 mx-6 my-6 prose">
			<h1 className="mb-0">Support the project</h1>
			<p className="mb-0">
				Vortex is a labour of love, and is currently maintained by{" "}
				<a
					href="https://skyfall.dev"
					target="_blank"
					className="underline"
					rel="noreferrer"
				>
					Skyfall (Mahad Kalam)
				</a>
				.
			</p>
			<p className="mb-0">
				If you would like to support the project, I would appreciate a donation
				on my Ko-Fi! Your support will help me buy more domains for the site,
				add new features, and fuel my development efforts.
			</p>

			<a
				href="https://ko-fi.com/skyfalldev"
				aria-label="Ko-Fi (@skyfalldev)"
				target="_blank"
				className="mb-0"
				rel="noreferrer"
			>
				<img
					src={KofiButton}
					alt="Ko-Fi button"
					className="w-full mb-4 sm:w-1/2 cursor-pointer hover:opacity-80 transition"
					width="980"
					height="198"
				/>
			</a>
			<p>
				You can also sponsor me on{" "}
				<a
					href="https://github.com/sponsors/SkyfallWasTaken"
					target="_blank"
					className="underline"
					rel="noreferrer"
				>
					GitHub Sponsors
				</a>
				.
			</p>

			<h2>Other ways to support</h2>
			<p className="mb-0">
				If you would like to support Vortex in other ways, you can also{" "}
				<a href="https://github.com/SkyfallWasTaken/vortex.email">
					star the repo
				</a>{" "}
				or help with coding the project!
			</p>
			<p className="mb-0">
				You can also help spread the word about Vortex if it's been useful for
				you!
			</p>

			<h2>Thank you! :D</h2>
			<p>Your support truly means a lot :)</p>
		</div>
	);
}
