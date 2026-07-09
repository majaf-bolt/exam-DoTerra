import "./products.css";
import template from "./products.html?raw";
import { getAllProducts } from "../../services/products.js";

export function renderProductsPage(rootElement) {
  rootElement.innerHTML = template;

  const grid = rootElement.querySelector("#products-grid");
  const products = getAllProducts();

  grid.innerHTML = products
    .map(
      (product) => `
      <div class="col-md-4">
        <article class="card product-card shadow-sm">
          <div class="card-body">
            <h2 class="h5 card-title">${product.name}</h2>
            <p class="card-text text-muted">${product.description}</p>
            <p class="fw-semibold mb-3">$${product.price.toFixed(2)}</p>
            <a class="btn btn-outline-success" href="/products/${product.id}" data-link>View</a>
          </div>
        </article>
      </div>
    `
    )
    .join("");
}
