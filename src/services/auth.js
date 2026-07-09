import { storage } from "./storage.js";

const USER_KEY = "doterra-user";

export function loginAsUser() {
  storage.set(USER_KEY, { id: "u1", name: "Guest User", role: "user" });
}

export function loginAsAdmin() {
  storage.set(USER_KEY, { id: "a1", name: "Admin User", role: "admin" });
}

export function logout() {
  storage.remove(USER_KEY);
}

export function getCurrentUser() {
  return storage.get(USER_KEY);
}

export function isAuthenticated() {
  return Boolean(getCurrentUser());
}

export function isAdmin() {
  return getCurrentUser()?.role === "admin";
}
