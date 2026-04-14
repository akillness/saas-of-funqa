# Firebase Web Config (2026-04-13)

Provided directly by the project owner during deployment setup.

```ts
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyDR2XdnemhSHYznMFI20or-WKIPgn1V7vc",
  authDomain: "saas-of-funqa.firebaseapp.com",
  projectId: "saas-of-funqa",
  storageBucket: "saas-of-funqa.firebasestorage.app",
  messagingSenderId: "74495319833",
  appId: "1:74495319833:web:d75e2d769b97c48bdeaf88",
  measurementId: "G-XTVCB7JPNF"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
```
