import { supabase } from "./supabase.js";
import { isAdmin } from "./auth.js";

function assertAdmin() {
  if (!isAdmin()) {
    throw new Error("Unauthorized");
  }
}

export async function getAllCustomers() {
  assertAdmin();

  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, full_name, email, phone, address, city, customer_tag, role, created_at")
    .eq("role", "user")
    .order("full_name");

  if (profilesError) {
    throw profilesError;
  }

  const { data: orders, error: ordersError } = await supabase
    .from("orders")
    .select("user_id");

  if (ordersError) {
    throw ordersError;
  }

  const orderCounts = {};
  (orders ?? []).forEach((order) => {
    orderCounts[order.user_id] = (orderCounts[order.user_id] ?? 0) + 1;
  });

  return (profiles ?? []).map((profile) => ({
    ...profile,
    orders_count: orderCounts[profile.id] ?? 0
  }));
}

export async function getCustomerById(customerId) {
  assertAdmin();

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, full_name, email, phone, address, city, customer_tag, created_at")
    .eq("id", customerId)
    .maybeSingle();

  if (profileError) {
    throw profileError;
  }

  if (!profile) {
    return null;
  }

  const { data: orders, error: ordersError } = await supabase
    .from("orders")
    .select(`
      id,
      total_price,
      status,
      created_at,
      order_items(quantity, price, products(name))
    `)
    .eq("user_id", customerId)
    .order("created_at", { ascending: false });

  if (ordersError) {
    throw ordersError;
  }

  return {
    ...profile,
    orders: orders ?? []
  };
}

export async function getCustomerNotes(customerId) {
  assertAdmin();

  const { data, error } = await supabase
    .from("customer_notes")
    .select("id, note, created_at, created_by")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function createCustomerNote(customerId, note, createdBy) {
  assertAdmin();

  const { data, error } = await supabase
    .from("customer_notes")
    .insert({
      customer_id: customerId,
      note,
      created_by: createdBy
    })
    .select("id, note, created_at")
    .single();

  if (error) {
    throw error;
  }

  return data;
}
