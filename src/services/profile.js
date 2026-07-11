import { supabase } from "./supabase.js";

const AVATAR_BUCKET = "avatars";

export async function getProfile(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, phone, address, city, role, customer_tag")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateProfile(userId, { fullName, phone, address, city }) {
  const { data, error } = await supabase
    .from("profiles")
    .update({
      full_name: fullName,
      phone,
      address,
      city,
      updated_at: new Date().toISOString()
    })
    .eq("id", userId)
    .select("id, full_name, avatar_url, phone, address, city, role, customer_tag")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function uploadAvatar(userId, file) {
  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const filePath = `${userId}/${Date.now()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: true
    });

  if (uploadError) {
    throw uploadError;
  }

  const {
    data: { publicUrl }
  } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(filePath);

  const { data, error } = await supabase
    .from("profiles")
    .update({
      avatar_url: publicUrl,
      updated_at: new Date().toISOString()
    })
    .eq("id", userId)
    .select("avatar_url")
    .single();

  if (error) {
    throw error;
  }

  return data.avatar_url;
}
