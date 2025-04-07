import type { Email as EmailType } from "../email";

import { extract } from "letterparser";
import { Copy, CopyCheck, Inbox, LoaderCircle, RefreshCcw } from "lucide-react";
import { Letter } from "react-letter";

import { fakerEN as faker } from "@faker-js/faker";
import * as Accordion from "@radix-ui/react-accordion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
	const { html, text, subject, from } = extract(email.email.data);
	const domain = from?.address?.split("@")[1] || "";
	const senderName = from?.name || from?.address?.split("@")[0] || "Unknown";
	const date = new Date(email.timestamp || Date.now()).toLocaleString();

	return (
		<Accordion.Item
			value={email.email.id}
			className="border border-surface1 rounded mb-2 bg-surface0 overflow-hidden shadow-sm hover:shadow transition-shadow duration-200"
		>
			<Accordion.Trigger className="flex w-full text-left py-4 px-5">
				{/* Mobile: Column layout */}
				<div className="flex flex-col w-full md:hidden gap-2">
					<div className="flex items-center gap-3">
						<img
							src={`https://cdn.brandfetch.io/${domain}/w/48/h/48?c=1idbRLpLjTbVnW5GkCT`}
							width="48"
							height="48"
							className="rounded-full bg-blue-200 flex-shrink-0"
							alt=""
						/>
						<span className="font-medium text-lg truncate">{senderName}</span>
					</div>
					<div className="pl-[60px]">
						<p className="truncate text-[15px] text-gray-700 dark:text-gray-300">
							{subject || "No subject"}
						</p>
						<p className="text-xs text-gray-500 mt-1">{date}</p>
					</div>
				</div>

				{/* Desktop: Row layout */}
				<div className="hidden md:flex md:items-center md:gap-4 w-full">
					<img
						src={`https://cdn.brandfetch.io/${domain}/w/48/h/48?c=1idbRLpLjTbVnW5GkCT`}
						width="48"
						height="48"
						className="rounded-full bg-blue-200 flex-shrink-0"
						alt=""
					/>
					<div className="flex-grow min-w-0">
						<div className="flex justify-between items-center">
							<span className="font-medium truncate">{senderName}</span>
							<span className="text-xs text-gray-500">{date}</span>
						</div>
						<p className="truncate text-[14px] text-gray-700 dark:text-gray-300">
							{subject || "No subject"}
						</p>
					</div>
				</div>
			</Accordion.Trigger>
			<Accordion.Content className="data-[state=open]:animate-slideDown data-[state=closed]:animate-slideUp overflow-hidden">
				<div className="bg-white dark:bg-black text-black dark:text-white text-[15px] p-4 border-t border-surface1">
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

	const queryClient = useQueryClient();
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
			<div className="mt-12 mb-9 mx-3 md:mx-6">
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
						className="h-12 shadow-sm bg-surface0 mx-auto p-4 w-full border border-surface1 focus:outline-none focus:ring-[1px] focus:ring-mauve rounded"
						placeholder="Enter your email address"
						value={username}
						onChange={(e) => setUsername(e.target.value)}
					/>
					<select
						name="email-domain"
						className="h-12 shadow-sm bg-surface0 mx-auto p-4 w-full border border-surface1 focus:outline-none focus:ring-[1px] focus:ring-mauve rounded"
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
							const username = faker.internet.username().toLowerCase();
							const emailDomain = getRandomEmailDomain(emailDomains);
							queryClient.setQueryData(["emails", username, emailDomain], []);
							setUsername(username);
							setEmailDomain(emailDomain);
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
							<div className="w-full md:w-1/2 mx-auto">
								<Accordion.Root type="multiple">
									{data.map((email) => (
										<Email key={email.email.id} email={email} />
									))}
								</Accordion.Root>
								<div className="mb-4" />
								<button
									className="text-center border border-surface0 rounded hover:bg-red-500 hover:text-base px-4 py-2 w-full transition duration-350 font-semibold"
									onClick={async () => {
										queryClient.setQueryData(
											["emails", debouncedUsername, emailDomain],
											[],
										);
										await fetch(
											`${import.meta.env.VITE_API_ENDPOINT}/emails/${debouncedUsername}@${emailDomain}/clear`,
											{
												method: "DELETE",
											},
										);
									}}
								>
									Clear all emails
								</button>
							</div>
						</>
					) : (
						!isPending && (
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
						)
					)}
				</div>
			</div>
		</>
	);
}
