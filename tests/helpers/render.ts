/**
 * Helpers for inspecting the output of a server component.
 *
 * The page components are async functions returning a React element tree.
 * Instead of rendering them (which would need a React renderer), the tree is
 * walked and every string it contains is collected. If a secret of another
 * client appears in that list, the page leaked data.
 */
export function collectStrings(node: unknown, out: string[] = []): string[] {
  if (node === null || node === undefined || typeof node === "boolean") {
    return out;
  }

  if (typeof node === "string") {
    out.push(node);
    return out;
  }

  if (typeof node === "number") {
    out.push(String(node));
    return out;
  }

  if (Array.isArray(node)) {
    for (const child of node) collectStrings(child, out);
    return out;
  }

  if (typeof node === "object") {
    const element = node as { props?: { children?: unknown } };
    if (element.props) collectStrings(element.props.children, out);
    return out;
  }

  return out;
}

/** All strings rendered by a server component. */
export async function renderStrings(component: () => Promise<unknown>) {
  const element = await component();
  return collectStrings(element);
}

/** True when the rendered output contains the given text. */
export function containsText(strings: string[], needle: string): boolean {
  return strings.some((s) => s.includes(needle));
}
