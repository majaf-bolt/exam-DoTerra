import "./profile.css";
import template from "./profile.html?raw";
import { getCurrentCustomerProfile } from "../../services/customers.js";

export function renderProfilePage(rootElement) {
  rootElement.innerHTML = template;

  const profile = getCurrentCustomerProfile();
  const details = rootElement.querySelector("#profile-details");

  details.innerHTML = `
    <ul class="list-group shadow-sm">
      <li class="list-group-item"><strong>Name:</strong> ${profile.fullName}</li>
      <li class="list-group-item"><strong>Email:</strong> ${profile.email}</li>
      <li class="list-group-item"><strong>Loyalty Points:</strong> ${profile.loyaltyPoints}</li>
    </ul>
  `;
}
