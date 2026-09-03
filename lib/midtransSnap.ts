declare global {
  interface Window {
    snap?: {
      pay: (
        token: string,
        options?: {
          onSuccess?: (result: Record<string, unknown>) => void;
          onPending?: (result: Record<string, unknown>) => void;
          onError?: (result: Record<string, unknown>) => void;
          onClose?: () => void;
        }
      ) => void;
    };
  }
}

const SNAP_URLS = {
  sandbox: "https://app.sandbox.midtrans.com/snap/snap.js",
  production: "https://app.midtrans.com/snap/snap.js",
};

let loadedPromise: Promise<void> | null = null;

/**
 * Lazily loads the Midtrans Snap widget script once (idempotent).
 *
 * The client key is safe to expose to the frontend; the SERVER key is never
 * used here. Pass the production flag based on the backend environment.
 */
export function loadMidtransSnap(clientKey: string, isProduction = false): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.snap) return Promise.resolve();
  if (loadedPromise) return loadedPromise;

  loadedPromise = new Promise<void>((resolve, reject) => {
    const existing = document.getElementById("midtrans-snap-script") as
      | HTMLScriptElement
      | null;
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Snap load failed")));
      return;
    }
    const script = document.createElement("script");
    script.id = "midtrans-snap-script";
    script.src = isProduction ? SNAP_URLS.production : SNAP_URLS.sandbox;
    script.setAttribute("data-client-key", clientKey);
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      loadedPromise = null;
      reject(new Error("Failed to load Midtrans Snap"));
    };
    document.body.appendChild(script);
  });

  return loadedPromise;
}

export {}