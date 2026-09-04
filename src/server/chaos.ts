// The Chaos Panel's engine.
//
// Why this exists: on localhost every server function resolves in ~1ms, which
// makes optimistic UI, <Loading> fallbacks, isPending and error boundaries all
// completely invisible. You cannot teach them against a fast server. Turn
// latency up to 2000ms and the difference between "an optimistic write" and
// "a pending read" stops being theoretical.
//
// State is module-scope and process-wide on purpose: both of your windows
// share one server, so one slider moves the world for both. It resets when the
// dev server restarts, which is the correct behaviour for a demo knob.
import 'server-only';

import { createBus } from './bus';

export interface ChaosSettings {
  /** Artificial delay applied to every guarded call, in ms. */
  latencyMs: number;
  /** Probability (0..1) that a guarded WRITE throws instead of succeeding. */
  failureRate: number;
}

export const CHAOS_DEFAULTS: ChaosSettings = { latencyMs: 0, failureRate: 0 };

/** Broadcast so every open window's panel agrees on the current settings. */
export const chaosBus = createBus<ChaosSettings>({ ...CHAOS_DEFAULTS });

export function getChaos(): ChaosSettings {
  return chaosBus.current();
}

export function setChaos(next: Partial<ChaosSettings>): ChaosSettings {
  const merged: ChaosSettings = {
    latencyMs: clamp(next.latencyMs ?? getChaos().latencyMs, 0, 5000),
    failureRate: clamp(next.failureRate ?? getChaos().failureRate, 0, 1),
  };
  chaosBus.publish(merged);
  return merged;
}

/** Thrown by `chaos()` when the dice say so. Distinguishable from real bugs. */
export class ChaosError extends Error {
  readonly chaos = true;
  constructor(label: string) {
    super(`Chaos monkey rejected "${label}". This failure is deliberate.`);
    this.name = 'ChaosError';
  }
}

/**
 * Guard a READ: applies latency only. Reads that randomly explode make the
 * app impossible to reason about; failure is reserved for writes.
 */
export async function chaosRead(): Promise<void> {
  const { latencyMs } = getChaos();
  if (latencyMs > 0) await sleep(jitter(latencyMs));
}

/**
 * Guard a WRITE: applies latency, then may throw. Call it at the TOP of a
 * mutation, before touching any state, so a rejection leaves the server
 * untouched and the client's optimistic value is the only thing to revert.
 */
export async function chaosWrite(label: string): Promise<void> {
  const { latencyMs, failureRate } = getChaos();
  if (latencyMs > 0) await sleep(jitter(latencyMs));
  if (failureRate > 0 && Math.random() < failureRate) throw new ChaosError(label);
}

/** ±15% so repeated calls do not arrive in lockstep. */
function jitter(ms: number): number {
  return Math.round(ms * (0.85 + Math.random() * 0.3));
}

function clamp(n: number, min: number, max: number): number {
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : min;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
