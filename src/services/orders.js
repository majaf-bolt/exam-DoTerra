import { supabase } from "./supabase.js";

const FREE_SHIPPING_THRESHOLD = 100;
const SHIPPING_COST = 8;

export function calculateShipping(subtotal) {
  return Number(subtotal) >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
}

export function calculateOrderTotal(subtotal) {
  return Number(subtotal) + calculateShipping(subtotal);
}

export async function createOrder(userId, items, phone, address) {
  const subtotal = items.reduce(
    (total, item) => total + Number(item.price) * Number(item.quantity),
    0
  );
  const totalPrice = calculateOrderTotal(subtotal);

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      user_id: userId,
      total_price: totalPrice,
      shipping_phone: phone,
      shipping_address: address,
      status: "pending"
    })
    .select("id, total_price, status, created_at")
    .single();

  if (orderError) {
    throw orderError;
  }

  const orderItems = items.map((item) => ({
    order_id: order.id,
    product_id: item.productId,
    quantity: item.quantity,
    price: item.price
  }));

  const { error: itemsError } = await supabase.from("order_items").insert(orderItems);

  if (itemsError) {
    throw itemsError;
  }

  return order;
}

export async function getMyOrders(userId) {
  const { data, error } = await supabase
    .from("orders")
    .select("id, total_price, status, shipping_phone, shipping_address, created_at, order_items(id, quantity, price, product_id)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data ?? [];
}
