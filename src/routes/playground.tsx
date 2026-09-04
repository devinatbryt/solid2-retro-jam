import type { ParentProps } from 'solid-js';

// Layout route: pairing playground.tsx with the playground/ directory nests
// every page under this shell.
export default function PlaygroundLayout(props: ParentProps) {
  return (
    <main class="mx-auto max-w-3xl p-6 pb-32">
      <header class="mb-6">
        <h1 class="text-2xl font-semibold tracking-tight">Playground</h1>
        <p class="mt-1 text-sm text-muted">
          Every primitive you need, demonstrated once, on a domain that is{' '}
          <em>not</em> the retro board. Read it, then write your own.
        </p>
      </header>

      <nav class="mb-8 flex flex-wrap gap-2 text-sm">
        <PlaygroundLink href="/playground">Index</PlaygroundLink>
        <PlaygroundLink href="/playground/live">Live</PlaygroundLink>
        <PlaygroundLink href="/playground/optimistic">Optimistic</PlaygroundLink>
        <PlaygroundLink href="/playground/async">Async</PlaygroundLink>
      </nav>

      {props.children}
    </main>
  );
}

function PlaygroundLink(props: ParentProps<{ href: string }>) {
  return (
    <a
      href={props.href}
      class="rounded-lg border border-line px-3 py-1.5 font-medium text-muted hover:border-accent hover:text-white"
    >
      {props.children}
    </a>
  );
}
