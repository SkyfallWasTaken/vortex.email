// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
export const debounce = (callback: Function, wait = 300) => {
	let timeout: ReturnType<typeof setTimeout>;

	return (...args: unknown[]) => {
		clearTimeout(timeout);
		timeout = setTimeout(() => callback(...args), wait);
	};
};
