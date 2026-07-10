import "./home.css";
import template from "./home.html?raw";
import { getFeaturedProducts } from "../../services/products.js";
import { formatPrice } from "../../utils/helpers.js";

const FEATURED_COUNT = 4;
const PLACEHOLDER_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='240' viewBox='0 0 400 240'%3E%3Crect fill='%23198754' width='400' height='240'/%3E%3Ctext fill='%23ffffff' font-family='sans-serif' font-size='24' x='50%25' y='50%25' text-anchor='middle' dominant-baseline='middle'%3EdoTERRA%3C/text%3E%3C/svg%3E";

function renderFeaturedSkeleton() {
  return `
    <div class="col-sm-6 col-lg-3">
      <article class="card featured-card h-100 shadow-sm" aria-hidden="true">
        <div class="card-img-top placeholder placeholder-img"></div>
        <div class="card-body">
          <h3 class="card-title placeholder-glow">
            <span class="placeholder col-8"></span>
          </h3>
          <p class="placeholder-glow mb-3">
            <span class="placeholder col-4"></span>
          </p>
          <span class="btn btn-success disabled placeholder col-6"></span>
        </div>
      </article>
    </div>
  `;
}

function renderFeaturedProduct(product) {
  const imageUrl = product.image_url || PLACEHOLDER_IMAGE;

  return `
    <div class="col-sm-6 col-lg-3">
      <article class="card featured-card h-100 shadow-sm">
        <img
          src="${imageUrl}"
          class="card-img-top"
          alt="${product.name}"
          loading="lazy"
        />
        <div class="card-body d-flex flex-column">
          <h3 class="h6 card-title">${product.name}</h3>
          <p class="fw-semibold text-success mb-3">${formatPrice(product.price)}</p>
          <a
            href="/products/${product.id}"
            data-link
            class="btn btn-outline-success mt-auto"
          >
            Детайли
          </a>
        </div>
      </article>
    </div>
  `;
}

function renderFeaturedSkeletons(grid) {
  grid.innerHTML = Array.from({ length: FEATURED_COUNT }, renderFeaturedSkeleton).join("");
}

async function loadFeaturedProducts(grid) {
  try {
    const products = await getFeaturedProducts(FEATURED_COUNT);

    if (products.length === 0) {
      grid.innerHTML = `
        <div class="col-12">
          <div class="alert alert-info mb-0">Няма налични продукти в момента.</div>
        </div>
      `;
      return;
    }

    grid.innerHTML = products.map(renderFeaturedProduct).join("");
  } catch {
    grid.innerHTML = `
      <div class="col-12">
        <div class="alert alert-warning mb-0">
          Неуспешно зареждане на продуктите. Моля, опитайте отново по-късно.
        </div>
      </div>
    `;
  }
}

export function renderHomePage(rootElement) {
  rootElement.innerHTML = template;

  const featuredGrid = rootElement.querySelector("#featured-products-grid");
  renderFeaturedSkeletons(featuredGrid);
  loadFeaturedProducts(featuredGrid);
}
