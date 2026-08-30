import { fetchHealthSummary } from "../../lib/funqa-api";
import { getDictionary, resolveLocale } from "../../lib/i18n";
import { getRequestLocale } from "../../lib/i18n-server";
import { requireServerAdmin } from "@/lib/server-admin";
import { AdminPageClient } from "./admin-page-client";

type AdminPageProps = {
  searchParams?: Promise<{ lang?: string }>;
};

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const params = await searchParams;
  const locale = params?.lang ? resolveLocale(params.lang) : await getRequestLocale();
  const { idToken } = await requireServerAdmin(locale, "/admin");
  const t = getDictionary(locale);
  const health = await fetchHealthSummary(idToken);

  return <AdminPageClient health={health} locale={locale} t={t.admin} />;
}
