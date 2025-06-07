import * as Accordion from "@radix-ui/react-accordion";
import { extract } from "letterparser";
import { sanitize as initialSanitize } from "lettersanitizer";
import type { Email as EmailType } from "~/utils/main";

export default function Email({ email }: { email: EmailType }) {
	const { html, text, subject, from } = extract(email.email.data);
	const domain = from?.address?.split("@")[1] || "";
	const senderName = from?.name || from?.address?.split("@")[0] || "Unknown";
	const date = new Date(email.timestamp || Date.now()).toLocaleTimeString();

	const imageSize = 48;
	const brandfetchUrl = `https://cdn.brandfetch.io/${domain}/w/256/h/256?c=${import.meta.env.VITE_BRANDFETCH_PUBLIC_KEY}`;
	const sanitizedHtml = html
		? sanitize(html)
		: `<pre>${sanitize(text || "")}</pre>`;

	return (
		<Accordion.Item
			value={email.email.id}
			className="border border-surface0 bg-surface0/30 hover:bg-surface0/80 rounded mb-2 overflow-hidden shadow-sm hover:shadow transition duration-200"
		>
			<Accordion.Trigger className="flex w-full text-left py-4 px-5">
				<div className="flex items-center gap-4 w-full">
					<img
						src={brandfetchUrl}
						width={imageSize}
						height={imageSize}
						className="rounded-full bg-blue-200 flex-shrink-0"
						alt=""
					/>
					<div className="flex-grow min-w-0">
						<div className="flex justify-between items-center">
							<span className="font-medium truncate">{senderName}</span>
							<span className="text-xs text-gray-500 hidden sm:block">
								{date}
							</span>
						</div>
						<p className="break-all sm:truncate text-[14px] text-gray-300">
							{subject || "(no subject)"}
						</p>
					</div>
				</div>
			</Accordion.Trigger>
			<Accordion.Content className="data-[state=open]:animate-slideDown data-[state=closed]:animate-slideUp overflow-x-auto overflow-y-hidden bg-white dark:bg-black text-black dark:text-white border-b border-surface1">
				<div className="text-[15px]">
					<iframe
						srcDoc={sanitizedHtml}
						className="w-full border-0"
						height="500"
						title={`Email contents of ${subject || "Untitled"}`}
					/>
				</div>
			</Accordion.Content>
		</Accordion.Item>
	);
}

function sanitize(html: string, text?: string) {
	return initialSanitize(html, text, {
		rewriteExternalResources: (url) => `https://wsrv.nl/?url=${url}`,
	});
}
