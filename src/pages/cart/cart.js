import "./cart.css";
import template from "./cart.html?raw";

export function renderCartPage(rootElement) {
  rootElement.innerHTML = template;
}
