import { useRef, useCallback } from "react";

/**
 * Drip-feed streaming display hook.
 * 
 * Splits large model chunks into word-level pieces and drains them
 * into the UI at ~20-30ms intervals for a ChatGPT-like progressive effect.
 * 
 * The hook manages a display queue separate from the actual full response,
 * ensuring persisted content is always the exact model output.
 */

interface StreamingDisplayOptions {
  /** Base interval between word drips in ms (default: 22) */
  baseInterval?: number;
  /** When queue exceeds this many words, speed up (default: 15) */
  speedUpThreshold?: number;
  /** Fastest interval when catching up in ms (default: 8) */
  minInterval?: number;
  /** Interval for final drain flush in ms (default: 6) */
  drainInterval?: number;
}

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  isError?: boolean;
}

export function useStreamingDisplay(
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
  options: StreamingDisplayOptions = {}
) {
  const {
    baseInterval = 18,
    speedUpThreshold = 12,
    minInterval = 6,
    drainInterval = 4,
  } = options;

  // Queue of word-level chunks waiting to be displayed
  const wordQueueRef = useRef<string[]>([]);
  // Timer for drip-feed scheduling
  const dripTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Whether the backend stream has completed
  const streamDoneRef = useRef(false);
  // Whether we've created the initial assistant message
  const hasStartedRef = useRef(false);
  // Full response for persistence (exact model output)
  const fullResponseRef = useRef("");
  // What we've displayed so far
  const displayedLengthRef = useRef(0);

  /**
   * Append displayed text to the last assistant message in state.
   * Uses functional update to avoid stale closures.
   */
  const appendToDisplay = useCallback((text: string) => {
    if (!text) return;
    setMessages((prev) => {
      const last = prev[prev.length - 1];
      if (last?.role === "assistant" && !last.isError) {
        const updated = { ...last, content: last.content + text };
        const next = prev.slice(0, -1);
        next.push(updated);
        return next;
      }
      // Create new assistant message if none exists
      return [
        ...prev,
        {
          id: Date.now().toString(),
          content: text,
          role: "assistant" as const,
          timestamp: new Date(),
        },
      ];
    });
  }, [setMessages]);

  /**
   * Process the next word from the queue
   */
  const processNext = useCallback(() => {
    dripTimerRef.current = null;

    if (wordQueueRef.current.length === 0) {
      return;
    }

    const queueLen = wordQueueRef.current.length;
    const isDraining = streamDoneRef.current;
    const displayed = displayedLengthRef.current;

    // First-token acceleration: emit more words initially for perceived responsiveness
    const isFirstBurst = displayed < 60;

    let wordsPerTick = 1;
    if (isDraining) {
      wordsPerTick = Math.min(5, queueLen);
    } else if (isFirstBurst) {
      // Faster start: emit 3-4 words at once for the first ~60 chars
      wordsPerTick = Math.min(4, queueLen);
    } else if (queueLen > speedUpThreshold * 2) {
      wordsPerTick = 3;
    } else if (queueLen > speedUpThreshold) {
      wordsPerTick = 2;
    }

    const words = wordQueueRef.current.splice(0, wordsPerTick);
    const text = words.join("");
    displayedLengthRef.current += text.length;
    appendToDisplay(text);

    // Schedule next tick if queue has more
    if (wordQueueRef.current.length > 0) {
      let interval: number;
      if (isDraining) {
        interval = drainInterval;
      } else if (isFirstBurst) {
        // Faster initial rendering for perceived responsiveness
        interval = Math.round(baseInterval * 0.4);
      } else if (queueLen > speedUpThreshold * 2) {
        interval = minInterval;
      } else if (queueLen > speedUpThreshold) {
        interval = Math.round(baseInterval * 0.6);
      } else {
        interval = baseInterval;
      }
      dripTimerRef.current = setTimeout(processNext, interval);
    }
  }, [appendToDisplay, baseInterval, speedUpThreshold, minInterval, drainInterval]);

  /**
   * Ensure the drip timer is running
   */
  const ensureDripping = useCallback(() => {
    if (dripTimerRef.current !== null) return; // already scheduled
    if (wordQueueRef.current.length === 0) return; // nothing to drip
    // Start immediately on first word
    processNext();
  }, [processNext]);

  /**
   * Split a chunk into word-level units preserving whitespace.
   * Each "word" includes its trailing space so reconstruction is exact.
   * Newlines are preserved as separate tokens.
   */
  const splitChunk = (chunk: string): string[] => {
    if (!chunk) return [];
    // Split preserving spaces and newlines as part of tokens
    // Match: newline, or word+trailing-spaces
    const tokens: string[] = [];
    const regex = /(\n)|([^\s\n]+\s*)/g;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(chunk)) !== null) {
      tokens.push(match[0]);
    }
    return tokens;
  };

  /**
   * Called for each incoming SSE delta chunk.
   * Splits the chunk into words and queues them for progressive display.
   */
  const enqueueChunk = useCallback((chunk: string) => {
    if (!chunk) return;
    fullResponseRef.current += chunk;

    // Create initial empty assistant message on first chunk
    if (!hasStartedRef.current) {
      hasStartedRef.current = true;
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          content: "",
          role: "assistant" as const,
          timestamp: new Date(),
        },
      ]);
    }

    const words = splitChunk(chunk);
    wordQueueRef.current.push(...words);
    ensureDripping();
  }, [setMessages, ensureDripping]);

  /**
   * Called when the backend stream completes.
   * Returns a promise that resolves when all queued words have been displayed.
   */
  const finalize = useCallback((): Promise<string> => {
    streamDoneRef.current = true;
    const fullResponse = fullResponseRef.current;

    return new Promise((resolve) => {
      const checkDone = () => {
        if (wordQueueRef.current.length === 0 && dripTimerRef.current === null) {
          // Ensure final content exactly matches full response
          // (protect against any tiny whitespace drift)
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last?.role === "assistant" && !last.isError && last.content !== fullResponse) {
              const next = prev.slice(0, -1);
              next.push({ ...last, content: fullResponse });
              return next;
            }
            return prev;
          });
          resolve(fullResponse);
        } else {
          // Speed up drain if still going
          if (dripTimerRef.current === null && wordQueueRef.current.length > 0) {
            processNext();
          }
          setTimeout(checkDone, 10);
        }
      };
      checkDone();
    });
  }, [setMessages, processNext]);

  /**
   * Reset all state for a new streaming session.
   */
  const reset = useCallback(() => {
    if (dripTimerRef.current !== null) {
      clearTimeout(dripTimerRef.current);
      dripTimerRef.current = null;
    }
    wordQueueRef.current = [];
    streamDoneRef.current = false;
    hasStartedRef.current = false;
    fullResponseRef.current = "";
    displayedLengthRef.current = 0;
  }, []);

  /**
   * Check if drip-feed is still actively displaying
   */
  const isActive = useCallback(() => {
    return hasStartedRef.current && (
      wordQueueRef.current.length > 0 || dripTimerRef.current !== null
    );
  }, []);

  /**
   * Abort and clean up (e.g., on unmount or user abort)
   */
  const abort = useCallback(() => {
    if (dripTimerRef.current !== null) {
      clearTimeout(dripTimerRef.current);
      dripTimerRef.current = null;
    }
    // Flush any remaining words immediately
    if (wordQueueRef.current.length > 0) {
      const remaining = wordQueueRef.current.join("");
      wordQueueRef.current = [];
      appendToDisplay(remaining);
    }
    // Ensure content matches full response
    const fullResponse = fullResponseRef.current;
    if (fullResponse) {
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant" && !last.isError && last.content !== fullResponse) {
          const next = prev.slice(0, -1);
          next.push({ ...last, content: fullResponse });
          return next;
        }
        return prev;
      });
    }
  }, [appendToDisplay, setMessages]);

  return {
    enqueueChunk,
    finalize,
    reset,
    isActive,
    abort,
    /** Direct access to the full accumulated response (for persistence) */
    getFullResponse: () => fullResponseRef.current,
  };
}
