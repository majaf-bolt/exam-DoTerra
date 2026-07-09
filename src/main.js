import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "./styles/main.css";

import { createRouter } from "./utils/router.js";
import { isAdmin, isAuthenticated, logout } from "./services/auth.js";

import { renderHeader, bindHeaderEvents, updateHeaderState } from "./components/header/header.js";
import { renderFooter } from "./components/footer/footer.js";
import { showToast } from "./components/toast/toast.js";

import { renderHomePage } from "./pages/home/home.js";
import { renderProductsPage } from "./pages/products/products.js";
import { renderProductDetailsPage } from "./pages/product-details/product-details.js";
import { renderAuthPage } from "./pages/auth/auth.js";
import { renderProfilePage } from "./pages/profile/profile.js";
import { renderCartPage } from "./pages/cart/cart.js";
import { renderAdminPage } from "./pages/admin/admin.js";

const app = document.querySelector("#app");

app.innerHTML = `
  <div id="header-root"></div>
  <main id="page-root" class="container py-4"></main>
  <div id="footer-root"></div>
  <div id="toast-root" class="toast-container position-fixed bottom-0 end-0 p-3"></div>
`;

const headerRoot = document.querySelector("#header-root");
const footerRoot = document.querySelector("#footer-root");
const pageRoot = document.querySelector("#page-root");

renderHeader(headerRoot);
renderFooter(footerRoot);

const routes = [
  { path: "/", render: renderHomePage },
  { path: "/products", render: renderProductsPage },
  { path: "/products/:id", render: renderProductDetailsPage },
  { path: "/auth", render: renderAuthPage },
  { path: "/profile", render: renderProfilePage, protected: true },
  { path: "/cart", render: renderCartPage, protected: true },
  { path: "/admin", render: renderAdminPage, protected: true, adminOnly: true }
];

const router = createRouter({
  routes,
  rootElement: pageRoot,
  guards: {
    isAuthenticated,
    isAdmin
  },
  onAuthRequired: () => {
    showToast("Please sign in to continue.", "warning");
    router.navigate("/auth");
  },
  onForbidden: () => {
    showToast("You are not authorized to access admin panel.", "danger");
    router.navigate("/");
  }
});

bindHeaderEvents({
  navigate: router.navigate,
  logout: () => {
    logout();
    updateHeaderState({ isAuthenticated: false, cartCount: 0 });
    showToast("You were logged out successfully.", "info");
    router.navigate("/");
  }
});

updateHeaderState({
  isAuthenticated: isAuthenticated(),
  cartCount: 0
});

router.start();
