import "./admin.css";
import template from "./admin.html?raw";

export function renderAdminPage(rootElement) {
  rootElement.innerHTML = template;
}
