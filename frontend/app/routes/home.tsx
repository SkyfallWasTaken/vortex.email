import type { Route } from "./+types/home";
import type { Email } from "../email";

import { Letter } from 'react-letter';
import { extract } from 'letterparser';
import { Copy, CopyCheck, RefreshCcw } from 'lucide-react';

import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useDebounce, useIsClient } from "@uidotdev/usehooks";
import { fakerEN as faker } from '@faker-js/faker';
import * as Accordion from "@radix-ui/react-accordion";

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "Vortex - Free, disposable email addresses" },
    { name: "description", content: "Free, disposable email addresses for annoying newsletters, websites, and everything in between! Protect your privacy and avoid spam with temporary email addresses." },
  ];
}

export function Email({ email }: { email: Email }) {
  const { html, text, subject, from } = extract(email.data);

  return (
    <Accordion.Item value={email.id}>
      <Accordion.Trigger className="flex flex-col md:flex-row md:text-lg py-2 px-6 border-b border-overlay0 w-full text-left md:gap-4">
        <span className="truncate">{from?.name || from?.address || "Unknown"}</span>
        <span className="truncate">{subject || "No subject"}</span>
      </Accordion.Trigger>
      <Accordion.Content>
        <div className="bg-white text-black">
          <Letter html={html || text || ""} text={text} rewriteExternalResources={(url) => `https://wsrv.nl/?url=${url}`} />
        </div>
      </Accordion.Content>
    </Accordion.Item>
  )
}

function getRandomEmailDomain(emailDomains: string[]) {
  return emailDomains[Math.floor(Math.random() * emailDomains.length)];
}

const emailDomains: string[] = import.meta.env.VITE_EMAIL_DOMAINS.split(',');
export async function loader() {
  return {
    username: faker.internet.username().toLowerCase(),
    emailDomain: getRandomEmailDomain(emailDomains),
  };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const { username: randomUsername, emailDomain: randomEmailDomain } = loaderData;
  const [username, setUsername] = useState(randomUsername);
  const debouncedUsername = useDebounce(username, 400);
  const [emailDomain, setEmailDomain] = useState(randomEmailDomain);

  const [copied, setCopied] = useState(false);

  const { isPending, error, data } = useQuery<Email[]>({
    queryKey: ['emails', debouncedUsername, emailDomain],
    queryFn: () => {
      if (!debouncedUsername) {
        return Promise.resolve([]);
      }
      return fetch(`${import.meta.env.VITE_API_ENDPOINT}/emails/${debouncedUsername}@${emailDomain}`).then((res) =>
        res.json(),
      );
    },
    refetchInterval: 7000
  })

  return (
    <>
      <div className="my-9 mx-2">
        <div className="space-y-2 text-center w-[80%] md:w-2/3 mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold">Free, disposable email addresses</h1>
          <p className="text-xl">For annoying newsletters, websites, and everything in between! Protect your privacy and avoid spam with temporary email addresses.</p>
        </div>
        <div className="flex gap-2 justify-center items-center w-full md:w-1/2 mx-auto mb-2.5 mt-6">
          <input type="text" className="h-12 bg-surface0 mx-auto p-4 w-full focus:border-none focus:outline-none focus:ring-[1px] focus:ring-mauve rounded" placeholder="Enter your email address" value={username} onChange={(e) => setUsername(e.target.value)} />
          <select name="email-domain" className="h-12 bg-surface0 mx-auto p-4 w-full focus:border-none focus:outline-none focus:ring-[1px] focus:ring-mauve rounded" value={emailDomain} onChange={(e) => setEmailDomain(e.target.value)}>
            {emailDomains.map((domain) => (
              <option key={domain} value={domain}>@{domain}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-4 text-overlay1 justify-center items-center md:w-1/3 mx-auto">
          <button className="flex items-center space-x-2" onClick={() => {
            navigator.clipboard.writeText(debouncedUsername + "@" + emailDomain);
            setCopied(true);
            setTimeout(() => {
              setCopied(false);
            }, 1000);
          }}>
            {copied ? (
              <CopyCheck size={16} />
            ) : (
              <Copy size={16} />
            )}
            <span>{copied ? 'Copied!' : 'Copy email'}</span>
          </button>
          <button className="flex items-center space-x-2" onClick={() => {
            setUsername(faker.internet.username().toLowerCase());
            setEmailDomain(getRandomEmailDomain(emailDomains));
          }}>
            <RefreshCcw size={16} />
            <span>Generate new email</span>
          </button>
        </div>
      </div>

      <div>
        {isPending && <p className="text-center mt-8">Loading...</p>}
        {error && <p className="text-center py-5 bg-red-500">Error: {error.message}</p>}
        {data && data.length > 0 ? (
          <>
            <Accordion.Root type="multiple" className="w-full md:w-1/2 rounded mx-auto">
              {data.map((email) => (
                <Email key={email.id} email={email} />
              ))}
            </Accordion.Root>
            <div className="mb-4 md:mb-8" /></>
        ) : <div className="text-center py-5 bg-surface0">No emails found for {debouncedUsername}@{emailDomain}</div>}
      </div>
    </>
  );
}
