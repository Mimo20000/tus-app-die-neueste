// @ts-nocheck
import { ScrollViewStyleReset } from "expo-router/html";
import type { PropsWithChildren } from "react";

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="de" style={{ height: "100%" }}>
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover"
        />

        {/* PWA */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#171414" />
        <meta name="application-name" content="Mimo" />
        <meta name="description" content="Team-Verwaltung tus 2" />

        {/* iOS home-screen web-app */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta name="apple-mobile-web-app-title" content="Mimo" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

        <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/icon-512.png" />

        {/*
          Disable body scrolling on web to make ScrollView components work correctly.
          If you want to enable scrolling, remove `ScrollViewStyleReset` and
          set `overflow: auto` on the body style below.
        */}
        <ScrollViewStyleReset />
        <style
          dangerouslySetInnerHTML={{
            __html: `
              body > div:first-child { position: fixed !important; top: 0; left: 0; right: 0; bottom: 0; }
              [role="tablist"] [role="tab"] * { overflow: visible !important; }
              [role="heading"], [role="heading"] * { overflow: visible !important; }
            `,
          }}
        />

        {/* Register service worker and auto-refresh on new version so an
            update rolls out to already-installed PWAs without re-install.
            Passwords / session token in localStorage & MongoDB server data
            are never touched. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function () {
                  navigator.serviceWorker.register('/sw.js').then(function (reg) {
                    // If a new worker is already waiting, activate it immediately.
                    if (reg.waiting) reg.waiting.postMessage({ type: 'SKIP_WAITING' });
                    reg.addEventListener('updatefound', function () {
                      var nw = reg.installing;
                      if (!nw) return;
                      nw.addEventListener('statechange', function () {
                        if (nw.state === 'installed' && navigator.serviceWorker.controller) {
                          nw.postMessage({ type: 'SKIP_WAITING' });
                        }
                      });
                    });
                  }).catch(function () {});
                  // When the controller changes, reload once so users see the new version.
                  var reloaded = false;
                  navigator.serviceWorker.addEventListener('controllerchange', function () {
                    if (reloaded) return;
                    reloaded = true;
                    window.location.reload();
                  });
                });
              }
            `,
          }}
        />
      </head>
      <body
        style={{
          margin: 0,
          height: "100%",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {children}
      </body>
    </html>
  );
}
