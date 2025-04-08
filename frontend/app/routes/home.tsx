import {
	LuCopy,
	LuCopyCheck,
	LuInbox,
	LuLoaderCircle,
	LuRefreshCcw,
} from "react-icons/lu";

import * as Accordion from "@radix-ui/react-accordion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";

import Email from "~/components/home/email";
import { type Email as EmailType, getRandomEmail } from "~/utils/main";

export function meta() {
	return [
		{ title: "Vortex - Free, disposable email addresses" },
		{
			name: "description",
			content:
				"Free, disposable email addresses for annoying newsletters, websites, and everything in between! Protect your privacy and avoid spam with temporary email addresses.",
		},
	];
}

export default function Home() {
	const [email, setEmail] = useState<string | null>(null);
	const queryClient = useQueryClient();

	useEffect(() => {
		if (typeof window !== "undefined") {
			// Older versions of Vortex JSON.stringify'd the email, so we need to remove the quotes
			const storedEmail = localStorage.getItem("email")?.replaceAll('"', "");
			if (storedEmail) {
				setEmail(storedEmail);
			} else {
				const newEmail = getRandomEmail();
				localStorage.setItem("email", newEmail);
				setEmail(newEmail);
			}
		}
	}, []);

	const updateEmail = useCallback(() => {
		const newEmail = getRandomEmail();
		localStorage.setItem("email", newEmail);
		setEmail(newEmail);
		queryClient.setQueryData(["emails", newEmail], []);
	}, [queryClient]);

	const { isPending, error, data } = useQuery<EmailType[]>({
		queryKey: ["emails", email],
		queryFn: () => {
			return fetch(`${import.meta.env.VITE_API_ENDPOINT}/emails/${email}`)
				.then((res) => {
					if (!res.ok) {
						throw new Error(`HTTP error! status: ${res.status}`);
					}
					return res.json() as Promise<EmailType[]>;
				})
				.then((emails) =>
					emails.sort(
						(a, b) =>
							new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
					),
				);
		},
		refetchInterval: 5000,
		enabled: !!email, // Only run the query when email is not null
	});

	// Render the main layout, conditionally rendering content based on loading state
	return (
		<div className="my-12 mx-4 md:mx-6">
			<div className="space-y-2 text-center md:w-[65%] mx-auto">
				<h1 className="text-4xl font-semibold">
					Free, disposable email addresses
				</h1>
				<p className="text-lg text-text/80">
					For annoying newsletters, websites, and everything in between! Protect
					your privacy and avoid spam with temporary email addresses.
				</p>
			</div>

			<div className="rounded border border-surface0 px-4 sm:px-8 py-6 mt-6 w-full md:w-1/2 mx-auto">
				<p className="font-semibold text-lg text-center mb-2">
					Your email address:
				</p>
				{/* Conditional rendering for email display */}
				{email === null ? (
					<>
						<div className="flex justify-center items-center border border-surface0 bg-surface0/30 px-4 py-3 rounded mb-2.5 animate-pulse">
							loading...
						</div>
						<div className="flex flex-col sm:flex-row gap-2 sm:gap-4 text-blue justify-center items-center mt-4 opacity-50 pointer-events-none">
							<CopyButtonDisplay />
							<GenerateButtonDisplay />
						</div>
					</>
				) : (
					<>
						<div className="flex justify-center items-center border border-surface0 bg-surface0/30 px-4 py-3 rounded mb-2.5">
							{email}
						</div>
						<div className="flex flex-col sm:flex-row gap-2 sm:gap-4 text-blue justify-center items-center mt-4">
							<CopyButton email={email} highlightOnCopy />
							<GenerateButton updateEmail={updateEmail} />
						</div>
					</>
				)}
			</div>

			{/* Conditional rendering for email list section */}
			<div className="mt-6">
				{email === null || (isPending && !data) ? ( // Show loader if email is null OR initial fetch is pending
					<LuLoaderCircle
						className="h-32 text-blue animate-spin mx-auto"
						size={48}
					/>
				) : error ? (
					<p className="text-center py-5 bg-red-500 text-base">
						Error: {error.message}
					</p>
				) : data && data.length > 0 ? (
					<div className="w-full md:w-1/2 mx-auto">
						<Accordion.Root type="multiple" className="mb-4">
							{data.map((emailData) => (
								<Email key={emailData.email.id} email={emailData} />
							))}
						</Accordion.Root>
						{/* Ensure email is not null before passing to ClearAllEmails */}
						{email && <ClearAllEmails email={email} />}
					</div>
				) : (
					<NoEmailsFound /> // Show if not loading, no error, and data is empty
				)}
			</div>
		</div>
	);
}

function NoEmailsFound() {
	const [dots, setDots] = useState(".");
	useEffect(() => {
		const interval = setInterval(() => {
			// biome-ignore lint/style/useTemplate: just makes things harder to read
			setDots(dots.length < 3 ? dots + "." : "");
		}, 500);
		return () => clearInterval(interval);
	}, [dots]);

	return (
		<div className="flex justify-center items-center gap-4 border border-surface0 bg-surface0/30 px-4 py-6 rounded w-full md:w-1/2 mx-auto">
			<LuInbox
				size={64}
				strokeWidth={1.25}
				className="w-1/4 md:w-1/5 min-w-1/4 animate-pulse"
			/>
			<div className="flex flex-col gap-0.5 w-3/4 md:w-4/5 min-w-3/4">
				<h2 className="text-xl font-medium flex items-end space-x-2">
					<span>Waiting for emails{dots}</span>
				</h2>

				<p className="text-base text-text/80">
					Copy your email address and start using it to receive messages
				</p>
			</div>
		</div>
	);
}

function ClearAllEmails({ email }: { email: string }) {
	// email prop is guaranteed non-null here by parent logic
	const queryClient = useQueryClient();

	return (
		<div className="flex flex-col gap-3 text-center">
			<button
				type="button"
				className="text-center border border-surface0 rounded hover:bg-red-500 hover:text-base px-4 py-2 w-full transition duration-350 font-semibold"
				onClick={async () => {
					await fetch(
						`${import.meta.env.VITE_API_ENDPOINT}/emails/${email}/clear`,
						{
							method: "DELETE",
						},
					);
					queryClient.setQueryData(["emails", email], []);
				}}
			>
				Clear all emails
			</button>
			<p className="text-sm text-text/80">
				This will delete all emails for this address from our servers.
			</p>
		</div>
	);
}

function CopyButton({
	email,
	highlightOnCopy = false,
}: {
	email: string;
	highlightOnCopy?: boolean;
}) {
	const [copied, setCopied] = useState(false);

	return (
		<button
			type="button"
			onClick={() => {
				navigator.clipboard.writeText(email);
				setCopied(true);
				setTimeout(() => {
					setCopied(false);
				}, 1000);
			}}
		>
			<CopyButtonDisplay copied={copied} highlightOnCopy={highlightOnCopy} />
		</button>
	);
}

function CopyButtonDisplay({
	copied = false,
	highlightOnCopy = false,
}: { copied?: boolean; highlightOnCopy?: boolean }) {
	return (
		<div
			className={`flex items-center space-x-2 ${copied && highlightOnCopy ? "text-green" : ""}`}
		>
			{copied ? <LuCopyCheck size={16} /> : <LuCopy size={16} />}
			<span>{copied ? "Copied!" : "Copy email"}</span>
		</div>
	);
}

function GenerateButton({ updateEmail }: { updateEmail: () => void }) {
	return (
		<button type="button" onClick={updateEmail}>
			<GenerateButtonDisplay />
		</button>
	);
}

function GenerateButtonDisplay() {
	return (
		<div className="flex items-center space-x-2">
			<LuRefreshCcw size={16} />
			<span>Generate new email</span>
		</div>
	);
}
