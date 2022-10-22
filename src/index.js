import React, { lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { CookiesProvider } from "react-cookie";
import process from "process";
import "@fontsource/ubuntu";
import "./index.css";
import "./i18n";
const App = lazy(() => import("./components/App"));
const RedirPage = lazy(() => import("./components/Redirect"));
import * as serviceWorker from "./serviceWorker";
import { Helmet } from "react-helmet";

const container = document.getElementById("root");
const root = createRoot(container);

root.render(
  <CookiesProvider>
    <Helmet>
      {process.env.NODE_ENV !== "development" && (
        <script
          src={process.env.COUNTER_URL}
          data-id={process.env.COUNTER_ID}
          data-utcoffset={process.env.COUNTER_UTCOFFSET?.toString()}
        ></script>
      )}
    </Helmet>
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
  </CookiesProvider>
);

serviceWorker.register();
