import "./products.css";
import template from "./products.html?raw";
import { getAllProducts } from "../../services/products.js";
import { formatPrice } from "../../utils/helpers.js";

function renderProductCard(product) {
  return `
    <div class="col-md-4">
      <article class="card product-card shadow-sm">
        <div class="card-body">
          <h2 class="h5 card-title">${product.name}</h2>
          <p class="card-text text-muted">${product.description ?? ""}</p>
          <p class="fw-semibold mb-3">${formatPrice(product.price)}</p>
          <a class="btn btn-outline-success" href="/products/${product.id}" data-link>Детайли</a>
        </div>
      </article>
    </div>
  `;
}

export async function renderProductsPage(rootElement, context) {
  rootElement.innerHTML = template;

  const grid = rootElement.querySelector("#products-grid");
  grid.innerHTML = `<div class="col-12"><div class="placeholder-glow"><span class="placeholder col-12" style="height: 120px;"></span></div></div>`;

  try {
    const products = await getAllProducts(context.query.category ?? null);
    grid.innerHTML = products.length
      ? products.map(renderProductCard).join("")
      : `<div class="col-12"><div class="alert alert-info">Няма продукти в тази категория.</div></div>`;
  } catch {
    grid.innerHTML = `<div class="col-12"><div class="alert alert-warning">Неуспешно зареждане на продуктите.</div></div>`;
  }
}
