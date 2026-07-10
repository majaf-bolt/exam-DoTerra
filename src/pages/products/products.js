import "./products.css";
import template from "./products.html?raw";
import { getProducts } from "../../services/products.js";
import { formatPrice, getCategoryLabel, getProductImageUrl } from "../../utils/helpers.js";

const SKELETON_COUNT = 6;

function renderProductSkeleton() {
  return `
    <div class="col-12 col-md-4">
      <article class="card product-card h-100 shadow-sm" aria-hidden="true">
        <div class="card-img-top placeholder placeholder-img"></div>
        <div class="card-body">
          <span class="badge placeholder col-3 mb-2"></span>
          <h2 class="h5 card-title placeholder-glow">
            <span class="placeholder col-8"></span>
          </h2>
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
  const categoryLabel = getCategoryLabel(product.category);

  return `
    <div class="col-12 col-md-4">
      <article class="card product-card h-100 shadow-sm">
        <img
          src="${imageUrl}"
          class="card-img-top"
          alt="${product.name}"
          loading="lazy"
        />
        <div class="card-body d-flex flex-column">
          <span class="badge text-bg-success align-self-start mb-2">${categoryLabel}</span>
          <h2 class="h5 card-title">${product.name}</h2>
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

function renderEmptyState(grid) {
  grid.innerHTML = `
    <div class="col-12">
      <div class="alert alert-info mb-0">Няма намерени продукти.</div>
    </div>
  `;
}

function renderErrorState(grid) {
  grid.innerHTML = `
    <div class="col-12">
      <div class="alert alert-warning mb-0">Неуспешно зареждане на продуктите.</div>
    </div>
  `;
}

function filterProducts(products, searchTerm) {
  const query = searchTerm.trim().toLowerCase();
  if (!query) {
    return products;
  }

  return products.filter((product) => product.name.toLowerCase().includes(query));
}

function sortProducts(products, sortValue) {
  const sorted = [...products];

  switch (sortValue) {
    case "price-asc":
      return sorted.sort((a, b) => Number(a.price) - Number(b.price));
    case "price-desc":
      return sorted.sort((a, b) => Number(b.price) - Number(a.price));
    case "name-asc":
    default:
      return sorted.sort((a, b) => a.name.localeCompare(b.name, "bg"));
  }
}

function renderProductGrid(grid, products) {
  if (!products.length) {
    renderEmptyState(grid);
    return;
  }

  grid.innerHTML = products.map(renderProductCard).join("");
}

function setActiveCategoryFilter(rootElement, category) {
  rootElement.querySelectorAll("#category-filters [data-category]").forEach((button) => {
    const isActive = button.dataset.category === (category ?? "");
    button.classList.toggle("active", isActive);
    button.classList.toggle("btn-success", isActive);
    button.classList.toggle("btn-outline-success", !isActive);
  });
}

function bindProductFilters(rootElement, products, grid) {
  const searchInput = rootElement.querySelector("#product-search");
  const sortSelect = rootElement.querySelector("#product-sort");

  const updateGrid = () => {
    const filtered = filterProducts(products, searchInput.value);
    const sorted = sortProducts(filtered, sortSelect.value);
    renderProductGrid(grid, sorted);
  };

  searchInput.addEventListener("input", updateGrid);
  sortSelect.addEventListener("change", updateGrid);
}

export async function renderProductsPage(rootElement, context) {
  rootElement.innerHTML = template;

  const category = context.query.category ?? null;
  const grid = rootElement.querySelector("#products-grid");

  setActiveCategoryFilter(rootElement, category);
  renderProductSkeletons(grid);

  try {
    const products = await getProducts(category);
    renderProductGrid(grid, sortProducts(products, "name-asc"));
    bindProductFilters(rootElement, products, grid);
  } catch {
    renderErrorState(grid);
  }
}
