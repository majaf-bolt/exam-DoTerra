import "./home.css";
import template from "./home.html?raw";

export function renderHomePage(rootElement) {
  rootElement.innerHTML = template;
}
