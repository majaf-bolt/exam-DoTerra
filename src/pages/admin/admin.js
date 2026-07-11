import { Modal } from "bootstrap";
import "./admin.css";
import template from "./admin.html?raw";
import { isAdmin, isAuthenticated, getCurrentUser } from "../../services/auth.js";
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct
} from "../../services/products.js";
import {
  getAllOrders,
  updateOrderStatus,
  updateOrderSellerNote
} from "../../services/orders.js";
import { getAllCustomers } from "../../services/customers.js";
import { showToast } from "../../components/toast/toast.js";
import { formatPrice, getCategoryLabel, getProductImageUrl } from "../../utils/helpers.js";

const ORDER_STATUSES = [
  { value: "pending", label: "Изчаква" },
  { value: "confirmed", label: "Потвърдена" },
  { value: "shipped", label: "Изпратена" },
  { value: "delivered", label: "Доставена" },
  { value: "cancelled", label: "Отказана" }
];

const CUSTOMER_TAG_LABELS = {
  new: "Нов",
  vip: "VIP",
  returning: "Върнал се"
};

let productModal = null;
let productsCache = [];
let ordersCache = [];

function formatDate(value) {
  return new Date(value).toLocaleDateString("bg-BG", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function shortId(id) {
  return id.slice(0, 8);
}

function renderLoading(container) {
  container.innerHTML = `
    <div class="placeholder-glow" aria-hidden="true">
      <span class="placeholder col-12" style="height: 120px;"></span>
    </div>
  `;
}

function renderProductsTable(products) {
  if (!products.length) {
    return `<div class="alert alert-info">Няма продукти.</div>`;
  }

  const rows = products
    .map(
      (product) => `
        <tr data-product-id="${product.id}">
          <td>
            <img src="${getProductImageUrl(product.image_url)}" alt="${product.name}" />
          </td>
          <td>${product.name}</td>
          <td>${getCategoryLabel(product.category)}</td>
          <td>${formatPrice(product.price)}</td>
          <td>${product.stock}</td>
          <td class="text-nowrap">
            <button type="button" class="btn btn-sm btn-outline-success edit-product-btn">Редактирай</button>
            <button type="button" class="btn btn-sm btn-outline-danger delete-product-btn">Изтрий</button>
          </td>
        </tr>
      `
    )
    .join("");

  return `
    <div class="table-responsive">
      <table class="table table-hover align-middle admin-table">
        <thead>
          <tr>
            <th>Снимка</th>
            <th>Име</th>
            <th>Категория</th>
            <th>Цена</th>
            <th>Наличност</th>
            <th></th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

function renderStatusSelect(order) {
  const options = ORDER_STATUSES.map(
    (status) =>
      `<option value="${status.value}" ${order.status === status.value ? "selected" : ""}>${status.label}</option>`
  ).join("");

  return `
    <select class="form-select form-select-sm order-status-select" data-order-id="${order.id}" data-old-status="${order.status}">
      ${options}
    </select>
  `;
}

function renderOrderItems(items) {
  if (!items?.length) {
    return `<p class="text-muted mb-0">Няма артикули.</p>`;
  }

  return `
    <ul class="list-group list-group-flush">
      ${items
        .map((item) => {
          const name = item.products?.name ?? "Продукт";
          const total = Number(item.price) * Number(item.quantity);
          return `
            <li class="list-group-item d-flex justify-content-between">
              <span>${name} × ${item.quantity}</span>
              <span class="fw-semibold">${formatPrice(total)}</span>
            </li>
          `;
        })
        .join("")}
    </ul>
  `;
}

function renderOrdersTable(orders) {
  if (!orders.length) {
    return `<div class="alert alert-info">Няма поръчки.</div>`;
  }

  const rows = orders
    .map((order, index) => {
      const clientName = order.profiles?.full_name ?? "—";
      const phone = order.shipping_phone ?? order.profiles?.phone ?? "—";
      const collapseId = `order-details-${index}`;

      return `
        <tr>
          <td><span class="admin-short-id">${shortId(order.id)}</span></td>
          <td>${clientName}</td>
          <td>${phone}</td>
          <td>${formatDate(order.created_at)}</td>
          <td>${renderStatusSelect(order)}</td>
          <td class="fw-semibold text-success">${formatPrice(order.total_price)}</td>
          <td>
            <button
              type="button"
              class="btn btn-sm btn-outline-success order-details-btn"
              data-bs-toggle="collapse"
              data-bs-target="#${collapseId}"
              aria-expanded="false"
            >
              Детайли
            </button>
          </td>
        </tr>
        <tr class="collapse admin-order-details" id="${collapseId}">
          <td colspan="7">
            <div class="p-3">
              <h3 class="h6 mb-2">Артикули</h3>
              ${renderOrderItems(order.order_items)}
              <div class="mt-3">
                <label class="form-label" for="seller-note-${index}">Бележка на продавача</label>
                <textarea class="form-control seller-note-input mb-2" id="seller-note-${index}" rows="2" data-order-id="${order.id}">${order.seller_note ?? ""}</textarea>
                <button type="button" class="btn btn-sm btn-success save-seller-note-btn" data-order-id="${order.id}">
                  Запази бележка
                </button>
              </div>
            </div>
          </td>
        </tr>
      `;
    })
    .join("");

  return `
    <div class="table-responsive">
      <table class="table table-hover align-middle admin-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Клиент</th>
            <th>Телефон</th>
            <th>Дата</th>
            <th>Статус</th>
            <th>Сума</th>
            <th></th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

function renderCustomersTable(customers) {
  if (!customers.length) {
    return `<div class="alert alert-info">Няма клиенти.</div>`;
  }

  const rows = customers
    .map(
      (customer) => `
        <tr>
          <td>${customer.full_name ?? "—"}</td>
          <td>${customer.phone ?? "—"}</td>
          <td>${customer.city ?? "—"}</td>
          <td>
            <span class="badge text-bg-success">
              ${CUSTOMER_TAG_LABELS[customer.customer_tag] ?? customer.customer_tag}
            </span>
          </td>
          <td>${formatDate(customer.created_at)}</td>
        </tr>
      `
    )
    .join("");

  return `
    <div class="table-responsive">
      <table class="table table-hover align-middle admin-table">
        <thead>
          <tr>
            <th>Име</th>
            <th>Телефон</th>
            <th>Град</th>
            <th>Етикет</th>
            <th>Регистрация</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

function getProductFormData(rootElement) {
  return {
    name: rootElement.querySelector("#product-name").value.trim(),
    category: rootElement.querySelector("#product-category").value,
    price: Number(rootElement.querySelector("#product-price").value),
    stock: Number(rootElement.querySelector("#product-stock").value),
    image_url: rootElement.querySelector("#product-image-url").value.trim() || null,
    description: rootElement.querySelector("#product-description").value.trim() || null
  };
}

function openProductModal(rootElement, product = null) {
  const modalElement = rootElement.querySelector("#product-modal");
  const title = rootElement.querySelector("#product-modal-title");
  const form = rootElement.querySelector("#product-form");

  rootElement.querySelector("#product-id").value = product?.id ?? "";
  rootElement.querySelector("#product-name").value = product?.name ?? "";
  rootElement.querySelector("#product-category").value = product?.category ?? "oils";
  rootElement.querySelector("#product-price").value = product?.price ?? "";
  rootElement.querySelector("#product-stock").value = product?.stock ?? 0;
  rootElement.querySelector("#product-image-url").value = product?.image_url ?? "";
  rootElement.querySelector("#product-description").value = product?.description ?? "";

  title.textContent = product ? "Редактиране на продукт" : "Добавяне на продукт";
  form.classList.remove("was-validated");

  if (!productModal) {
    productModal = new Modal(modalElement);
  }

  productModal.show();
}

async function loadProductsTab(rootElement) {
  const container = rootElement.querySelector("#products-table-wrap");
  renderLoading(container);

  try {
    productsCache = await getProducts();
    container.innerHTML = renderProductsTable(productsCache);
  } catch {
    container.innerHTML = `<div class="alert alert-warning">Неуспешно зареждане на продуктите.</div>`;
  }
}

async function loadOrdersTab(rootElement) {
  const container = rootElement.querySelector("#orders-table-wrap");
  renderLoading(container);

  try {
    ordersCache = await getAllOrders();
    container.innerHTML = renderOrdersTable(ordersCache);
  } catch {
    container.innerHTML = `<div class="alert alert-warning">Неуспешно зареждане на поръчките.</div>`;
  }
}

async function loadCustomersTab(rootElement) {
  const container = rootElement.querySelector("#customers-table-wrap");
  renderLoading(container);

  try {
    const customers = await getAllCustomers();
    container.innerHTML = renderCustomersTable(customers);
  } catch {
    container.innerHTML = `<div class="alert alert-warning">Неуспешно зареждане на клиентите.</div>`;
  }
}

function bindProductsTab(rootElement) {
  const wrap = rootElement.querySelector("#products-table-wrap");

  rootElement.querySelector("#add-product-btn").addEventListener("click", () => {
    openProductModal(rootElement);
  });

  rootElement.querySelector("#product-form").addEventListener("submit", async (event) => {
    event.preventDefault();

    const form = event.currentTarget;
    if (!form.checkValidity()) {
      form.classList.add("was-validated");
      return;
    }

    const productId = rootElement.querySelector("#product-id").value;
    const payload = getProductFormData(rootElement);
    const submitButton = form.querySelector('[type="submit"]');
    submitButton.disabled = true;

    try {
      if (productId) {
        await updateProduct(productId, payload);
        showToast("Продуктът е обновен.", "success");
      } else {
        await createProduct(payload);
        showToast("Продуктът е добавен.", "success");
      }

      productModal?.hide();
      await loadProductsTab(rootElement);
    } catch (error) {
      showToast(error.message ?? "Неуспешно запазване на продукта.", "danger");
    } finally {
      submitButton.disabled = false;
    }
  });

  wrap.addEventListener("click", async (event) => {
    const editButton = event.target.closest(".edit-product-btn");
    const deleteButton = event.target.closest(".delete-product-btn");

    if (editButton) {
      const productId = editButton.closest("[data-product-id]").dataset.productId;
      const product = productsCache.find((entry) => entry.id === productId);
      openProductModal(rootElement, product);
      return;
    }

    if (deleteButton) {
      const productId = deleteButton.closest("[data-product-id]").dataset.productId;
      const product = productsCache.find((entry) => entry.id === productId);

      if (!window.confirm(`Сигурни ли сте, че искате да изтриете "${product?.name}"?`)) {
        return;
      }

      try {
        await deleteProduct(productId);
        showToast("Продуктът е изтрит.", "success");
        await loadProductsTab(rootElement);
      } catch (error) {
        showToast(error.message ?? "Неуспешно изтриване.", "danger");
      }
    }
  });
}

function bindOrdersTab(rootElement) {
  const wrap = rootElement.querySelector("#orders-table-wrap");
  const admin = getCurrentUser();

  wrap.addEventListener("change", async (event) => {
    const select = event.target.closest(".order-status-select");
    if (!select) {
      return;
    }

    const orderId = select.dataset.orderId;
    const oldStatus = select.dataset.oldStatus;
    const newStatus = select.value;

    if (oldStatus === newStatus) {
      return;
    }

    select.disabled = true;

    try {
      await updateOrderStatus(orderId, {
        oldStatus,
        newStatus,
        changedBy: admin.id
      });

      select.dataset.oldStatus = newStatus;
      const order = ordersCache.find((entry) => entry.id === orderId);
      if (order) {
        order.status = newStatus;
      }

      showToast("Статусът е обновен.", "success");
    } catch (error) {
      select.value = oldStatus;
      showToast(error.message ?? "Неуспешно обновяване на статуса.", "danger");
    } finally {
      select.disabled = false;
    }
  });

  wrap.addEventListener("click", async (event) => {
    const saveButton = event.target.closest(".save-seller-note-btn");
    if (!saveButton) {
      return;
    }

    const orderId = saveButton.dataset.orderId;
    const textarea = wrap.querySelector(`.seller-note-input[data-order-id="${orderId}"]`);
    saveButton.disabled = true;

    try {
      await updateOrderSellerNote(orderId, textarea.value.trim());
      const order = ordersCache.find((entry) => entry.id === orderId);
      if (order) {
        order.seller_note = textarea.value.trim();
      }
      showToast("Бележката е запазена.", "success");
    } catch (error) {
      showToast(error.message ?? "Неуспешно запазване на бележката.", "danger");
    } finally {
      saveButton.disabled = false;
    }
  });
}

function bindAdminTabs(rootElement) {
  const ordersTab = rootElement.querySelector("#orders-tab-btn");
  const customersTab = rootElement.querySelector("#customers-tab-btn");

  let ordersLoaded = false;
  let customersLoaded = false;

  ordersTab.addEventListener("shown.bs.tab", () => {
    if (!ordersLoaded) {
      ordersLoaded = true;
      loadOrdersTab(rootElement);
    }
  });

  customersTab.addEventListener("shown.bs.tab", () => {
    if (!customersLoaded) {
      customersLoaded = true;
      loadCustomersTab(rootElement);
    }
  });
}

export async function renderAdminPage(rootElement, context) {
  if (!isAuthenticated() || !isAdmin()) {
    context.navigate("/");
    return;
  }

  rootElement.innerHTML = template;

  bindProductsTab(rootElement);
  bindOrdersTab(rootElement);
  bindAdminTabs(rootElement);

  await loadProductsTab(rootElement);
}
