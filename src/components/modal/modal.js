import { Modal } from "bootstrap";
import "./modal.css";
import template from "./modal.html?raw";

export function openModal() {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = template.trim();
  const modalElement = wrapper.firstElementChild;

  document.body.appendChild(modalElement);
  const modal = new Modal(modalElement);
  modal.show();

  modalElement.addEventListener("hidden.bs.modal", () => {
    modal.dispose();
    modalElement.remove();
  });
}
