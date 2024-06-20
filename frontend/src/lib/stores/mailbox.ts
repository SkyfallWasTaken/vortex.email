import { writable } from '@macfja/svelte-persistent-store';
import { faker } from '@faker-js/faker';

export const username = writable('username', faker.internet.userName().toLocaleLowerCase());
