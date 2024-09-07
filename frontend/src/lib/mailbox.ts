import { writable } from '@macfja/svelte-persistent-store';
import { faker } from '@faker-js/faker';

export const emailDomains = (import.meta.env.VITE_EMAIL_DOMAINS as string).split(',');
export const username = writable('username', faker.internet.userName().toLocaleLowerCase());
export const emailDomain = writable(
	'email-domain',
	emailDomains[Math.floor(Math.random() * emailDomains.length)]
);
