import { act, render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ExercisePlayer } from "@/components/toolbox/ExercisePlayer";
import type { Exercise } from "@/data/exercises";

let latestTtsOptions: { onStart?: () => void; onEnd?: () => void } = {};

const speakMock = vi.fn(() => {
  latestTtsOptions.onStart?.();
});
const stopMock = vi.fn();

vi.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    language: "en",
    getExerciseDisplay: (_id: string, data: any) => ({
      title: data.title,
      description: data.description,
      longDescription: data.longDescription,
      durationLabel: data.duration,
      steps: data.steps.map((step: { instruction: string }) => step.instruction),
      prompts: data.prompts ?? [],
    }),
  }),
}));

vi.mock("@/hooks/useVoiceSettings", () => ({
  useVoiceSettings: () => ({
    getVoiceId: () => "EXAVITQu4vr4xnSDxMaL",
    speed: 1.0,
  }),
}));

vi.mock("@/hooks/useElevenLabsTTS", () => ({
  useElevenLabsTTS: (options: { onStart?: () => void; onEnd?: () => void }) => {
    latestTtsOptions = options;
    return {
      speak: speakMock,
      stop: stopMock,
      isSpeaking: false,
      isLoading: false,
    };
  },
}));

const exercise: Exercise = {
  id: "test-exercise",
  title: "Test Exercise",
  description: "desc",
  longDescription: "long desc",
  duration: "1 min",
  durationSeconds: 60,
  icon: (() => null) as any,
  category: "breathing",
  color: "calm",
  steps: [
    { instruction: "Step one", duration: 1 },
    { instruction: "Step two", duration: 1 },
    { instruction: "Step three", duration: 1 },
  ],
  prompts: [],
};

describe("ExercisePlayer progression", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    latestTtsOptions = {};
    speakMock.mockClear();
    stopMock.mockClear();
    document.body.className = "";
  });

  it("waits for speech to finish and advances one step at a time", () => {
    const view = render(<ExercisePlayer exercise={exercise} onClose={vi.fn()} onComplete={vi.fn()} />);

    // Step counter shows "1" initially (framer-motion AnimatePresence blocks h2 swap in jsdom)
    expect(view.getByText(/1/)).toBeInTheDocument();
    expect(speakMock).toHaveBeenCalledTimes(1);

    // Progress bar needs to reach 100% (1s duration = 10 ticks × 100ms)
    act(() => {
      vi.advanceTimersByTime(1100);
    });

    // Speech still going — step counter should still show step 1
    expect(view.container.textContent).toContain("1");

    // End speech → triggers effect → queues advance after 900ms
    act(() => {
      latestTtsOptions.onEnd?.();
    });
    act(() => {
      vi.advanceTimersByTime(950);
    });

    // Step counter should now show "2"
    expect(view.container.textContent).toContain("2");
    expect(speakMock).toHaveBeenCalledTimes(2);

    // Repeat for step 3
    act(() => {
      vi.advanceTimersByTime(1100);
    });
    act(() => {
      latestTtsOptions.onEnd?.();
    });
    act(() => {
      vi.advanceTimersByTime(950);
    });

    // Step counter should now show "3"
    expect(view.container.textContent).toContain("3");
    expect(speakMock).toHaveBeenCalledTimes(3);
  });
});
