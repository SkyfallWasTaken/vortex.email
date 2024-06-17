import { writable } from "@macfja/svelte-persistent-store"
import { faker } from "@faker-js/faker"

export let username = writable("username", faker.internet.userName().toLocaleLowerCase())