import "./profile.css";
import template from "./profile.html?raw";
import { getCurrentUser, isAuthenticated, refreshCurrentUser } from "../../services/auth.js";
import { getProfile, updateProfile, uploadAvatar } from "../../services/profile.js";
import { getMyOrders } from "../../services/orders.js";
import { showToast } from "../../components/toast/toast.js";
import { formatPrice } from "../../utils/helpers.js";

const ORDER_STATUS_LABELS = {
  pending: "Изчаква",
  confirmed: "Потвърдена",
  shipped: "Изпратена",
  delivered: "Доставена",
  cancelled: "Отказана"
};

const ORDER_STATUS_VARIANTS = {
  pending: "warning",
  confirmed: "info",
  shipped: "primary",
  delivered: "success",
  cancelled: "danger"
};

function getInitials(name) {
  return (name ?? "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function formatOrderDate(value) {
  return new Date(value).toLocaleDateString("bg-BG", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function renderSkeleton(container) {
  container.innerHTML = `
    <div class="placeholder-glow" aria-hidden="true">
      <span class="placeholder col-12 mb-3" style="height: 140px;"></span>
      <span class="placeholder col-12 mb-3" style="height: 260px;"></span>
      <span class="placeholder col-12" style="height: 180px;"></span>
    </div>
  `;
}

function renderAvatar(profile) {
  const initials = getInitials(profile.full_name);

  if (profile.avatar_url) {
    return `<img src="${profile.avatar_url}" alt="${profile.full_name}" class="profile-avatar rounded-circle shadow-sm" />`;
  }

  return `
    <div class="profile-avatar-placeholder rounded-circle d-flex align-items-center justify-content-center shadow-sm">
      ${initials}
    </div>
  `;
}

function renderOrderAccordionItem(order, index) {
  const statusLabel = ORDER_STATUS_LABELS[order.status] ?? order.status;
  const statusVariant = ORDER_STATUS_VARIANTS[order.status] ?? "secondary";
  const collapseId = `order-collapse-${index}`;
  const headingId = `order-heading-${index}`;
  const items = order.order_items ?? [];

  const itemsMarkup = items.length
    ? items
        .map((item) => {
          const productName = item.products?.name ?? "Продукт";
          const lineTotal = Number(item.price) * Number(item.quantity);
          return `
            <li class="list-group-item d-flex justify-content-between align-items-center">
              <span>${productName} × ${item.quantity}</span>
              <span class="fw-semibold">${formatPrice(lineTotal)}</span>
            </li>
          `;
        })
        .join("")
    : `<li class="list-group-item text-muted">Няма артикули</li>`;

  return `
    <div class="accordion-item">
      <h2 class="accordion-header" id="${headingId}">
        <button
          class="accordion-button ${index === 0 ? "" : "collapsed"}"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#${collapseId}"
          aria-expanded="${index === 0}"
          aria-controls="${collapseId}"
        >
          <span class="me-3">${formatOrderDate(order.created_at)}</span>
          <span class="badge text-bg-${statusVariant} order-status-badge">${statusLabel}</span>
          <span class="ms-auto me-3 fw-semibold text-success">${formatPrice(order.total_price)}</span>
        </button>
      </h2>
      <div
        id="${collapseId}"
        class="accordion-collapse collapse ${index === 0 ? "show" : ""}"
        aria-labelledby="${headingId}"
      >
        <div class="accordion-body">
          <p class="mb-2"><strong>Телефон:</strong> ${order.shipping_phone ?? "—"}</p>
          <p class="mb-3"><strong>Адрес:</strong> ${order.shipping_address ?? "—"}</p>
          <ul class="list-group list-group-flush">${itemsMarkup}</ul>
        </div>
      </div>
    </div>
  `;
}

function renderOrdersSection(orders) {
  if (!orders.length) {
    return `
      <div class="card profile-card shadow-sm">
        <div class="card-body">
          <h2 class="h5 card-title mb-3">История на поръчките</h2>
          <div class="alert alert-info mb-0">Все още нямате поръчки.</div>
        </div>
      </div>
    `;
  }

  return `
    <div class="card profile-card shadow-sm">
      <div class="card-body">
        <h2 class="h5 card-title mb-3">История на поръчките</h2>
        <div class="accordion" id="orders-accordion">
          ${orders.map(renderOrderAccordionItem).join("")}
        </div>
      </div>
    </div>
  `;
}

function renderProfilePageContent(user, profile, orders) {
  return `
    <div class="row g-4">
      <div class="col-lg-4">
        <div class="card profile-card shadow-sm h-100">
          <div class="card-body text-center">
            <div class="mb-3" id="profile-avatar-wrap">
              ${renderAvatar(profile)}
            </div>
            <label class="btn btn-outline-success btn-sm mb-3">
              Качи снимка
              <input type="file" id="avatar-input" class="d-none" accept="image/*" />
            </label>
            <h2 class="h5 mb-1">${profile.full_name ?? user.fullName}</h2>
            <p class="text-muted mb-2">${user.email}</p>
            <span class="badge text-bg-success">${profile.role}</span>
          </div>
        </div>
      </div>

      <div class="col-lg-8">
        <div class="card profile-card shadow-sm mb-4">
          <div class="card-body">
            <h2 class="h5 card-title mb-3">Редактиране на профил</h2>
            <form id="profile-form" novalidate>
              <div class="mb-3">
                <label for="profile-full-name" class="form-label">Пълно име</label>
                <input
                  type="text"
                  class="form-control"
                  id="profile-full-name"
                  value="${profile.full_name ?? ""}"
                  required
                />
              </div>
              <div class="mb-3">
                <label for="profile-phone" class="form-label">Телефон</label>
                <input
                  type="tel"
                  class="form-control"
                  id="profile-phone"
                  value="${profile.phone ?? ""}"
                />
              </div>
              <div class="mb-3">
                <label for="profile-address" class="form-label">Адрес</label>
                <input
                  type="text"
                  class="form-control"
                  id="profile-address"
                  value="${profile.address ?? ""}"
                />
              </div>
              <div class="mb-4">
                <label for="profile-city" class="form-label">Град</label>
                <input
                  type="text"
                  class="form-control"
                  id="profile-city"
                  value="${profile.city ?? ""}"
                />
              </div>
              <button type="submit" class="btn btn-success">Запази промените</button>
            </form>
          </div>
        </div>

        ${renderOrdersSection(orders)}
      </div>
    </div>
  `;
}

function bindProfileForm(rootElement, user) {
  const form = rootElement.querySelector("#profile-form");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!form.checkValidity()) {
      form.classList.add("was-validated");
      return;
    }

    const submitButton = form.querySelector('[type="submit"]');
    submitButton.disabled = true;

    try {
      await updateProfile(user.id, {
        fullName: rootElement.querySelector("#profile-full-name").value.trim(),
        phone: rootElement.querySelector("#profile-phone").value.trim(),
        address: rootElement.querySelector("#profile-address").value.trim(),
        city: rootElement.querySelector("#profile-city").value.trim()
      });

      await refreshCurrentUser();
      showToast("Профилът е обновен успешно.", "success");
    } catch (error) {
      showToast(error.message ?? "Неуспешно обновяване на профила.", "danger");
    } finally {
      submitButton.disabled = false;
    }
  });
}

function bindAvatarUpload(rootElement, user) {
  const input = rootElement.querySelector("#avatar-input");
  const avatarWrap = rootElement.querySelector("#profile-avatar-wrap");

  input.addEventListener("change", async () => {
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      showToast("Моля, изберете изображение.", "warning");
      input.value = "";
      return;
    }

    try {
      const avatarUrl = await uploadAvatar(user.id, file);
      avatarWrap.innerHTML = `<img src="${avatarUrl}" alt="${user.fullName}" class="profile-avatar rounded-circle shadow-sm" />`;
      await refreshCurrentUser();
      showToast("Снимката е качена успешно.", "success");
    } catch (error) {
      showToast(error.message ?? "Неуспешно качване на снимка.", "danger");
    } finally {
      input.value = "";
    }
  });
}

export async function renderProfilePage(rootElement, context) {
  if (!isAuthenticated()) {
    context.navigate("/auth");
    return;
  }

  rootElement.innerHTML = template;

  const user = getCurrentUser();
  const container = rootElement.querySelector("#profile-content");

  if (!user) {
    container.innerHTML = `<div class="alert alert-warning">Не сте влезли в профила си.</div>`;
    return;
  }

  renderSkeleton(container);

  try {
    const [profile, orders] = await Promise.all([
      getProfile(user.id),
      getMyOrders(user.id)
    ]);

    if (!profile) {
      container.innerHTML = `<div class="alert alert-warning">Профилът не е намерен.</div>`;
      return;
    }

    container.innerHTML = renderProfilePageContent(user, profile, orders);
    bindProfileForm(rootElement, user);
    bindAvatarUpload(rootElement, user);
  } catch (error) {
    container.innerHTML = `<div class="alert alert-warning">Неуспешно зареждане на профила.</div>`;
    console.error(error);
  }
}
