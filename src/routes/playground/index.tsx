import { Title } from '@solidjs/meta';

export default function PlaygroundIndex() {
  return (
    <section class="space-y-4">
      <Title>Playground - Solid 2 Retro Jam</Title>

      <Card
        href="/playground/live"
        title="Live"
        body="liveQuery over an async generator, the server-side fan-out bus, and connection status. Open this page in two windows."
        shows="liveQuery · status() · async generator server function · request.signal cleanup"
      />
      <Card
        href="/playground/optimistic"
        title="Optimistic"
        body="A write that shows its result before the server has agreed to it, and takes it back when the server refuses. Turn failure rate up first."
        shows="action(function*) · createOptimisticStore · the await/yield trap · refresh()"
      />
      <Card
        href="/playground/async"
        title="Async"
        body="Async lives in computations now. No createResource, no Suspense, no startTransition."
        shows="<Loading on={}> · <Errored> · isPending() · latest()"
      />

      <p class="pt-4 text-sm text-muted">
        None of these are the retro board. See <code class="text-white">SPEC.md</code>{' '}
        for what you are actually building, and{' '}
        <code class="text-white">PRIMITIVES.md</code> for the menu of things you
        can reach for.
      </p>
    </section>
  );
}

function Card(props: {
  href: string;
  title: string;
  body: string;
  shows: string;
}) {
  return (
    <a
      href={props.href}
      class="block rounded-xl border border-line bg-surface-2 p-5 transition-colors hover:border-accent"
    >
      <h2 class="mb-1 font-semibold">{props.title}</h2>
      <p class="mb-3 text-sm text-muted">{props.body}</p>
      <p class="font-mono text-xs text-accent">{props.shows}</p>
    </a>
  );
}
