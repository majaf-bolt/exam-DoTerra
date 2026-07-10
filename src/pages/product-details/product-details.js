import "./product-details.css";
import template from "./product-details.html?raw";
import { getProductById } from "../../services/products.js";
import { formatPrice } from "../../utils/helpers.js";

export async function renderProductDetailsPage(rootElement, context) {
  rootElement.innerHTML = template;
  const section = rootElement.querySelector("#product-details-section");

  section.innerHTML = `
    <div class="placeholder-glow">
      <span class="placeholder col-12" style="height: 200px;"></span>
    </div>
  `;

  try {
    const product = await getProductById(context.params.id);

    if (!product) {
      section.innerHTML = `<div class="alert alert-warning">Продуктът не е намерен.</div>`;
      return;
    }

    section.innerHTML = `
      <article class="card shadow-sm">
        <div class="card-body">
          <h1 class="h3 card-title">${product.name}</h1>
          <p class="text-muted">${product.description ?? ""}</p>
          <p class="fw-bold text-success">${formatPrice(product.price)}</p>
          <button class="btn btn-success" type="button">Добави в количката</button>
        </div>
      </article>
    `;
  } catch {
    section.innerHTML = `<div class="alert alert-warning">Неуспешно зареждане на продукта.</div>`;
  }
}
