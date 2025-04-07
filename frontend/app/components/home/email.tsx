import * as Accordion from "@radix-ui/react-accordion";
import { extract } from "letterparser";
import { Letter } from "react-letter";
import type { Email as EmailType } from "~/email";

export default function Email({ email }: { email: EmailType }) {
    const { html, text, subject, from } = extract(email.email.data);
    const domain = from?.address?.split("@")[1] || "";
    const senderName = from?.name || from?.address?.split("@")[0] || "Unknown";
    const date = new Date(email.timestamp || Date.now()).toLocaleTimeString();
    const brandfetchUrl = `https://cdn.brandfetch.io/${domain}/w/48/h/48?c=${import.meta.env.VITE_BRANDFETCH_PUBLIC_KEY}`;

    return (
        <Accordion.Item
            value={email.email.id}
            className="border border-surface1 rounded mb-2 bg-surface0/80 overflow-hidden shadow-sm hover:shadow transition-shadow duration-200"
        >
            <Accordion.Trigger className="flex w-full text-left py-4 px-5">
                <div className="flex items-center gap-4 w-full">
                    <img
                        src={brandfetchUrl}
                        width="48"
                        height="48"
                        className="rounded-full bg-blue-200 flex-shrink-0"
                        alt=""
                    />
                    <div className="flex-grow min-w-0">
                        <div className="flex justify-between items-center">
                            <span className="font-medium truncate">{senderName}</span>
                            <span className="text-xs text-gray-500 hidden sm:block">{date}</span>
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
