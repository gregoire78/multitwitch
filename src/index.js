import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";
import "./index.css";
import "./i18n";
import { CookiesProvider } from "react-cookie";
import App from "./components/App";

ReactDOM.render(
  <CookiesProvider>
    <Router>
      <Switch>
        <Route path="/" render={() => <App />} />
      </Switch>
    </Router>
  </CookiesProvider>,
  document.getElementById("root")
);
