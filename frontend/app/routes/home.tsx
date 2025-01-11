import type { Route } from "./+types/home";
import type { Email } from "../email";

import { Letter } from 'react-letter';
import { extract } from 'letterparser';
import { Copy, CopyCheck, RefreshCcw } from 'lucide-react';

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useDebounce, useCopyToClipboard } from "@uidotdev/usehooks";
import { fakerEN as faker } from '@faker-js/faker';

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "Vortex - Free, disposable email addresses" },
    { name: "description", content: "Free, disposable email addresses for annoying newsletters, websites, and everything in between! Protect your privacy and avoid spam with temporary email addresses." },
  ];
}

export function Email({ email }: { email: Email }) {
  const { html, text } = extract(email.data);

  return (
    <div className="bg-white">
      <Letter html={html || text || ""} text={text} rewriteExternalResources={(url) => `https://wsrv.nl/?url=${url}`} />
    </div>
  )
}

function getRandomEmailDomain(emailDomains: string[]) {
  return emailDomains[Math.floor(Math.random() * emailDomains.length)];
}

export default function Home() {
  const [username, setUsername] = useState(faker.internet.username().toLowerCase());
  const debouncedUsername = useDebounce(username, 400);

  const emailDomains: string[] = import.meta.env.VITE_EMAIL_DOMAINS.split(',');
  const randomDomain = getRandomEmailDomain(emailDomains);
  const [emailDomain, setEmailDomain] = useState(randomDomain);

  const [copied, setCopied] = useState(false);

  const { isPending, error, data } = useQuery<Email[]>({
    queryKey: ['emails', debouncedUsername, emailDomain],
    queryFn: () => {
      if (!debouncedUsername) {
        return Promise.resolve([]);
      }
      return fetch(`https://api.vortex.skyfall.dev/emails/${debouncedUsername}@${emailDomain}`).then((res) =>
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
          <input type="text" className="h-12 mx-auto p-4 w-full focus:border-none focus:outline-none focus:ring-[1px] focus:ring-mauve rounded" placeholder="Enter your email address" value={username} onChange={(e) => setUsername(e.target.value)} />
          <select name="email-domain" className="h-12 mx-auto p-4 w-full focus:border-none focus:outline-none focus:ring-[1px] focus:ring-mauve rounded" value={emailDomain} onChange={(e) => setEmailDomain(e.target.value)}>
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
        {error && <p className="text-center mt-8 text-red-500">Error: {error.message}</p>}
        {data && data.length > 0 ? (
          data.map((email) => (
            <Email key={email.id} email={email} />
          ))
        ) : <div className="text-center py-5 bg-surface0">No emails found for {debouncedUsername}@{emailDomain}</div>}
      </div>
    </>
  );
}
