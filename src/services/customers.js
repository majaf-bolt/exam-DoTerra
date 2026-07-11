import { supabase } from "./supabase.js";

export async function getAllCustomers() {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, phone, address, city, customer_tag, role, created_at")
    .eq("role", "user")
    .order("full_name");

  if (error) {
    throw error;
  }

  return data ?? [];
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
