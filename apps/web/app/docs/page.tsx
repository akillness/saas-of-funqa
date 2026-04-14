import { getDictionary, resolveLocale } from "../../lib/i18n";

type DocsPageProps = {
  searchParams?: Promise<{
    lang?: string;
  }>;
};

export default async function DocsPage({ searchParams }: DocsPageProps) {
  const params = await searchParams;
  const locale = resolveLocale(params?.lang);
  const t = getDictionary(locale);

  return (
    <div className="docs-layout">
      <aside className="panel docs-nav">
        <h2>{t.docs.title}</h2>
        <nav aria-label={t.docs.navLabel}>
          <ul className="bullet-list compact-list">
            {t.docs.sections.map((section) => (
              <li key={section.id}>
                <a href={`#${section.id}`}>{section.label}</a>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      <article className="panel docs-article">
        <header className="stack-sm">
          <p className="eyebrow">{t.docs.eyebrow}</p>
          <h1>{t.docs.heroTitle}</h1>
          <p className="lede">{t.docs.lede}</p>
          <pre className="code-block">
            <code>{`curl -X POST https://api.example.com/v1/ingest \\
  -H "Authorization: Bearer <token>" \\
  -H "Content-Type: application/json" \\
  -d '{"tenantId":"demo","documents":[{"id":"repo-1","text":"Hello RAG"}]}'`}</code>
          </pre>
        </header>

        <section id="overview" className="stack-sm">
          <h2>{t.docs.sections[0].title}</h2>
          <p>{t.docs.overviewBody}</p>
        </section>

        <section id="auth" className="stack-sm">
          <h2>{t.docs.sections[1].title}</h2>
          <p>{t.docs.authBody}</p>
        </section>

        <section id="quickstart" className="stack-sm">
          <h2>{t.docs.sections[2].title}</h2>
          <ol className="bullet-list ordered-list">
            {t.docs.quickstartSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </section>

        <section id="endpoints" className="stack-sm">
          <h2>{t.docs.sections[3].title}</h2>
          <table className="data-table">
            <caption className="sr-only">Endpoint reference</caption>
            <thead>
              <tr>
                <th scope="col">{t.docs.endpointsTable.method}</th>
                <th scope="col">{t.docs.endpointsTable.path}</th>
                <th scope="col">{t.docs.endpointsTable.purpose}</th>
              </tr>
            </thead>
            <tbody>
              {t.docs.endpointsTable.rows.map(([method, path, purpose]) => (
                <tr key={`${method}-${path}`}>
                  <td>{method}</td>
                  <td>{path}</td>
                  <td>{purpose}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section id="errors" className="stack-sm">
          <h2>{t.docs.sections[4].title}</h2>
          <p>{t.docs.errorsBody}</p>
        </section>

        <section id="limits" className="stack-sm">
          <h2>{t.docs.sections[5].title}</h2>
          <p>{t.docs.limitsBody}</p>
        </section>
      </article>

      <aside className="panel docs-nav">
        <h2>{t.docs.notesTitle}</h2>
        <div className="stack-sm">
          {t.docs.notes.map((note) => (
            <div key={note.label}>
              <p className="metric-label">{note.label}</p>
              <p className="microcopy">{note.text}</p>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}
