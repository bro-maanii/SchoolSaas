/**
 * Mirrors apps/api/src/lib/notification-template.ts's resolveTemplate exactly
 * — same algorithm, same {{variable}} syntax — so the broadcast composer can
 * render a live preview locally as the admin types, without a round trip per
 * keystroke. The actual send always resolves server-side from live data.
 */
export function resolveTemplate(bodyText: string, variables: Record<string, string>) {
  return bodyText.replace(/{{\s*(\w+)\s*}}/g, (match, key) => variables[key] ?? match);
}
