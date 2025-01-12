import type { Email as EmailType } from "../email";

import { extract } from "letterparser";
import { Copy, CopyCheck, Inbox, LoaderCircle, RefreshCcw } from "lucide-react";
import { Letter } from "react-letter";

import { fakerEN as faker } from "@faker-js/faker";
import * as Accordion from "@radix-ui/react-accordion";
import { useQuery } from "@tanstack/react-query";
import { useDebounce, useLocalStorage } from "@uidotdev/usehooks";
import { useState } from "react";

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

export function Email({ email }: { email: EmailType }) {
	const { html, text, subject, from } = extract(email.data);

	return (
		<Accordion.Item value={email.id}>
			<Accordion.Trigger className="flex flex-col md:flex-row md:text-lg py-2 px-6 border-b border-overlay0 w-full text-left md:gap-4">
				<span className="truncate">
					{from?.name || from?.address || "Unknown"}
				</span>
				<span className="truncate">{subject || "No subject"}</span>
			</Accordion.Trigger>
			<Accordion.Content>
				<div className="bg-white text-black">
					<Letter
						html={html || text || ""}
						text={text}
						rewriteExternalResources={(url) => `https://wsrv.nl/?url=${url}`}
					/>
				</div>
			</Accordion.Content>
		</Accordion.Item>
	);
}

function getRandomEmailDomain(emailDomains: string[]) {
	return emailDomains[Math.floor(Math.random() * emailDomains.length)];
}

function CopyButton({
	username,
	emailDomain,
	highlightOnCopy = false,
}: {
	username: string;
	emailDomain: string;
	highlightOnCopy?: boolean;
}) {
	const [copied, setCopied] = useState(false);

	return (
		<button
			type="button"
			className={`flex items-center space-x-2 ${copied && highlightOnCopy ? "text-green" : ""}`}
			onClick={() => {
				navigator.clipboard.writeText(`${username}@${emailDomain}`);
				setCopied(true);
				setTimeout(() => {
					setCopied(false);
				}, 1000);
			}}
		>
			{copied ? <CopyCheck size={16} /> : <Copy size={16} />}
			<span>{copied ? "Copied!" : "Copy email"}</span>
		</button>
	);
}

const emailDomains: string[] = import.meta.env.VITE_EMAIL_DOMAINS.split(",");
export default function Home() {
	const [username, setUsername] = useLocalStorage(
		"username",
		faker.internet.username().toLowerCase(),
	);
	const debouncedUsername = useDebounce(username, 400);
	const [emailDomain, setEmailDomain] = useLocalStorage(
		"emailDomain",
		getRandomEmailDomain(emailDomains),
	);

	const { isPending, error, data } = useQuery<EmailType[]>({
		queryKey: ["emails", debouncedUsername, emailDomain],
		queryFn: () => {
			if (!debouncedUsername) {
				return Promise.resolve([]);
			}
			return fetch(
				`${import.meta.env.VITE_API_ENDPOINT}/emails/${debouncedUsername}@${emailDomain}`,
			).then((res) => res.json());
		},
		refetchInterval: 7000,
	});

	return (
		<>
			<div className="my-9 mx-3 md:mx-6">
				<div className="space-y-2 text-center w-[80%] md:w-2/3 mx-auto">
					<h1 className="text-4xl md:text-6xl font-bold">
						Free, disposable email addresses
					</h1>
					<p className="text-xl">
						For annoying newsletters, websites, and everything in between!
						Protect your privacy and avoid spam with temporary email addresses.
					</p>
				</div>
				<div className="flex gap-2 justify-center items-center w-full md:w-1/2 mx-auto mb-2.5 mt-6">
					<input
						type="text"
						className="h-12 shadow-sm bg-surface0 mx-auto p-4 w-full focus:border-none focus:outline-none focus:ring-[1px] focus:ring-mauve rounded"
						placeholder="Enter your email address"
						value={username}
						onChange={(e) => setUsername(e.target.value)}
					/>
					<select
						name="email-domain"
						className="h-12 shadow-sm bg-surface0 mx-auto p-4 w-full focus:border-none focus:outline-none focus:ring-[1px] focus:ring-mauve rounded"
						value={emailDomain}
						onChange={(e) => setEmailDomain(e.target.value)}
					>
						{emailDomains.map((domain) => (
							<option key={domain} value={domain}>
								@{domain}
							</option>
						))}
					</select>
				</div>
				<div className="flex gap-4 text-blue justify-center items-center md:w-1/3 mx-auto">
					<CopyButton
						username={username}
						emailDomain={emailDomain}
						highlightOnCopy
					/>
					<button
						type="button"
						className="flex items-center space-x-2"
						onClick={() => {
							setUsername(faker.internet.username().toLowerCase());
							setEmailDomain(getRandomEmailDomain(emailDomains));
						}}
					>
						<RefreshCcw size={16} />
						<span>Generate new email</span>
					</button>
				</div>

				<div className="mt-6">
					{isPending && (
						<LoaderCircle
							className="my-8 text-blue animate-spin mx-auto"
							size={32}
						/>
					)}
					{error && (
						<p className="text-center py-5 bg-red-500 text-base">
							Error: {error.message}
						</p>
					)}
					{data && data.length > 0 ? (
						<>
							<Accordion.Root
								type="multiple"
								className="w-full md:w-1/2 rounded mx-auto"
							>
								{data.map((email) => (
									<Email key={email.id} email={email} />
								))}
							</Accordion.Root>
							<div className="mb-4 md:mb-8" />
						</>
					) : (
						<div className="flex bg-mauve text-base items-center justify-center flex-col text-center py-5 rounded shadow-sm">
							<Inbox size={42} strokeWidth={1.5} className="mb-2" />
							<h2 className="text-xl">
								No emails found for {debouncedUsername}@{emailDomain}
							</h2>
							<p className="mb-2.5">
								Copy your email address and start using it to receive messages
							</p>
							<CopyButton username={username} emailDomain={emailDomain} />
						</div>
					)}
				</div>
			</div>
		</>
	);
}
