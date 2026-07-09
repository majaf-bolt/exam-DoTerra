const demoProducts = [
  { id: "lavender", name: "Lavender", price: 29.99, description: "Calming floral aroma." },
  { id: "peppermint", name: "Peppermint", price: 24.99, description: "Fresh and energizing scent." },
  { id: "lemon", name: "Lemon", price: 19.99, description: "Bright citrus oil." }
];

export function getAllProducts() {
  return demoProducts;
}

export function getProductById(id) {
  return demoProducts.find((product) => product.id === id) ?? null;
}
