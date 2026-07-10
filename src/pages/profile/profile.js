import "./profile.css";
import template from "./profile.html?raw";
import { getCurrentUser } from "../../services/auth.js";

export function renderProfilePage(rootElement) {
  rootElement.innerHTML = template;

  const user = getCurrentUser();
  const details = rootElement.querySelector("#profile-details");

  if (!user) {
    details.innerHTML = `<div class="alert alert-warning">Не сте влезли в профила си.</div>`;
    return;
  }

  details.innerHTML = `
    <ul class="list-group shadow-sm">
      <li class="list-group-item"><strong>Name:</strong> ${user.fullName}</li>
      <li class="list-group-item"><strong>Email:</strong> ${user.email}</li>
      <li class="list-group-item"><strong>Role:</strong> ${user.role}</li>
    </ul>
  `;
}
