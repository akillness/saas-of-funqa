import { redirect } from "next/navigation";
import { getRequestLocale } from "../lib/i18n-server";
import { resolveLocale, withLocale } from "../lib/i18n";

type HomePageProps = {
  searchParams?: Promise<{ lang?: string }>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const locale = params?.lang ? resolveLocale(params.lang) : await getRequestLocale();
  redirect(withLocale("/scene-search", locale));
}
