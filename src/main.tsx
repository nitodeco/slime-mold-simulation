import { render } from "solid-js/web";
import "@hackernoon/pixel-icon-library/fonts/iconfont.css";
import "./index.css";
import App from "./App";

const root = document.getElementById("app");

if (!root) {
	throw new Error("Root element not found");
}

render(() => <App />, root);
