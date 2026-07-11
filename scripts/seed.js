import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "../.env");

const { error: dotenvError } = dotenv.config({ path: envPath });

if (dotenvError) {
  console.error(`Failed to load .env from ${envPath}:`, dotenvError.message);
  process.exit(1);
}

function readEnv(...names) {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) {
      return value;
    }
  }

  return undefined;
}

function resolveServiceKey(rawKey) {
  const key = rawKey.trim();

  // New Supabase secret keys use an sb_secret_ prefix; Auth Admin expects the JWT.
  if (key.startsWith("sb_secret_")) {
    const embeddedJwt = key.slice("sb_secret_".length).trim();
    if (embeddedJwt.startsWith("eyJ")) {
      return embeddedJwt;
    }
  }

  return key;
}

const supabaseUrl = readEnv("VITE_SUPABASE_URL", "SUPABASE_URL");
const serviceKey = resolveServiceKey(
  readEnv("SUPABASE_SERVICE_KEY", "SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

if (!supabaseUrl || !serviceKey) {
  console.error(`Missing env vars in ${envPath}`);
  console.error("Required: VITE_SUPABASE_URL (or SUPABASE_URL) and SUPABASE_SERVICE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const USERS = [
  {
    email: "demo@doterra.com",
    password: "demo123",
    fullName: "Demo User",
    role: "user",
    customerTag: "vip",
    phone: "+359 888 111 222",
    address: "ул. Витоша 12",
    city: "София"
  },
  {
    email: "admin@doterra.com",
    password: "admin123",
    fullName: "Admin User",
    role: "admin",
    customerTag: "new",
    phone: "+359 888 333 444",
    address: "бул. България 100",
    city: "София"
  }
];

const PRODUCTS = [
  { name: "Лавандула", price: 38, category: "oils", description: "Успокояващо етерично масло от лавандула.", stock: 50 },
  { name: "Мента", price: 42, category: "oils", description: "Освежаващо етерично масло от мента.", stock: 45 },
  { name: "Лимон", price: 35, category: "oils", description: "Енергизиращо цитрусово етерично масло.", stock: 60 },
  { name: "Чаено дърво", price: 45, category: "oils", description: "Чисто етерично масло от чаено дърво.", stock: 40 },
  { name: "Deep Blue", price: 85, category: "blends", description: "Смес за мускулна релаксация и комфорт.", stock: 30 },
  { name: "On Guard", price: 78, category: "blends", description: "Защитна смес с подправки и цитруси.", stock: 35 },
  { name: "Balance", price: 72, category: "blends", description: "Заземяваща смес за емоционален баланс.", stock: 28 },
  { name: "Breathe", price: 68, category: "blends", description: "Освежаваща смес за дишане.", stock: 32 },
  { name: "Deep Blue Rub", price: 95, category: "creams", description: "Топящ крем за мускули и стави.", stock: 25 },
  { name: "HD Clear", price: 55, category: "creams", description: "Грижа за кожата с етерични масла.", stock: 38 },
  { name: "Correct-X", price: 48, category: "creams", description: "Успокояващ крем за чувствителна кожа.", stock: 42 },
  { name: "Immortelle", price: 145, category: "creams", description: "Луксозен антистареене крем.", stock: 15 }
];

async function findUserByEmail(email) {
  let page = 1;
  const perPage = 200;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) {
      throw error;
    }

    const user = data.users.find((entry) => entry.email === email);
    if (user) {
      return user;
    }

    if (data.users.length < perPage) {
      return null;
    }

    page += 1;
  }
}

async function ensureUser({ email, password, fullName }) {
  let user = await findUserByEmail(email);

  if (!user) {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName }
    });

    if (error) {
      throw error;
    }

    user = data.user;
    console.log(`Created user: ${email}`);
  } else {
    console.log(`User already exists: ${email}`);
  }

  return user;
}

async function ensureProfile(userId, profile) {
  const { error } = await supabase.from("profiles").upsert(
    {
      id: userId,
      full_name: profile.fullName,
      role: profile.role,
      customer_tag: profile.customerTag,
      phone: profile.phone,
      address: profile.address,
      city: profile.city,
      updated_at: new Date().toISOString()
    },
    { onConflict: "id" }
  );

  if (error) {
    throw error;
  }
}

async function clearSeedData() {
  const tables = [
    "order_status_log",
    "order_items",
    "orders",
    "customer_notes",
    "products"
  ];

  for (const table of tables) {
    const { error } = await supabase.from(table).delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (error) {
      throw error;
    }
  }
}

async function seedProducts() {
  const { data, error } = await supabase.from("products").insert(PRODUCTS).select("id, name, price");
  if (error) {
    throw error;
  }

  console.log(`Inserted ${data.length} products`);
  return data;
}

function getProductByName(products, name) {
  const product = products.find((entry) => entry.name === name);
  if (!product) {
    throw new Error(`Product not found: ${name}`);
  }
  return product;
}

async function seedOrders(demoUserId, products) {
  const lavender = getProductByName(products, "Лавандула");
  const peppermint = getProductByName(products, "Мента");
  const deepBlue = getProductByName(products, "Deep Blue");
  const onGuard = getProductByName(products, "On Guard");
  const deepBlueRub = getProductByName(products, "Deep Blue Rub");

  const orders = [
    {
      user_id: demoUserId,
      total_price: 122,
      status: "delivered",
      shipping_phone: "+359 888 111 222",
      shipping_address: "ул. Витоша 12, София",
      seller_note: "VIP клиент — приоритетна доставка",
      items: [
        { product_id: lavender.id, quantity: 1, price: lavender.price },
        { product_id: peppermint.id, quantity: 2, price: peppermint.price }
      ]
    },
    {
      user_id: demoUserId,
      total_price: 258,
      status: "confirmed",
      shipping_phone: "+359 888 111 222",
      shipping_address: "ул. Витоша 12, София",
      seller_note: "Подаръчен пакет",
      items: [
        { product_id: deepBlue.id, quantity: 1, price: deepBlue.price },
        { product_id: onGuard.id, quantity: 1, price: onGuard.price },
        { product_id: deepBlueRub.id, quantity: 1, price: deepBlueRub.price }
      ]
    }
  ];

  for (const order of orders) {
    const { items, ...orderData } = order;
    const { data: createdOrder, error: orderError } = await supabase
      .from("orders")
      .insert(orderData)
      .select("id")
      .single();

    if (orderError) {
      throw orderError;
    }

    const orderItems = items.map((item) => ({
      ...item,
      order_id: createdOrder.id
    }));

    const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
    if (itemsError) {
      throw itemsError;
    }

    console.log(`Inserted order ${createdOrder.id} with ${orderItems.length} items`);
  }
}

async function seedCustomerNotes(demoUserId, adminUserId) {
  const notes = [
    {
      customer_id: demoUserId,
      created_by: adminUserId,
      note: "VIP клиент — предпочита доставка в събота сутрин."
    },
    {
      customer_id: demoUserId,
      created_by: adminUserId,
      note: "Поръчва редовно масла от лавандула и мента."
    }
  ];

  const { data, error } = await supabase.from("customer_notes").insert(notes).select("id");
  if (error) {
    throw error;
  }

  console.log(`Inserted ${data.length} customer notes`);
}

async function main() {
  console.log("Starting doTERRA seed...");

  const seededUsers = {};

  for (const user of USERS) {
    const authUser = await ensureUser(user);
    await ensureProfile(authUser.id, user);
    seededUsers[user.email] = authUser.id;
  }

  await clearSeedData();
  const products = await seedProducts();

  await seedOrders(seededUsers["demo@doterra.com"], products);
  await seedCustomerNotes(
    seededUsers["demo@doterra.com"],
    seededUsers["admin@doterra.com"]
  );

  console.log("Seed completed successfully.");
}

main().catch((error) => {
  console.error("Seed failed:", error.message ?? error);
  process.exit(1);
});
