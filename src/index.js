import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";
import "./index.css";
import "./i18n";
import { CookiesProvider } from "react-cookie";
import App from "./components/App";
import RedirPage from "./components/Redirect";

ReactDOM.render(
  <CookiesProvider>
    <Router>
      <Switch>
        <Route exact path="/redirect" render={() => <RedirPage />} />
        <Route path="/" render={() => <App />} />
      </Switch>
    </Router>
  </CookiesProvider>,
  document.getElementById("root")
);
