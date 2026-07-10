import { storage } from "./storage.js";

const CART_KEY = "doterra_cart";

export function getCart() {
  return storage.get(CART_KEY, []);
}

export function getCartCount() {
  return getCart().reduce((total, item) => total + item.quantity, 0);
}

export function saveCart(cart) {
  storage.set(CART_KEY, cart);
}

export function clearCart() {
  storage.remove(CART_KEY);
}

export function updateCartItemQuantity(productId, quantity) {
  const cart = getCart();
  const item = cart.find((entry) => entry.productId === productId);

  if (!item) {
    return cart;
  }

  if (quantity <= 0) {
    return removeFromCart(productId);
  }

  item.quantity = quantity;
  saveCart(cart);
  return cart;
}

export function removeFromCart(productId) {
  const cart = getCart().filter((entry) => entry.productId !== productId);
  saveCart(cart);
  return cart;
}

export function getCartSubtotal(cart = getCart()) {
  return cart.reduce(
    (total, item) => total + Number(item.price) * Number(item.quantity),
    0
  );
}

export function addToCart(product, quantity) {
  const cart = getCart();
  const existingItem = cart.find((item) => item.productId === product.id);

  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    cart.push({
      productId: product.id,
      name: product.name,
      price: product.price,
      image_url: product.image_url,
      quantity
    });
  }

  storage.set(CART_KEY, cart);
  return cart;
}
