import "./auth.css";
import template from "./auth.html?raw";
import { loginAsAdmin, loginAsUser } from "../../services/auth.js";
import { showToast } from "../../components/toast/toast.js";
import { updateHeaderState } from "../../components/header/header.js";

export function renderAuthPage(rootElement) {
  rootElement.innerHTML = template;

  const loginUserBtn = rootElement.querySelector("#login-user-btn");
  const loginAdminBtn = rootElement.querySelector("#login-admin-btn");

  loginUserBtn.addEventListener("click", () => {
    loginAsUser();
    updateHeaderState({ isAuthenticated: true, cartCount: 0 });
    showToast("Logged in as user.", "success");
  });

  loginAdminBtn.addEventListener("click", () => {
    loginAsAdmin();
    updateHeaderState({ isAuthenticated: true, cartCount: 0 });
    showToast("Logged in as admin.", "success");
  });
}
