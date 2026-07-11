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
  getAllOrders
} from "../../services/orders.js";
import {
  getCustomers,
  getCustomerById,
  getCustomerOrders,
  getCustomerNotes,
  addCustomerNote,
  deleteCustomerNote,
  updateCustomerTag,
  updateOrderStatus,
  updateOrderSellerNote
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

let activeCustomerId = null;

function getInitials(name) {
  return (name ?? "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function renderCustomerAvatar(customer) {
  if (customer.avatar_url) {
    return `<img src="${customer.avatar_url}" alt="${customer.full_name}" class="customer-avatar" />`;
  }

  return `
    <div class="customer-avatar-placeholder d-inline-flex align-items-center justify-content-center">
      ${getInitials(customer.full_name)}
    </div>
  `;
}

function filterCustomers(customers, tagFilter, searchTerm) {
  const query = searchTerm.trim().toLowerCase();

  return customers.filter((customer) => {
    const matchesTag = !tagFilter || customer.customer_tag === tagFilter;
    const matchesSearch =
      !query ||
      (customer.full_name ?? "").toLowerCase().includes(query) ||
      (customer.email ?? "").toLowerCase().includes(query) ||
      (customer.phone ?? "").toLowerCase().includes(query);

    return matchesTag && matchesSearch;
  });
}

function renderCustomersTable(customers) {
  if (!customers.length) {
    return `<div class="alert alert-info">Няма намерени клиенти.</div>`;
  }

  const rows = customers
    .map(
      (customer) => `
        <tr data-customer-id="${customer.id}">
          <td>${renderCustomerAvatar(customer)}</td>
          <td>${customer.full_name ?? "—"}</td>
          <td>${customer.email ?? "—"}</td>
          <td>${customer.phone ?? "—"}</td>
          <td>
            <span class="badge text-bg-success">
              ${CUSTOMER_TAG_LABELS[customer.customer_tag] ?? customer.customer_tag}
            </span>
          </td>
          <td>${customer.orders_count ?? 0}</td>
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
            <th>Аватар</th>
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

function renderCustomerModalOrders(orders) {
  if (!orders?.length) {
    return `<p class="text-muted mb-0">Няма поръчки.</p>`;
  }

  return orders
    .map(
      (order) => `
        <div class="card mb-3" data-customer-order-id="${order.id}">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-start gap-3 mb-3">
              <div>
                <div class="fw-semibold">${shortId(order.id)}</div>
                <div class="text-muted small">${formatDate(order.created_at)}</div>
              </div>
              <div class="fw-semibold text-success">${formatPrice(order.total_price)}</div>
            </div>
            <label class="form-label">Статус</label>
            <select
              class="form-select form-select-sm mb-3 customer-order-status-select"
              data-order-id="${order.id}"
              data-old-status="${order.status}"
            >
              ${ORDER_STATUSES.map(
                (status) =>
                  `<option value="${status.value}" ${order.status === status.value ? "selected" : ""}>${status.label}</option>`
              ).join("")}
            </select>
            <label class="form-label">Бележка на продавача</label>
            <textarea
              class="form-control form-control-sm mb-2 customer-order-seller-note"
              rows="2"
              data-order-id="${order.id}"
            >${order.seller_note ?? ""}</textarea>
            <button type="button" class="btn btn-sm btn-outline-success save-customer-order-note-btn" data-order-id="${order.id}">
              Запази бележка
            </button>
          </div>
        </div>
      `
    )
    .join("");
}

function renderCustomerModalNotes(notes) {
  if (!notes.length) {
    return `<p class="text-muted mb-3">🔒 Няма частни бележки.</p>`;
  }

  return `
    <ul class="list-group list-group-flush mb-3">
      ${notes
        .map(
          (note) => `
            <li class="list-group-item private-note-item d-flex justify-content-between align-items-start gap-3" data-note-id="${note.id}">
              <div>
                <div class="mb-1">🔒 ${note.note}</div>
                <small class="text-muted">${formatDate(note.created_at)}</small>
              </div>
              <button type="button" class="btn btn-sm btn-outline-danger delete-customer-note-btn" data-note-id="${note.id}">
                ×
              </button>
            </li>
          `
        )
        .join("")}
    </ul>
  `;
}

function renderCustomerModalContent(customer, orders, notes) {
  return `
    <ul class="nav nav-tabs customer-modal-tabs mb-3" role="tablist">
      <li class="nav-item" role="presentation">
        <button class="nav-link active" data-bs-toggle="tab" data-bs-target="#customer-info-tab" type="button" role="tab">
          Информация
        </button>
      </li>
      <li class="nav-item" role="presentation">
        <button class="nav-link" data-bs-toggle="tab" data-bs-target="#customer-orders-tab" type="button" role="tab">
          Поръчки
        </button>
      </li>
      <li class="nav-item" role="presentation">
        <button class="nav-link" data-bs-toggle="tab" data-bs-target="#customer-notes-tab" type="button" role="tab">
          Бележки
        </button>
      </li>
    </ul>

    <div class="tab-content">
      <div class="tab-pane fade show active" id="customer-info-tab" role="tabpanel">
        <div class="text-center mb-4">${renderCustomerAvatar(customer)}</div>
        <ul class="list-group list-group-flush mb-4">
          <li class="list-group-item"><strong>Име:</strong> ${customer.full_name ?? "—"}</li>
          <li class="list-group-item"><strong>Имейл:</strong> ${customer.email ?? "—"}</li>
          <li class="list-group-item"><strong>Телефон:</strong> ${customer.phone ?? "—"}</li>
          <li class="list-group-item"><strong>Адрес:</strong> ${customer.address ?? "—"}</li>
          <li class="list-group-item"><strong>Град:</strong> ${customer.city ?? "—"}</li>
        </ul>
        <label for="customer-tag-select" class="form-label">Етикет на клиент</label>
        <select id="customer-tag-select" class="form-select" data-customer-id="${customer.id}">
          <option value="new" ${customer.customer_tag === "new" ? "selected" : ""}>Нов</option>
          <option value="vip" ${customer.customer_tag === "vip" ? "selected" : ""}>VIP</option>
          <option value="returning" ${customer.customer_tag === "returning" ? "selected" : ""}>Върнал се</option>
        </select>
      </div>

      <div class="tab-pane fade" id="customer-orders-tab" role="tabpanel">
        <div id="customer-orders-list">${renderCustomerModalOrders(orders)}</div>
      </div>

      <div class="tab-pane fade" id="customer-notes-tab" role="tabpanel">
        <div id="customer-notes-list">${renderCustomerModalNotes(notes)}</div>
        <form id="customer-note-form">
          <input type="hidden" id="customer-note-id" value="${customer.id}" />
          <div class="mb-2">
            <textarea class="form-control" id="customer-note-text" rows="2" placeholder="Добави частна бележка..." required></textarea>
          </div>
          <button type="submit" class="btn btn-sm btn-success">Добави бележка</button>
        </form>
      </div>
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
  activeCustomerId = customerId;

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
    const [customer, orders, notes] = await Promise.all([
      getCustomerById(customerId),
      getCustomerOrders(customerId),
      getCustomerNotes(customerId)
    ]);

    if (!customer) {
      modalBody.innerHTML = `<div class="alert alert-warning">Клиентът не е намерен.</div>`;
      return;
    }

    modalTitle.textContent = customer.full_name ?? "Профил на клиент";
    modalBody.innerHTML = renderCustomerModalContent(customer, orders, notes);
    bindCustomerModalEvents(rootElement);
  } catch {
    modalBody.innerHTML = `<div class="alert alert-warning">Неуспешно зареждане на клиента.</div>`;
  }
}

function bindCustomerModalEvents(rootElement) {
  const modalBody = rootElement.querySelector("#customer-modal-body");
  const admin = getCurrentUser();

  const tagSelect = modalBody.querySelector("#customer-tag-select");
  if (tagSelect) {
    tagSelect.addEventListener("change", async () => {
      try {
        await updateCustomerTag(tagSelect.dataset.customerId, tagSelect.value);
        const customer = customersCache.find((entry) => entry.id === tagSelect.dataset.customerId);
        if (customer) {
          customer.customer_tag = tagSelect.value;
        }
        renderFilteredCustomersTable(rootElement);
        showToast("Етикетът е обновен.", "success");
      } catch (error) {
        showToast(error.message ?? "Неуспешно обновяване на етикета.", "danger");
      }
    });
  }

  modalBody.addEventListener("change", async (event) => {
    const select = event.target.closest(".customer-order-status-select");
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
      showToast("Статусът на поръчката е обновен.", "success");
    } catch (error) {
      select.value = oldStatus;
      showToast(error.message ?? "Неуспешно обновяване на статуса.", "danger");
    } finally {
      select.disabled = false;
    }
  });

  modalBody.addEventListener("click", async (event) => {
    const saveNoteButton = event.target.closest(".save-customer-order-note-btn");
    const deleteNoteButton = event.target.closest(".delete-customer-note-btn");

    if (saveNoteButton) {
      const orderId = saveNoteButton.dataset.orderId;
      const textarea = modalBody.querySelector(`.customer-order-seller-note[data-order-id="${orderId}"]`);
      saveNoteButton.disabled = true;

      try {
        await updateOrderSellerNote(orderId, textarea.value.trim());
        showToast("Бележката към поръчката е запазена.", "success");
      } catch (error) {
        showToast(error.message ?? "Неуспешно запазване на бележката.", "danger");
      } finally {
        saveNoteButton.disabled = false;
      }
      return;
    }

    if (deleteNoteButton) {
      const noteId = deleteNoteButton.dataset.noteId;
      deleteNoteButton.disabled = true;

      try {
        await deleteCustomerNote(noteId);
        const notes = await getCustomerNotes(activeCustomerId);
        modalBody.querySelector("#customer-notes-list").innerHTML = renderCustomerModalNotes(notes);
        showToast("Бележката е изтрита.", "success");
      } catch (error) {
        showToast(error.message ?? "Неуспешно изтриване на бележката.", "danger");
      } finally {
        deleteNoteButton.disabled = false;
      }
    }
  });

  const noteForm = modalBody.querySelector("#customer-note-form");
  if (noteForm) {
    noteForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const customerId = modalBody.querySelector("#customer-note-id").value;
      const noteText = modalBody.querySelector("#customer-note-text").value.trim();
      const submitButton = noteForm.querySelector('[type="submit"]');

      if (!noteText) {
        return;
      }

      submitButton.disabled = true;

      try {
        await addCustomerNote(customerId, noteText, admin.id);
        const notes = await getCustomerNotes(customerId);
        modalBody.querySelector("#customer-notes-list").innerHTML = renderCustomerModalNotes(notes);
        modalBody.querySelector("#customer-note-text").value = "";
        showToast("Бележката е добавена.", "success");
      } catch (error) {
        showToast(error.message ?? "Неуспешно добавяне на бележка.", "danger");
      } finally {
        submitButton.disabled = false;
      }
    });
  }
}

function renderFilteredCustomersTable(rootElement) {
  const tagFilter = rootElement.querySelector("#customer-tag-filter")?.value ?? "";
  const searchTerm = rootElement.querySelector("#customer-search")?.value ?? "";
  const filtered = filterCustomers(customersCache, tagFilter, searchTerm);
  rootElement.querySelector("#customers-table-wrap").innerHTML = renderCustomersTable(filtered);
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
    customersCache = await getCustomers();
    renderFilteredCustomersTable(rootElement);
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
  const tagFilter = rootElement.querySelector("#customer-tag-filter");
  const searchInput = rootElement.querySelector("#customer-search");

  tagFilter?.addEventListener("change", () => renderFilteredCustomersTable(rootElement));
  searchInput?.addEventListener("input", () => renderFilteredCustomersTable(rootElement));

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
