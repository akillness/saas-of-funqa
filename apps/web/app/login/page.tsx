export default function LoginPage() {
  return (
    <div className="stack-lg">
      <section className="page-intro page-intro-wide">
        <p className="eyebrow">Authentication</p>
        <h1>Sign in with Google to enter the search workspace and operator console.</h1>
        <p className="lede">
          End users see saved search and citations. Admins also get ingestion controls, model-key
          settings, and usage telemetry.
        </p>
      </section>

      <div className="auth-layout">
        <section className="panel auth-card">
          <h2>Continue with Google</h2>
          <p>
            Workspace login unlocks saved searches, grounded citations, admin controls, and audit-aware
            provider key actions.
          </p>
          <div className="action-row">
            <button className="primary-button" type="button">
              Continue With Google
            </button>
            <p className="microcopy" aria-live="polite">
              Firebase Auth wiring is the next implementation step.
            </p>
          </div>
        </section>

        <aside className="panel">
          <h2>Trust boundary</h2>
          <ul className="bullet-list">
            <li>You need a Google account allowed by workspace policy.</li>
            <li>Admin privileges are assigned server-side after sign-in.</li>
            <li>No provider API key is ever stored in browser storage.</li>
          </ul>
        </aside>
      </div>
    </div>
  );
}
