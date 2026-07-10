import { storage } from "./storage.js";

const CART_KEY = "doterra_cart";

export function getCart() {
  return storage.get(CART_KEY, []);
}

export function getCartCount() {
  return getCart().reduce((total, item) => total + item.quantity, 0);
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
