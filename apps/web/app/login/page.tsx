import { getDictionary, resolveLocale } from "../../lib/i18n";

type LoginPageProps = {
  searchParams?: Promise<{
    lang?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const locale = resolveLocale(params?.lang);
  const t = getDictionary(locale);

  return (
    <div className="stack-lg">
      <section className="page-intro page-intro-wide">
        <p className="eyebrow">{t.login.eyebrow}</p>
        <h1>{t.login.title}</h1>
        <p className="lede">{t.login.lede}</p>
      </section>

      <div className="auth-layout">
        <section className="panel auth-card">
          <h2>{t.login.continueTitle}</h2>
          <p>{t.login.continueBody}</p>
          <div className="action-row">
            <button className="primary-button" type="button">
              {t.login.continueButton}
            </button>
            <p className="microcopy" aria-live="polite">
              {t.login.continueNote}
            </p>
          </div>
        </section>

        <aside className="panel">
          <h2>{t.login.trustTitle}</h2>
          <ul className="bullet-list">
            {t.login.trustItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}
