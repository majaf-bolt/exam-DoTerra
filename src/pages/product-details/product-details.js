import "./product-details.css";
import template from "./product-details.html?raw";
import { getProduct, getRelatedProducts } from "../../services/products.js";
import { addToCart, getCartCount } from "../../services/cart.js";
import { isAuthenticated } from "../../services/auth.js";
import { updateHeaderState } from "../../components/header/header.js";
import { showToast } from "../../components/toast/toast.js";
import { formatPrice, getCategoryLabel, getProductImageUrl } from "../../utils/helpers.js";

function renderSkeleton(section) {
  section.innerHTML = `
    <div class="row g-4 placeholder-glow" aria-hidden="true">
      <div class="col-md-6">
        <div class="product-detail-image placeholder"></div>
      </div>
      <div class="col-md-6">
        <span class="placeholder col-3 mb-3 d-inline-block"></span>
        <h1 class="placeholder col-8 mb-3"></h1>
        <p class="placeholder col-4 mb-3"></p>
        <p class="placeholder col-3 mb-3"></p>
        <p class="placeholder col-12 mb-2"></p>
        <p class="placeholder col-11 mb-4"></p>
        <div class="d-flex gap-2">
          <span class="placeholder col-2" style="height: 38px;"></span>
          <span class="placeholder col-4" style="height: 38px;"></span>
        </div>
      </div>
    </div>
  `;
}

function renderRelatedProductCard(product) {
  const imageUrl = getProductImageUrl(product.image_url);

  return `
    <div class="col-sm-6 col-md-4">
      <article class="card related-card h-100 shadow-sm">
        <img src="${imageUrl}" class="card-img-top" alt="${product.name}" loading="lazy" />
        <div class="card-body d-flex flex-column">
          <h3 class="h6 card-title">${product.name}</h3>
          <p class="fw-semibold text-success mb-2">${formatPrice(product.price)}</p>
          <a href="/products/${product.id}" data-link class="btn btn-sm btn-outline-success mt-auto">Детайли</a>
        </div>
      </article>
    </div>
  `;
}

function renderProductDetails(product) {
  const imageUrl = getProductImageUrl(product.image_url);
  const categoryLabel = getCategoryLabel(product.category);
  const outOfStock = product.stock <= 0;

  return `
    <div class="row g-4">
      <div class="col-md-6">
        <img
          src="${imageUrl}"
          class="product-detail-image shadow-sm"
          alt="${product.name}"
        />
      </div>
      <div class="col-md-6">
        <span class="badge text-bg-success mb-3">${categoryLabel}</span>
        <h1 class="h2 mb-3">${product.name}</h1>
        <p class="fs-4 fw-bold text-success mb-3">${formatPrice(product.price)}</p>
        <p class="mb-3">
          <span class="text-muted">Наличност:</span>
          <span class="fw-semibold ${outOfStock ? "text-danger" : "text-success"}">
            ${outOfStock ? "Няма наличност" : `${product.stock} бр.`}
          </span>
        </p>
        <p class="text-muted mb-4">${product.description ?? ""}</p>
        <div class="d-flex flex-wrap align-items-center gap-3">
          <div>
            <label class="form-label visually-hidden" for="product-quantity">Количество</label>
            <input
              type="number"
              id="product-quantity"
              class="form-control"
              min="1"
              max="${Math.max(product.stock, 1)}"
              value="1"
              ${outOfStock ? "disabled" : ""}
              style="width: 5rem;"
            />
          </div>
          <button
            id="add-to-cart-btn"
            class="btn btn-success"
            type="button"
            ${outOfStock ? "disabled" : ""}
          >
            Добави в количката
          </button>
        </div>
      </div>
    </div>
  `;
}

function bindAddToCart(rootElement, product, navigate) {
  const addButton = rootElement.querySelector("#add-to-cart-btn");
  const quantityInput = rootElement.querySelector("#product-quantity");

  if (!addButton || !quantityInput) {
    return;
  }

  addButton.addEventListener("click", () => {
    if (!isAuthenticated()) {
      navigate("/auth");
      return;
    }

    const quantity = Number(quantityInput.value);

    if (!Number.isInteger(quantity) || quantity < 1 || quantity > product.stock) {
      showToast("Моля, въведете валидно количество.", "warning");
      return;
    }

    addToCart(product, quantity);
    updateHeaderState({
      isAuthenticated: true,
      cartCount: getCartCount()
    });
    showToast(`${product.name} е добавен в количката.`, "success");
  });
}

async function loadRelatedProducts(rootElement, product) {
  const section = rootElement.querySelector("#related-products-section");
  const grid = rootElement.querySelector("#related-products-grid");

  if (!product.category) {
    return;
  }

  try {
    const relatedProducts = await getRelatedProducts(product.category, product.id, 3);

    if (!relatedProducts.length) {
      return;
    }

    grid.innerHTML = relatedProducts.map(renderRelatedProductCard).join("");
    section.classList.remove("d-none");
  } catch {
    // Related products are optional; ignore errors.
  }
}

export async function renderProductDetailsPage(rootElement, context) {
  rootElement.innerHTML = template;

  const section = rootElement.querySelector("#product-details-section");
  const relatedSection = rootElement.querySelector("#related-products-section");

  renderSkeleton(section);
  relatedSection.classList.add("d-none");

  try {
    const product = await getProduct(context.params.id);

    if (!product) {
      section.innerHTML = `<div class="alert alert-warning">Продуктът не е намерен.</div>`;
      return;
    }

    section.innerHTML = renderProductDetails(product);
    bindAddToCart(rootElement, product, context.navigate);
    await loadRelatedProducts(rootElement, product);
  } catch {
    section.innerHTML = `<div class="alert alert-warning">Неуспешно зареждане на продукта.</div>`;
  }
}
