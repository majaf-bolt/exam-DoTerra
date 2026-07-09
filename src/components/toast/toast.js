import { Toast } from "bootstrap";
import "./toast.css";
import template from "./toast.html?raw";

export function showToast(message, variant = "primary") {
  const toastRoot = document.querySelector("#toast-root");
  if (!toastRoot) {
    return;
  }

  const wrapper = document.createElement("div");
  wrapper.innerHTML = template.trim();
  const toastElement = wrapper.firstElementChild;

  toastElement.className = `toast align-items-center text-bg-${variant} border-0`;
  toastElement.querySelector(".toast-body").textContent = message;

  toastRoot.appendChild(toastElement);
  const instance = new Toast(toastElement, { delay: 2500 });
  instance.show();

  toastElement.addEventListener("hidden.bs.toast", () => {
    toastElement.remove();
  });
}
