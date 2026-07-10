import "./cart.css";
import template from "./cart.html?raw";
import {
  getCart,
  getCartSubtotal,
  removeFromCart,
  updateCartItemQuantity,
  clearCart
} from "../../services/cart.js";
import { createOrder, calculateShipping, calculateOrderTotal } from "../../services/orders.js";
import { getCurrentUser, isAuthenticated } from "../../services/auth.js";
import { updateHeaderState } from "../../components/header/header.js";
import { showToast } from "../../components/toast/toast.js";
import { formatPrice, getProductImageUrl } from "../../utils/helpers.js";

function renderEmptyState(rootElement) {
  const emptyState = rootElement.querySelector("#cart-empty");
  const content = rootElement.querySelector("#cart-content");

  emptyState.classList.remove("d-none");
  content.classList.add("d-none");
  emptyState.innerHTML = `
    <div class="text-center py-5">
      <svg xmlns="http://www.w3.org/2000/svg" class="cart-empty-icon mb-3" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
        <path d="M0 1.5A.5.5 0 0 1 .5 1H2a.5.5 0 0 1 .485.379L2.89 3H14.5a.5.5 0 0 1 .491.592l-1.5 8A.5.5 0 0 1 13 12H4a.5.5 0 0 1-.491-.408L2.01 3.607 1.61 2H.5a.5.5 0 0 1-.5-.5M5 12a2 2 0 1 0 0 4 2 2 0 0 0 0-4m7 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4"/>
      </svg>
      <p class="fs-5 mb-3">Количката е празна</p>
      <a href="/products" data-link class="btn btn-success">Разгледай продуктите</a>
    </div>
  `;
}

function renderCartRow(item) {
  const imageUrl = getProductImageUrl(item.image_url);
  const lineTotal = Number(item.price) * Number(item.quantity);

  return `
    <tr data-product-id="${item.productId}">
      <td>
        <img src="${imageUrl}" alt="${item.name}" />
      </td>
      <td>${item.name}</td>
      <td>${formatPrice(item.price)}</td>
      <td>
        <input
          type="number"
          class="form-control form-control-sm cart-quantity-input"
          min="1"
          value="${item.quantity}"
          aria-label="Количество за ${item.name}"
        />
      </td>
      <td class="line-total">${formatPrice(lineTotal)}</td>
      <td>
        <button type="button" class="btn btn-outline-danger btn-sm cart-remove-btn" aria-label="Премахни ${item.name}">
          &times;
        </button>
      </td>
    </tr>
  `;
}

function updateSummary(rootElement, cart) {
  const subtotal = getCartSubtotal(cart);
  const shipping = calculateShipping(subtotal);
  const total = calculateOrderTotal(subtotal);

  rootElement.querySelector("#cart-subtotal").textContent = formatPrice(subtotal);
  rootElement.querySelector("#cart-shipping").textContent =
    shipping === 0 ? "Безплатна" : formatPrice(shipping);
  rootElement.querySelector("#cart-total").textContent = formatPrice(total);
}

function renderCartContent(rootElement, cart) {
  const emptyState = rootElement.querySelector("#cart-empty");
  const content = rootElement.querySelector("#cart-content");
  const tbody = rootElement.querySelector("#cart-items-body");

  if (!cart.length) {
    renderEmptyState(rootElement);
    return;
  }

  emptyState.classList.add("d-none");
  content.classList.remove("d-none");
  tbody.innerHTML = cart.map(renderCartRow).join("");
  updateSummary(rootElement, cart);
}

function bindCartEvents(rootElement, navigate) {
  const tbody = rootElement.querySelector("#cart-items-body");
  const checkoutButton = rootElement.querySelector("#checkout-btn");

  tbody.addEventListener("input", (event) => {
    const input = event.target.closest(".cart-quantity-input");
    if (!input) {
      return;
    }

    const row = input.closest("[data-product-id]");
    const productId = row.dataset.productId;
    const quantity = Number(input.value);
    const cart = updateCartItemQuantity(productId, quantity);

    updateHeaderState({
      isAuthenticated: true,
      cartCount: cart.reduce((total, item) => total + item.quantity, 0)
    });

    renderCartContent(rootElement, cart);
  });

  tbody.addEventListener("click", (event) => {
    const removeButton = event.target.closest(".cart-remove-btn");
    if (!removeButton) {
      return;
    }

    const row = removeButton.closest("[data-product-id]");
    const productId = row.dataset.productId;
    const cart = removeFromCart(productId);

    updateHeaderState({
      isAuthenticated: true,
      cartCount: cart.reduce((total, item) => total + item.quantity, 0)
    });

    renderCartContent(rootElement, cart);
  });

  checkoutButton.addEventListener("click", async () => {
    const cart = getCart();

    if (!cart.length) {
      showToast("Количката е празна.", "warning");
      return;
    }

    const phone = rootElement.querySelector("#cart-phone").value.trim();
    const address = rootElement.querySelector("#cart-address").value.trim();

    if (!phone || !address) {
      showToast("Моля, въведете телефон и адрес.", "warning");
      return;
    }

    const user = getCurrentUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    checkoutButton.disabled = true;

    try {
      await createOrder(user.id, cart, phone, address);
      clearCart();
      updateHeaderState({ isAuthenticated: true, cartCount: 0 });
      showToast("Поръчката е създадена успешно.", "success");
      navigate("/profile");
    } catch (error) {
      showToast(error.message ?? "Неуспешно създаване на поръчка.", "danger");
    } finally {
      checkoutButton.disabled = false;
    }
  });
}

export function renderCartPage(rootElement, context) {
  if (!isAuthenticated()) {
    context.navigate("/auth");
    return;
  }

  rootElement.innerHTML = template;

  const cart = getCart();
  renderCartContent(rootElement, cart);
  bindCartEvents(rootElement, context.navigate);
}
