import { randUserName } from "@ngneat/falso";

export interface Email {
  email: {
    mail_from: string;
    rcpt_to: string[];
    data: string;
    id: string;
  };
  timestamp: string;
}

export const emailDomains: string[] = import.meta.env.VITE_EMAIL_DOMAINS.split(
  ","
);

export function getRandomEmail() {
  const emailDomain =
    emailDomains[Math.floor(Math.random() * emailDomains.length)];
  return `${randUserName({ withAccents: false }).toLowerCase()}@${emailDomain}`;
}
