import type { Route } from "./+types/home";
import type { Email } from "../email";

import { Letter } from 'react-letter';
import { extract } from 'letterparser';

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useDebounce } from "@uidotdev/usehooks";

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

export default function Home() {
  const [username, setUsername] = useState('');
  const debouncedUsername = useDebounce(username, 400);

  const emailDomains: string[] = import.meta.env.VITE_EMAIL_DOMAINS.split(',');
  const [emailDomain, setEmailDomain] = useState(emailDomains[0]);

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
      <div className="my-9">
        <div className="space-y-2 text-center w-[80%] md:w-2/3 mx-auto">
          <h1 className="text-6xl font-bold">Free, disposable email addresses</h1>
          <p className="text-xl">For annoying newsletters, websites, and everything in between! Protect your privacy and avoid spam with temporary email addresses.</p>
        </div>
        <div className="flex justify-center items-center w-1/3 mx-auto">
          <input type="text" className="h-12 mx-auto mt-6 p-4 focus:border-none focus:outline-none focus:ring-[1px] focus:ring-mauve rounded" placeholder="Enter your email address" onChange={(e) => setUsername(e.target.value)} />
          <select name="email-domain" className="h-12 mx-auto mt-6 p-4 focus:border-none focus:outline-none focus:ring-[1px] focus:ring-mauve rounded" value={emailDomain} onChange={(e) => setEmailDomain(e.target.value)}>
            {emailDomains.map((domain) => (
              <option key={domain} value={domain} onChange={(e) => setEmailDomain(domain)}>@{domain}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isPending && <p>Loading...</p>}
        {error && <p>Error: {error.message}</p>}
        {data && data.map((email) => (
          <Email email={email} key={email.id} />
        ))}
      </div>
    </>
  );
}
