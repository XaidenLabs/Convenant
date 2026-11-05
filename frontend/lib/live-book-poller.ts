/**
 * Shared continuous live-book poller.
 * - One in-flight fetch at a time (no request pile-up)
 * - Keeps last good snapshot on transient errors
 * - Pauses while the tab is hidden, resumes immediately on focus
 * - Backs off on repeated failures, then recovers to base interval
 */

import { LiveBookSnapshot, fetchLiveBook } from "@/lib/live-book";

export type LiveBookPollerStatus = {
  snapshot: LiveBookSnapshot | null;
  loading: boolean;
  refreshing: boolean;
  consecutiveErrors: number;
  nextPollAt: number;
  polling: boolean;
  paused: boolean;
};

type Listener = (status: LiveBookPollerStatus) => void;

const BASE_INTERVAL_MS = 8_000;
const MAX_INTERVAL_MS = 60_000;

class LiveBookPoller {
  private listeners = new Set<Listener>();
  private snapshot: LiveBookSnapshot | null = null;
  private loading = false;
  private refreshing = false;
  private consecutiveErrors = 0;
  private polling = false;
  private paused = false;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private inFlight: AbortController | null = null;
  private started = false;
  private nextPollAt = 0;

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.getStatus());
    this.ensureStarted();
    return () => {
      this.listeners.delete(listener);
      if (this.listeners.size === 0) this.stop();
    };
  }

  getStatus(): LiveBookPollerStatus {
    return {
      snapshot: this.snapshot,
      loading: this.loading && !this.snapshot,
      refreshing: this.refreshing,
      consecutiveErrors: this.consecutiveErrors,
      nextPollAt: this.nextPollAt,
      polling: this.polling,
      paused: this.paused,
    };
  }

  /** Manual refresh from UI — still serialized with the poll loop. */
  async refreshNow(): Promise<void> {
    this.ensureStarted();
    // Force fetch even while the tab is paused/hidden.
    await this.tick(true, true);
  }

  private emit() {
    const status = this.getStatus();
    for (const listener of this.listeners) listener(status);
  }

  private ensureStarted() {
    if (this.started) return;
    this.started = true;
    this.polling = true;
    this.paused = typeof document !== "undefined" && document.hidden;
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", this.onVisibility);
    }
    if (typeof window !== "undefined") {
      window.addEventListener("focus", this.onFocus);
    }
    void this.tick(false);
  }

  private stop() {
    this.started = false;
    this.polling = false;
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    this.inFlight?.abort();
    this.inFlight = null;
    if (typeof document !== "undefined") {
      document.removeEventListener("visibilitychange", this.onVisibility);
    }
    if (typeof window !== "undefined") {
      window.removeEventListener("focus", this.onFocus);
    }
  }

  private onVisibility = () => {
    this.paused = document.hidden;
    this.emit();
    if (!document.hidden) {
      void this.tick(true);
    }
  };

  private onFocus = () => {
    if (!document.hidden) void this.tick(true);
  };

  private schedule(delayMs: number) {
    if (this.timer) clearTimeout(this.timer);
    this.nextPollAt = Date.now() + delayMs;
    this.emit();
    this.timer = setTimeout(() => {
      void this.tick(true);
    }, delayMs);
  }

  private async tick(soft: boolean, force = false) {
    if (!this.started) return;
    if (this.paused && !force) {
      // Stay quiet while hidden; visibilitychange will force a tick on return.
      this.nextPollAt = 0;
      this.emit();
      return;
    }
    if (this.inFlight) {
      // A fetch is already running; schedule another pass after base interval.
      this.schedule(BASE_INTERVAL_MS);
      return;
    }

    const controller = new AbortController();
    this.inFlight = controller;
    if (soft || this.snapshot) this.refreshing = true;
    else this.loading = true;
    this.emit();

    try {
      const snap = await fetchLiveBook(controller.signal);
      if (controller.signal.aborted || !this.started) return;

      if (snap.error && this.snapshot) {
        // Keep last good book; surface error + backoff.
        this.consecutiveErrors += 1;
        this.snapshot = {
          ...this.snapshot,
          error: snap.error,
          fetched_at_ms: Date.now(),
        };
      } else {
        this.snapshot = snap;
        this.consecutiveErrors = snap.error ? this.consecutiveErrors + 1 : 0;
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      if (!this.started) return;
      this.consecutiveErrors += 1;
      if (this.snapshot) {
        this.snapshot = {
          ...this.snapshot,
          error: err instanceof Error ? err.message : String(err),
          fetched_at_ms: Date.now(),
        };
      } else {
        this.snapshot = {
          contract_id: "",
          network: "",
          fetched_at_ms: Date.now(),
          intents: [],
          error: err instanceof Error ? err.message : String(err),
        };
      }
    } finally {
      // Only clear our own flight — a remount may have started a newer fetch.
      if (this.inFlight === controller) {
        this.inFlight = null;
      }
      this.loading = false;
      this.refreshing = false;
      if (!this.started) {
        this.emit();
        return;
      }
      this.emit();
      if (this.paused && !force) {
        this.nextPollAt = 0;
        this.emit();
        return;
      }
      const delay = Math.min(
        MAX_INTERVAL_MS,
        BASE_INTERVAL_MS * Math.pow(2, Math.min(this.consecutiveErrors, 3))
      );
      // Successful polls stay on the base cadence.
      this.schedule(this.consecutiveErrors === 0 ? BASE_INTERVAL_MS : delay);
    }
  }
}

declare global {
  // Persist across HMR in dev so we don't spawn duplicate pollers.
  // eslint-disable-next-line no-var
  var __covenantLiveBookPoller: LiveBookPoller | undefined;
}

export const liveBookPoller: LiveBookPoller =
  globalThis.__covenantLiveBookPoller ||
  (globalThis.__covenantLiveBookPoller = new LiveBookPoller());

export const LIVE_BOOK_BASE_INTERVAL_MS = BASE_INTERVAL_MS;
