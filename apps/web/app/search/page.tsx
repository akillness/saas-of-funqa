import { resolveLocale } from "@/lib/i18n";
import { getRequestLocale } from "@/lib/i18n-server";
import { redirect } from "next/navigation";

export type SearchPageProps = {
  searchParams?: Promise<{ lang?: string; q?: string }>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const locale = params?.lang ? resolveLocale(params.lang) : await getRequestLocale();
  const target = new URLSearchParams({ lang: locale });
  if (params?.q?.trim()) target.set("q", params.q.trim());

  // The former Patch Desk route searched a checked-in simulation corpus. The
  // canonical search surface now targets authenticated, uploaded scene data.
  redirect(`/scene-search?${target.toString()}`);
}
