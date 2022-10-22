import React, { lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { CookiesProvider } from "react-cookie";
import { MatomoProvider, createInstance } from "@datapunt/matomo-tracker-react";
import process from "process";
import "@fontsource/ubuntu";
import "./index.css";
import "./i18n";
const App = lazy(() => import("./components/App"));
const RedirPage = lazy(() => import("./components/Redirect"));
import * as serviceWorker from "./serviceWorker";

const instance = createInstance({
  urlBase: process.env.MATOMO_URL,
  siteId: process.env.MATOMO_ID,
  disabled: process.env.NODE_ENV !== "production",
});

const container = document.getElementById("root");
const root = createRoot(container);

root.render(
  <CookiesProvider>
    <MatomoProvider value={instance}>
      <BrowserRouter>
        <Routes>
          <Route
            exact
            path="/redirect"
            element={
              <Suspense fallback="">
                <RedirPage />
              </Suspense>
            }
          />
          <Route
            path="/*"
            element={
              <Suspense fallback="">
                <App />
              </Suspense>
            }
          />
        </Routes>
      </BrowserRouter>
    </MatomoProvider>
  </CookiesProvider>
);

serviceWorker.register();
