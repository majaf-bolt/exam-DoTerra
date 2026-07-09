export function getMyOrders() {
  return [];
}

export function createOrder(orderData) {
  return { id: crypto.randomUUID(), ...orderData };
}
