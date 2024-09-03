import { writable } from '@macfja/svelte-persistent-store';
import { faker } from '@faker-js/faker';
import { browser } from '$app/environment';

export const username = (() => {
	if (browser) {
		return writable('username', faker.internet.userName().toLocaleLowerCase());
	}
})();
