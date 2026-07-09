import "./footer.css";
import template from "./footer.html?raw";

export function renderFooter(rootElement) {
  rootElement.innerHTML = template;
}
