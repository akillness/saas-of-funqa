import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/game-log-search-client", () => ({
  cancelGameLogSearch: vi.fn(),
  createUuidV7: () => "01890f26-6b40-7abc-8def-1234567890ab",
  getGameLogSearchHealth: vi.fn(),
  streamGameLogSearch: vi.fn()
}));

import { useGameLogSearch } from "./use-game-log-search";

function InitialHealthTimestamp() {
  const { health } = useGameLogSearch();

  return createElement("time", { dateTime: health.retrieval.checked_at }, health.retrieval.checked_at);
}

describe("useGameLogSearch hydration", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("keeps the initial health timestamp stable across server and client clocks", () => {
    vi.useFakeTimers();
    vi.setSystemTime("2026-08-09T12:00:00.000Z");
    const serverMarkup = renderToStaticMarkup(createElement(InitialHealthTimestamp));

    vi.setSystemTime("2026-08-09T12:00:01.000Z");
    const clientMarkup = renderToStaticMarkup(createElement(InitialHealthTimestamp));

    expect(clientMarkup).toBe(serverMarkup);
  });
});
