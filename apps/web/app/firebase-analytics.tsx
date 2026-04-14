"use client";

import { useEffect } from "react";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getFirebaseApp, hasFirebaseClientConfig, hasMeasurementId } from "../lib/firebase-client";

export function FirebaseAnalytics() {
  useEffect(() => {
    if (!hasFirebaseClientConfig || !hasMeasurementId) {
      return;
    }

    void isSupported()
      .then((supported) => {
        if (supported) {
          getAnalytics(getFirebaseApp());
        }
      })
      .catch(() => {
        // Ignore analytics bootstrap failures in local or restricted environments.
      });
  }, []);

  return null;
}
