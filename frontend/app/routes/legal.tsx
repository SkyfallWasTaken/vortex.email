import { Link } from "react-router";

export function meta() {
	return [
		{ title: "Legal - Vortex" },
		{
			name: "description",
			content:
				"View the terms of service and privacy policy for Vortex, a free, disposable email address service.",
		},
	];
}

export default function Legal() {
	return (
		<div className="flex flex-col md:p-6 mx-6 my-6 prose">
			<h1 id="legal" className="mb-0">
				Legal
			</h1>
			<p className="mb-0">
				This website is operated by Mahad Kalam and is subject to the following
				agreements. By using this website, you agree that you have read and
				agree to be bound by these agreements. If you do not agree to these
				agreements, you are not permitted to use this website.
			</p>
			<ul>
				<li>
					<Link to="/legal/terms" viewTransition>
						Terms of Service
					</Link>
				</li>
				<li>
					<Link to="/legal/privacy" viewTransition>
						Privacy Policy
					</Link>
				</li>
			</ul>
		</div>
	);
}
