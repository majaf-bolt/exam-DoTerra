import "./auth.css";
import template from "./auth.html?raw";
import { login, register, isAuthenticated } from "../../services/auth.js";
import { getCartCount } from "../../services/cart.js";
import { showToast } from "../../components/toast/toast.js";
import { updateHeaderState } from "../../components/header/header.js";

function updateHeaderAfterAuth() {
  updateHeaderState({
    isAuthenticated: true,
    cartCount: getCartCount()
  });
}

function bindLoginForm(rootElement, navigate) {
  const form = rootElement.querySelector("#login-form");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!form.checkValidity()) {
      form.classList.add("was-validated");
      return;
    }

    const email = rootElement.querySelector("#login-email").value.trim();
    const password = rootElement.querySelector("#login-password").value;
    const submitButton = form.querySelector('[type="submit"]');

    submitButton.disabled = true;

    try {
      await login(email, password);
      updateHeaderAfterAuth();
      showToast("Успешен вход.", "success");
      navigate("/profile");
    } catch (error) {
      showToast(error.message ?? "Неуспешен вход.", "danger");
    } finally {
      submitButton.disabled = false;
    }
  });
}

function validateRegisterForm(rootElement) {
  const fullName = rootElement.querySelector("#register-full-name").value.trim();
  const email = rootElement.querySelector("#register-email").value.trim();
  const password = rootElement.querySelector("#register-password").value;
  const passwordConfirm = rootElement.querySelector("#register-password-confirm").value;

  if (!fullName) {
    showToast("Моля, въведете пълно име.", "warning");
    return null;
  }

  if (!email) {
    showToast("Моля, въведете имейл.", "warning");
    return null;
  }

  if (password.length < 6) {
    showToast("Паролата трябва да е поне 6 символа.", "warning");
    return null;
  }

  if (password !== passwordConfirm) {
    showToast("Паролите не съвпадат.", "warning");
    return null;
  }

  return { fullName, email, password };
}

function bindRegisterForm(rootElement, navigate) {
  const form = rootElement.querySelector("#register-form");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!form.checkValidity()) {
      form.classList.add("was-validated");
      return;
    }

    const values = validateRegisterForm(rootElement);
    if (!values) {
      return;
    }

    const submitButton = form.querySelector('[type="submit"]');
    submitButton.disabled = true;

    try {
      const user = await register(values.email, values.password, values.fullName);

      if (!user) {
        showToast("Регистрацията е успешна. Моля, потвърдете имейла си.", "info");
        return;
      }

      updateHeaderAfterAuth();
      showToast("Успешна регистрация.", "success");
      navigate("/profile");
    } catch (error) {
      showToast(error.message ?? "Неуспешна регистрация.", "danger");
    } finally {
      submitButton.disabled = false;
    }
  });
}

export function renderAuthPage(rootElement, context) {
  if (isAuthenticated()) {
    context.navigate("/profile");
    return;
  }

  rootElement.innerHTML = template;
  bindLoginForm(rootElement, context.navigate);
  bindRegisterForm(rootElement, context.navigate);
}
