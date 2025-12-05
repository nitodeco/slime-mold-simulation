import { render } from "solid-js/web";
import "./index.css";
import App from "./App";

const root = document.getElementById("app");

if (!root) {
	throw new Error("Root element not found");
}

render(() => <App />, root);
