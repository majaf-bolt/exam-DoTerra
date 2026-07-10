import { supabase } from "./supabase.js";

export async function getFeaturedProducts(limit = 4) {
  const { data, error } = await supabase
    .from("products")
    .select("id, name, price, image_url, category")
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function getProducts(category = null) {
  let query = supabase.from("products").select("*").order("name");

  if (category) {
    query = query.eq("category", category);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function getProduct(id) {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function createProduct(product) {
  const { data, error } = await supabase
    .from("products")
    .insert(product)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateProduct(id, product) {
  const { data, error } = await supabase
    .from("products")
    .update(product)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function deleteProduct(id) {
  const { error } = await supabase.from("products").delete().eq("id", id);

  if (error) {
    throw error;
  }
}
