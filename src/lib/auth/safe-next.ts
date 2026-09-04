/**
 * Where to send someone after they sign in.
 *
 * Sign-in is nearly always an interruption: someone pressed "Save" or opened
 * their order history and was sent to /login first. The page they wanted is
 * carried in `?next=` and returned to afterwards.
 *
 * ONLY A SAME-SITE PATH IS HONOURED. An absolute URL in that parameter is the
 * open redirect that turns a shop's sign-in page into a credible phishing hop:
 * the link really does start at khawajacollection.com, and the victim lands
 * somewhere else with the shop's name still in their head. A leading `//` is
 * protocol-relative and also leaves the site, so "one slash followed by a
 * non-slash" is the whole rule.
 */
export function safeNext(raw: string | null | undefined): string {
  if (!raw) return "/account";
  if (!/^\/[^/]/.test(raw)) return "/account";
  return raw;
}
