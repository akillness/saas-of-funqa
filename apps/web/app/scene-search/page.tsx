import type { Metadata } from "next";
import { getDictionary, resolveLocale, withLocale } from "../../lib/i18n";
import { getRequestLocale } from "../../lib/i18n-server";
import { SceneSearchClient } from "./scene-search-client";

export const metadata: Metadata = {
  title: "Video Evidence Search | FunQA",
  description:
    "Search reviewed video-analysis pairs and inspect timestamped frames, retrieval evidence, and grounded answers."
};

type SceneSearchPageProps = {
  searchParams?: Promise<{
    lang?: string;
    q?: string;
  }>;
};

export default async function SceneSearchPage({ searchParams }: SceneSearchPageProps) {
  const params = await searchParams;
  const locale = params?.lang ? resolveLocale(params.lang) : await getRequestLocale();
  const t = getDictionary(locale);

  return (
    <SceneSearchClient
      initialQuery={params?.q?.trim() ?? ""}
      locale={locale}
      loginHref={withLocale("/login", locale)}
      t={t.sceneLab}
    />
  );
}
