import { supabase } from "./supabase.js";

export async function getAllCustomers() {
  const { data, error } = await supabase
    .from("profiles")
    .select(`
      id,
      full_name,
      email,
      phone,
      address,
      city,
      customer_tag,
      role,
      created_at,
      orders(count)
    `)
    .eq("role", "user")
    .order("full_name");

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function getCustomerById(customerId) {
  const { data, error } = await supabase
    .from("profiles")
    .select(`
      id,
      full_name,
      email,
      phone,
      address,
      city,
      customer_tag,
      created_at,
      orders(
        id,
        total_price,
        status,
        created_at,
        order_items(quantity, price, products(name))
      )
    `)
    .eq("id", customerId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function getCustomerNotes(customerId) {
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
