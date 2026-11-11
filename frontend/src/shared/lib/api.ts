export const API_URL =
	import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:5021" : "");

/** Extracts `error` / `title` from a failed API response, falling back to short plain text. */
export const readErrorMessage = async (response: Response, fallback: string): Promise<string> => {
	try {
		const text = await response.text();
		if (!text) return fallback;
		try {
			const body = JSON.parse(text) as { error?: string; title?: string };
			if (body.error) return body.error;
			if (body.title) return body.title;
		} catch {
			/* plain text */
		}
		return text.length > 200 ? fallback : text;
	} catch {
		return fallback;
	}
};
