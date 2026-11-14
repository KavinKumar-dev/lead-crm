/**
 * Shared cookie store for the mocked `next/headers`.
 *
 * The server actions and route handlers read the session from the cookie
 * jar. Outside a Next.js request there is no cookie jar, so the tests
 * provide one and set it per test.
 *
 * The store lives on globalThis so it survives `vi.resetModules()` — every
 * module instance (the mock factory and the test helpers) then always talks
 * to the same jar.
 */
export interface CookieOptions {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: string;
  path?: string;
  expires?: Date;
}

interface Store {
  current: Record<string, string>;
  options: Record<string, CookieOptions>;
}

const globalScope = globalThis as unknown as { __testCookieStore?: Store };

export const cookieStore: Store =
  globalScope.__testCookieStore ??
  (globalScope.__testCookieStore = {
    current: {},
    options: {},
  });

export function setCookie(name: string, value: string, options?: CookieOptions) {
  cookieStore.current[name] = value;
  if (options) cookieStore.options[name] = options;
}

export function clearCookies() {
  cookieStore.current = {};
  cookieStore.options = {};
}
