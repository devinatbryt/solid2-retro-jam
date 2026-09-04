import { Title } from '@solidjs/meta';
import { Errored, Loading } from 'solid-js';
import { env } from 'virtual:env/client';

import ChaosPanel from './components/ChaosPanel';
import { paths, Router } from './router';
import './App.css';

export default function App() {
  return (
    <Router>
      {(props) => (
        <>
          <Title>{env.VITE_APP_NAME}</Title>

          <nav class="flex items-center gap-1 border-b border-line bg-surface-2 px-4 py-3">
            <a
              href={paths()}
              class="rounded-lg px-3 py-1.5 font-semibold text-accent hover:bg-white/10"
            >
              Retro Board
            </a>
            <a
              href="/playground"
              class="rounded-lg px-3 py-1.5 font-semibold text-muted hover:bg-white/10 hover:text-white"
            >
              Playground
            </a>
            <span class="ml-auto text-xs text-muted">Solid 2.0 RC · pair jam</span>
          </nav>

          {/* <Errored> replaces 1.x <ErrorBoundary>. The fallback receives the
              error as an ACCESSOR plus a reset action; boundaries heal on
              their own, so there is no resetErrorBoundaries() any more. */}
          <Errored
            fallback={(error, reset) => (
              <main class="mx-auto max-w-2xl p-8 text-center">
                <h1 class="mb-2 text-xl font-semibold text-didnt-go-well">
                  Something threw
                </h1>
                <pre class="mb-4 overflow-x-auto rounded-lg border border-line bg-surface-2 p-4 text-left text-xs">
                  {String(error())}
                </pre>
                <button
                  type="button"
                  class="rounded-lg bg-accent px-4 py-2 font-semibold text-surface"
                  onClick={reset}
                >
                  Retry
                </button>
              </main>
            )}
          >
            {/* <Loading> replaces 1.x <Suspense>. Once content has rendered,
                revalidation keeps it on screen instead of flashing back to
                the fallback — use isPending() for in-flight indicators. */}
            <Loading
              fallback={<main class="p-8 text-center text-muted">Loading…</main>}
            >
              {props.children}
            </Loading>
          </Errored>

          {/* Its own boundary so a slow chaos stream never holds up the page. */}
          <Loading fallback={null}>
            <ChaosPanel />
          </Loading>
        </>
      )}
    </Router>
  );
}
