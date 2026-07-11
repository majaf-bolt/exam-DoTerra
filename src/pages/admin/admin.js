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
import {
  getAllCustomers,
  getCustomerById,
  getCustomerNotes,
  createCustomerNote
} from "../../services/customers.js";
import { showToast } from "../../components/toast/toast.js";
import { formatPrice, getCategoryLabel, getProductImageUrl } from "../../utils/helpers.js";

const ORDER_STATUSES = [
  { value: "pending", label: "Изчаква" },
  { value: "confirmed", label: "Потвърдена" },
  { value: "shipped", label: "Изпратена" },
  { value: "delivered", label: "Доставена" },
  { value: "cancelled", label: "Отказана" }
];

const ORDER_STATUS_LABELS = Object.fromEntries(
  ORDER_STATUSES.map((status) => [status.value, status.label])
);

const CUSTOMER_TAG_LABELS = {
  new: "Нов",
  vip: "VIP",
  returning: "Върнал се"
};

let productModal = null;
let deleteProductModal = null;
let customerModal = null;
let productsCache = [];
let ordersCache = [];
let customersCache = [];
let pendingDeleteProductId = null;

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
      const clientEmail = order.profiles?.email ?? "—";
      const phone = order.shipping_phone ?? order.profiles?.phone ?? "—";
      const collapseId = `order-details-${index}`;

      return `
        <tr>
          <td><span class="admin-short-id">${shortId(order.id)}</span></td>
          <td>${clientEmail}</td>
          <td>${phone}</td>
          <td>${formatDate(order.created_at)}</td>
          <td>${renderStatusSelect(order)}</td>
          <td class="fw-semibold text-success">${formatPrice(order.total_price)}</td>
          <td>
            <textarea
              class="form-control form-control-sm seller-note-input mb-2"
              rows="2"
              data-order-id="${order.id}"
              placeholder="Бележка на продавача"
            >${order.seller_note ?? ""}</textarea>
            <button type="button" class="btn btn-sm btn-outline-success save-seller-note-btn" data-order-id="${order.id}">
              Запази
            </button>
          </td>
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
          <td colspan="8">
            <div class="p-3">
              <h3 class="h6 mb-2">Артикули</h3>
              ${renderOrderItems(order.order_items)}
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
            <th>Имейл</th>
            <th>Телефон</th>
            <th>Дата</th>
            <th>Статус</th>
            <th>Сума</th>
            <th>Бележка</th>
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
        <tr data-customer-id="${customer.id}">
          <td>${customer.full_name ?? "—"}</td>
          <td>${customer.email ?? "—"}</td>
          <td>${customer.phone ?? "—"}</td>
          <td>
            <span class="badge text-bg-success">
              ${CUSTOMER_TAG_LABELS[customer.customer_tag] ?? customer.customer_tag}
            </span>
          </td>
          <td>${customer.orders?.[0]?.count ?? 0}</td>
          <td>
            <button type="button" class="btn btn-sm btn-outline-success customer-profile-btn">Профил</button>
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
            <th>Име</th>
            <th>Имейл</th>
            <th>Телефон</th>
            <th>Етикет</th>
            <th>Поръчки</th>
            <th></th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

function renderCustomerOrders(orders) {
  if (!orders?.length) {
    return `<p class="text-muted mb-0">Няма поръчки.</p>`;
  }

  const sorted = [...orders].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return `
    <div class="list-group list-group-flush">
      ${sorted
        .map((order) => {
          const itemsCount = order.order_items?.length ?? 0;
          return `
            <div class="list-group-item">
              <div class="d-flex justify-content-between align-items-start gap-3">
                <div>
                  <div class="fw-semibold">${shortId(order.id)} · ${formatDate(order.created_at)}</div>
                  <div class="text-muted small">${itemsCount} артикула</div>
                </div>
                <div class="text-end">
                  <span class="badge text-bg-secondary">${ORDER_STATUS_LABELS[order.status] ?? order.status}</span>
                  <div class="fw-semibold text-success mt-1">${formatPrice(order.total_price)}</div>
                </div>
              </div>
            </div>
          `;
        })
        .join("")}
    </div>
  `;
}

function renderCustomerNotes(notes) {
  if (!notes.length) {
    return `<p class="text-muted mb-3">Няма частни бележки.</p>`;
  }

  return `
    <ul class="list-group list-group-flush mb-3">
      ${notes
        .map(
          (note) => `
            <li class="list-group-item">
              <p class="mb-1">${note.note}</p>
              <small class="text-muted">${formatDate(note.created_at)}</small>
            </li>
          `
        )
        .join("")}
    </ul>
  `;
}

function renderCustomerModalContent(customer, notes) {
  return `
    <div class="mb-4">
      <h2 class="h6 text-success">Информация</h2>
      <ul class="list-group list-group-flush">
        <li class="list-group-item"><strong>Име:</strong> ${customer.full_name ?? "—"}</li>
        <li class="list-group-item"><strong>Имейл:</strong> ${customer.email ?? "—"}</li>
        <li class="list-group-item"><strong>Телефон:</strong> ${customer.phone ?? "—"}</li>
        <li class="list-group-item"><strong>Адрес:</strong> ${customer.address ?? "—"}</li>
        <li class="list-group-item"><strong>Град:</strong> ${customer.city ?? "—"}</li>
        <li class="list-group-item">
          <strong>Етикет:</strong>
          <span class="badge text-bg-success ms-2">
            ${CUSTOMER_TAG_LABELS[customer.customer_tag] ?? customer.customer_tag}
          </span>
        </li>
      </ul>
    </div>

    <div class="mb-4">
      <h2 class="h6 text-success">История на поръчките</h2>
      ${renderCustomerOrders(customer.orders)}
    </div>

    <div>
      <h2 class="h6 text-success">Частни бележки</h2>
      <div id="customer-notes-list">${renderCustomerNotes(notes)}</div>
      <form id="customer-note-form">
        <input type="hidden" id="customer-note-id" value="${customer.id}" />
        <div class="mb-2">
          <textarea class="form-control" id="customer-note-text" rows="2" placeholder="Добави бележка..." required></textarea>
        </div>
        <button type="submit" class="btn btn-sm btn-success">Добави бележка</button>
      </form>
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

function openDeleteProductModal(rootElement, product) {
  pendingDeleteProductId = product.id;
  rootElement.querySelector("#delete-product-message").textContent =
    `Сигурни ли сте, че искате да изтриете "${product.name}"?`;

  if (!deleteProductModal) {
    deleteProductModal = new Modal(rootElement.querySelector("#delete-product-modal"));
  }

  deleteProductModal.show();
}

async function openCustomerModal(rootElement, customerId) {
  const modalBody = rootElement.querySelector("#customer-modal-body");
  const modalTitle = rootElement.querySelector("#customer-modal-title");

  modalBody.innerHTML = `
    <div class="placeholder-glow" aria-hidden="true">
      <span class="placeholder col-12" style="height: 200px;"></span>
    </div>
  `;

  if (!customerModal) {
    customerModal = new Modal(rootElement.querySelector("#customer-modal"));
  }

  customerModal.show();

  try {
    const [customer, notes] = await Promise.all([
      getCustomerById(customerId),
      getCustomerNotes(customerId)
    ]);

    if (!customer) {
      modalBody.innerHTML = `<div class="alert alert-warning">Клиентът не е намерен.</div>`;
      return;
    }

    modalTitle.textContent = customer.full_name ?? "Профил на клиент";
    modalBody.innerHTML = renderCustomerModalContent(customer, notes);
    bindCustomerNoteForm(rootElement);
  } catch {
    modalBody.innerHTML = `<div class="alert alert-warning">Неуспешно зареждане на клиента.</div>`;
  }
}

function bindCustomerNoteForm(rootElement) {
  const form = rootElement.querySelector("#customer-note-form");
  if (!form) {
    return;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const customerId = rootElement.querySelector("#customer-note-id").value;
    const noteText = rootElement.querySelector("#customer-note-text").value.trim();
    const admin = getCurrentUser();
    const submitButton = form.querySelector('[type="submit"]');

    if (!noteText) {
      return;
    }

    submitButton.disabled = true;

    try {
      await createCustomerNote(customerId, noteText, admin.id);
      const notes = await getCustomerNotes(customerId);
      rootElement.querySelector("#customer-notes-list").innerHTML = renderCustomerNotes(notes);
      rootElement.querySelector("#customer-note-text").value = "";
      showToast("Бележката е добавена.", "success");
    } catch (error) {
      showToast(error.message ?? "Неуспешно добавяне на бележка.", "danger");
    } finally {
      submitButton.disabled = false;
    }
  });
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
    customersCache = await getAllCustomers();
    container.innerHTML = renderCustomersTable(customersCache);
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

  rootElement.querySelector("#confirm-delete-product-btn").addEventListener("click", async () => {
    if (!pendingDeleteProductId) {
      return;
    }

    const button = rootElement.querySelector("#confirm-delete-product-btn");
    button.disabled = true;

    try {
      await deleteProduct(pendingDeleteProductId);
      deleteProductModal?.hide();
      pendingDeleteProductId = null;
      showToast("Продуктът е изтрит.", "success");
      await loadProductsTab(rootElement);
    } catch (error) {
      showToast(error.message ?? "Неуспешно изтриване.", "danger");
    } finally {
      button.disabled = false;
    }
  });

  wrap.addEventListener("click", (event) => {
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
      openDeleteProductModal(rootElement, product);
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

function bindCustomersTab(rootElement) {
  const wrap = rootElement.querySelector("#customers-table-wrap");

  wrap.addEventListener("click", (event) => {
    const profileButton = event.target.closest(".customer-profile-btn");
    if (!profileButton) {
      return;
    }

    const customerId = profileButton.closest("[data-customer-id]").dataset.customerId;
    openCustomerModal(rootElement, customerId);
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
  bindCustomersTab(rootElement);
  bindAdminTabs(rootElement);

  await loadProductsTab(rootElement);
}
