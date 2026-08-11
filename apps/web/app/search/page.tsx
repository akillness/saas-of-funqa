import { getDictionary, resolveLocale } from "@/lib/i18n";
import { getRequestLocale } from "@/lib/i18n-server";

import { SearchResults } from "@/app/search/search-results";

export type SearchPageProps = {
  searchParams?: Promise<{ lang?: string; q?: string }>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const locale = params?.lang ? resolveLocale(params.lang) : await getRequestLocale();
  const messages = getDictionary(locale).patchDesk;

  return (
    <SearchResults
      locale={locale}
      initialQuery={params?.q?.trim() ?? ""}
      messages={messages}
    />
  );
}
