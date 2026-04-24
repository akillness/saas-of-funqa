# FunQA Locale, Theme, Sidebar, and App Hosting Verification

Date: 2026-04-24

## Scope

- Added a collapsible global side menu for primary navigation, auth, locale, and theme controls.
- Added a client-side light/dark theme toggle without new dependencies.
- Moved home quick-path copy into localized message resources.
- Fixed page-level locale fallback so pages use the request locale when `lang` is not present.

## Deployment

Firebase App Hosting backend:

- `saas-of-funqa`

Hosted URL:

- `https://saas-of-funqa--saas-of-funqa.us-east4.hosted.app`

Final deploy source archive:

- `gs://firebaseapphosting-sources-74495319833-us-east4/saas-of-funqa--84395-Jj3DIlcmYHnZ-.zip`

Deploy command completed successfully:

- `npm run deploy:apphosting`

## Verification

Mechanical checks passed:

- `npm --workspace @funqa/web run typecheck`
- `npm --workspace @funqa/web run build`

Playwriter was used because the requested verification explicitly required `$playwriter` running-browser validation.

Playwriter evidence from deployed URL:

```json
{
  "englishEvidence": {
    "lang": "en",
    "hasEnglishBrand": true,
    "hasEnglishHero": true,
    "hasEnglishQuickPath": true
  },
  "menuEvidence": {
    "hasNav": true,
    "hasLocale": true,
    "hasTheme": true
  },
  "themeEvidence": {
    "theme": "dark",
    "text": "rgb(238, 248, 251)"
  },
  "koreanEvidence": {
    "lang": "ko",
    "theme": "dark",
    "hasKoreanBrand": true,
    "hasKoreanHero": true,
    "hasKoreanQuickPath": true,
    "hasMenuLabel": true
  }
}
```
