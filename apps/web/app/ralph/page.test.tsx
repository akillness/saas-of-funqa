import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { getDictionary } from "../../lib/i18n";
import RalphPage from "./page";

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: () => undefined
  }),
  headers: async () => new Headers({ "x-funqa-locale": "en" })
}));

describe("/ralph route page", () => {
  it("renders /ralph?lang=ko without 404 in the Korean localized route flow", async () => {
    const route = new URL("https://funqa.test/ralph?lang=ko");
    const koCopy = getDictionary("ko").ralph;
    const markup = renderToStaticMarkup(
      await RalphPage({
        searchParams: Promise.resolve(Object.fromEntries(route.searchParams))
      })
    );

    expect(route.pathname).toBe("/ralph");
    expect(route.searchParams.get("lang")).toBe("ko");
    expect(markup).toContain(koCopy.title);
    expect(markup).toContain(koCopy.statusCard.title);
    expect(markup).not.toContain("404");
  });

  it("renders from the default request locale flow", async () => {
    const markup = renderToStaticMarkup(
      await RalphPage({ searchParams: Promise.resolve({}) })
    );

    expect(markup).toContain("Ralph completion loop");
    expect(markup).toContain("Spec-first loop status");
    expect(markup).not.toContain("404");
  });

  it.each([
    {
      locale: "en",
      absentLocale: "ko"
    },
    {
      locale: "ko",
      absentLocale: "en"
    }
  ] as const)("renders the $locale Ralph dictionary copy from search params", async ({ locale, absentLocale }) => {
    const selectedCopy = getDictionary(locale).ralph;
    const absentCopy = getDictionary(absentLocale).ralph;
    const markup = renderToStaticMarkup(
      await RalphPage({ searchParams: Promise.resolve({ lang: locale }) })
    );

    expect(markup).toContain(selectedCopy.eyebrow);
    expect(markup).toContain(selectedCopy.statusCard.title);
    expect(markup).toContain(selectedCopy.handoffAction);
    expect(markup).not.toContain(absentCopy.eyebrow);
    expect(markup).not.toContain("404");
  });

  it("renders Korean user-visible copy from the Korean selected dictionary", async () => {
    const koCopy = getDictionary("ko").ralph;
    const enCopy = getDictionary("en").ralph;
    const markup = renderToStaticMarkup(
      await RalphPage({ searchParams: Promise.resolve({ lang: "ko" }) })
    );

    expect(markup).toContain(koCopy.title);
    expect(markup).toContain(koCopy.lede);
    expect(markup).toContain(koCopy.statusCard.metrics[0].text);
    expect(markup).toContain(koCopy.loopSteps[0].title);
    expect(markup).toContain(koCopy.guardrails[0]);
    expect(markup).toContain(koCopy.evidenceRows[0].purpose);
    expect(markup).not.toContain(enCopy.title);
  });
});
