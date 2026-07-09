import "./header.css";
import template from "./header.html?raw";
import { isAuthenticated } from "../../services/auth.js";

let headerRootReference = null;

export function renderHeader(rootElement) {
  headerRootReference = rootElement;
  rootElement.innerHTML = template;
}

export function bindHeaderEvents({ navigate, logout }) {
  document.addEventListener("click", (event) => {
    const authButton = event.target.closest("#auth-button");
    if (!authButton) {
      return;
    }

    if (isAuthenticated()) {
      logout();
      return;
    }

    navigate("/auth");
  });
}

export function updateHeaderState({ isAuthenticated: authenticated, cartCount }) {
  if (!headerRootReference) {
    return;
  }

  const authButton = headerRootReference.querySelector("#auth-button");
  const badge = headerRootReference.querySelector("#cart-badge");

  authButton.textContent = authenticated ? "Logout" : "Login";
  badge.textContent = String(cartCount ?? 0);
}
