import React from "react";
import ReactDOM from "react-dom/client";
import App from "./components/App";

// Bootstrap first, our own theme second — otherwise Bootstrap wins the cascade.
import "bootstrap/dist/css/bootstrap.min.css";
import "./index.css";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
