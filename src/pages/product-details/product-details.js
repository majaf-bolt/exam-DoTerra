import "./product-details.css";
import template from "./product-details.html?raw";
import { getProductById } from "../../services/products.js";

export function renderProductDetailsPage(rootElement, context) {
  rootElement.innerHTML = template;
  const section = rootElement.querySelector("#product-details-section");
  const product = getProductById(context.params.id);

  if (!product) {
    section.innerHTML = `<div class="alert alert-warning">Product not found.</div>`;
    return;
  }

  section.innerHTML = `
    <article class="card shadow-sm">
      <div class="card-body">
        <h1 class="h3 card-title">${product.name}</h1>
        <p class="text-muted">${product.description}</p>
        <p class="fw-bold">$${product.price.toFixed(2)}</p>
        <button class="btn btn-success" type="button">Add to cart</button>
      </div>
    </article>
  `;
}
