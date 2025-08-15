export function meta() {
	return [
		{ title: "Credits - Vortex" },
		{
			name: "description",
			content:
				"Vortex has been made possible by the help of many people. Here's the list of everyone who has contributed!",
		},
	];
}

const CREDITS = [
	{
		name: "Ella",
		url: "https://ella.ad/",
	},
	{
		name: "Hack Club",
		url: "https://hackclub.com",
	},
	{
		name: "Niko",
		url: "https://niko.launders.money",
	},
	{
		name: "Jeremy",
		url: "https://jer.app",
	},
	{
		name: "DigitalPlat",
		url: "https://digitalplat.org",
	},
	{
		name: "Navdeep",
		url: "https://navdeepsingh.tech",
	},
	{
		name: "Arthur",
		url: "http://github.com/aversefun",
	},
	{
		name: "Advait",
		url: "https://advaitconty.com",
	},
	{
		name: "Parneel",
		url: "https://pbhak.dev",
	},
];

export default function Credits() {
	return (
		<div className="flex flex-col md:p-6 mx-6 my-6 prose">
			<h1 className="mb-0">Credits</h1>
			<p className="mb-0">
				Thank you to all the people who helped make this project possible!
			</p>

			<ul>
				{CREDITS.map((credit) => (
					<li key={credit.name}>
						<a
							href={credit.url}
							target="_blank"
							className="underline"
							rel="noreferrer"
						>
							{credit.name}
						</a>
					</li>
				))}
			</ul>
		</div>
	);
}
