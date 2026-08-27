import type { Metadata } from "next";
import { getDictionary, resolveLocale, withLocale } from "../../lib/i18n";
import { getRequestLocale } from "../../lib/i18n-server";
import { SceneSearchClient } from "./scene-search-client";

export const metadata: Metadata = {
  title: "Scene Search | FunQA",
  description:
    "Multimodal RAG lab: index video documents as captioned scene embeddings and search them with text or video queries."
};

type SceneSearchPageProps = {
  searchParams?: Promise<{
    lang?: string;
    tenant?: string;
  }>;
};

export default async function SceneSearchPage({ searchParams }: SceneSearchPageProps) {
  const params = await searchParams;
  const locale = params?.lang ? resolveLocale(params.lang) : await getRequestLocale();
  const t = getDictionary(locale);
  const tenantId = params?.tenant?.trim() || "demo";

  return (
    <SceneSearchClient
      loginHref={withLocale("/login", locale)}
      t={t.sceneLab}
      tenantId={tenantId}
    />
  );
}
