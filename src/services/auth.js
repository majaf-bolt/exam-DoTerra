import { supabase } from "./supabase.js";

let cachedUser = null;

async function fetchProfile(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

async function buildUserFromSession(session) {
  const profile = await fetchProfile(session.user.id);

  return {
    id: session.user.id,
    email: session.user.email,
    fullName:
      profile?.full_name ??
      session.user.user_metadata?.full_name ??
      session.user.email,
    role: profile?.role ?? "user"
  };
}

async function refreshCurrentUser() {
  const {
    data: { session }
  } = await supabase.auth.getSession();

  cachedUser = session ? await buildUserFromSession(session) : null;
  return cachedUser;
}

export async function initAuth() {
  await refreshCurrentUser();

  supabase.auth.onAuthStateChange(async (_event, session) => {
    cachedUser = session ? await buildUserFromSession(session) : null;
  });
}

export async function login(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    throw error;
  }

  cachedUser = await buildUserFromSession(data.session);
  return cachedUser;
}

export async function register(email, password, fullName) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName }
    }
  });

  if (error) {
    throw error;
  }

  if (data.session) {
    cachedUser = await buildUserFromSession(data.session);
  }

  return cachedUser;
}

export async function logout() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }

  cachedUser = null;
}

export function getCurrentUser() {
  return cachedUser;
}

export function isAuthenticated() {
  return Boolean(cachedUser);
}

export function isAdmin() {
  return cachedUser?.role === "admin";
}
