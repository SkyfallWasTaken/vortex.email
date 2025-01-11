import type { Route } from "./+types/home";
import type { Email } from "../email";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useDebounce } from "@uidotdev/usehooks";

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "Vortex - Free, disposable email addresses" },
    { name: "description", content: "Free, disposable email addresses for annoying newsletters, websites, and everything in between! Protect your privacy and avoid spam with temporary email addresses." },
  ];
}

export default function Home() {
  const [username, setUsername] = useState('');
  const debouncedUsername = useDebounce(username, 400);

  const { isPending, error, data } = useQuery<Email[]>({
    queryKey: ['emails', debouncedUsername],
    queryFn: () => {
      if (!debouncedUsername) {
        return Promise.resolve([]);
      }
      return fetch(`https://api.vortex.skyfall.dev/emails/${debouncedUsername}@cosmos.jer.app`).then((res) =>
        res.json(),
      );
    },
    refetchInterval: 7000
  })

  return (
    <>
      <div className="space-y-2 text-center w-[80%] md:w-2/3 mx-auto mt-6">
        <h1 className="text-6xl font-bold">Free, disposable email addresses</h1>
        <p className="text-xl">For annoying newsletters, websites, and everything in between! Protect your privacy and avoid spam with temporary email addresses.</p>
      </div>
      <div>
        <input type="text" className="mx-auto mt-6 p-4 focus:border-none focus:outline-none focus:ring-[1px] focus:ring-mauve rounded" placeholder="Enter your email address" onChange={(e) => setUsername(e.target.value)} />
        <select name="email-domain" id="" className="mx-auto mt-6 p-4 focus:border-none focus:outline-none focus:ring-[1px] focus:ring-mauve rounded">
          <option value="gmail.com">gmail.com</option>
          <option value="outlook.com">outlook.com</option>
          <option value="yahoo.com">yahoo.com</option>
        </select>
        {isPending && <p>Loading...</p>}
        {error && <p>Error: {error.message}</p>}
        {data && data.map((email) => (
          <div key={email.id} className="mx-auto mt-6 p-4 border border-gray-200 rounded">
            <p>{email.mail_from}</p>
            <p>{email.rcpt_to}</p>
          </div>
        ))}
      </div>
    </>
  );
}
