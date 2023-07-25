import type { Handle } from "@sveltejs/kit";

// Enable cross-origin isolation to use `SharedArrayBuffer`
// https://developer.chrome.com/blog/enabling-shared-array-buffer/
export const handle: Handle = async ({ event, resolve }) => {
  event.setHeaders({
    "Cross-Origin-Embedder-Policy": "require-corp",
    "Cross-Origin-Opener-Policy": "same-origin",
  });
  return resolve(event);
};
