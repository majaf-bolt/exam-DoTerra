import "./products.css";
import template from "./products.html?raw";
import { getAllProducts } from "../../services/products.js";
import { formatPrice, getProductImageUrl } from "../../utils/helpers.js";

const SKELETON_COUNT = 6;

function renderProductSkeleton() {
  return `
    <div class="col-md-4">
      <article class="card product-card h-100 shadow-sm" aria-hidden="true">
        <div class="card-img-top placeholder placeholder-img"></div>
        <div class="card-body">
          <h2 class="h5 card-title placeholder-glow">
            <span class="placeholder col-8"></span>
          </h2>
          <p class="card-text placeholder-glow">
            <span class="placeholder col-12"></span>
            <span class="placeholder col-10"></span>
          </p>
          <p class="placeholder-glow mb-3">
            <span class="placeholder col-4"></span>
          </p>
          <span class="btn btn-outline-success disabled placeholder col-5"></span>
        </div>
      </article>
    </div>
  `;
}

function renderProductCard(product) {
  const imageUrl = getProductImageUrl(product.image_url);

  return `
    <div class="col-md-4">
      <article class="card product-card h-100 shadow-sm">
        <img
          src="${imageUrl}"
          class="card-img-top"
          alt="${product.name}"
          loading="lazy"
        />
        <div class="card-body d-flex flex-column">
          <h2 class="h5 card-title">${product.name}</h2>
          <p class="card-text text-muted">${product.description ?? ""}</p>
          <p class="fw-semibold text-success mb-3">${formatPrice(product.price)}</p>
          <a class="btn btn-outline-success mt-auto" href="/products/${product.id}" data-link>Детайли</a>
        </div>
      </article>
    </div>
  `;
}

function renderProductSkeletons(grid) {
  grid.innerHTML = Array.from({ length: SKELETON_COUNT }, renderProductSkeleton).join("");
}

export async function renderProductsPage(rootElement, context) {
  rootElement.innerHTML = template;

  const grid = rootElement.querySelector("#products-grid");
  renderProductSkeletons(grid);

  try {
    const products = await getAllProducts(context.query.category ?? null);
    grid.innerHTML = products.length
      ? products.map(renderProductCard).join("")
      : `<div class="col-12"><div class="alert alert-info">Няма продукти в тази категория.</div></div>`;
  } catch {
    grid.innerHTML = `<div class="col-12"><div class="alert alert-warning">Неуспешно зареждане на продуктите.</div></div>`;
  }
}
