export const storage = {
  get(key, fallback = null) {
    const value = localStorage.getItem(key);
    if (!value) {
      return fallback;
    }
    return JSON.parse(value);
  },
  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },
  remove(key) {
    localStorage.removeItem(key);
  }
};
