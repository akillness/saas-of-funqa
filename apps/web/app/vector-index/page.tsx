import type { Metadata } from "next";
import { getDictionary, resolveLocale, withLocale } from "../../lib/i18n";
import { getRequestLocale } from "../../lib/i18n-server";
import { requireServerAdmin } from "@/lib/server-admin";
import { VectorIndexClient } from "./vector-index-client";

export const metadata: Metadata = {
  title: "Vector Index | FunQA",
  description:
    "Add a video file and store it as searchable scene vectors: frame sampling in the browser, server-side captioning, and caption/image embeddings written to the scene store."
};

type VectorIndexPageProps = {
  searchParams?: Promise<{
    lang?: string;
  }>;
};

export default async function VectorIndexPage({ searchParams }: VectorIndexPageProps) {
  const params = await searchParams;
  const locale = params?.lang ? resolveLocale(params.lang) : await getRequestLocale();
  await requireServerAdmin(locale, "/vector-index");
  const t = getDictionary(locale);

  return (
    <>
      <VectorIndexClient
        loginHref={withLocale("/login", locale)}
        searchHref={withLocale("/scene-search", locale)}
        t={t.vectorIndex}
      />
    </>
  );
}
