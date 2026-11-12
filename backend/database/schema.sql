-- MAZZA Fast Food Online Ordering Platform
-- PostgreSQL Schema (10 Core Tables with Foreign Keys, Enums & Indexes)

-- Clean ENUM types if re-initializing manually
DO $$ BEGIN
  CREATE TYPE admin_role_enum AS ENUM ('super_admin', 'manager', 'operator');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE banner_link_type_enum AS ENUM ('promotion', 'product', 'category', 'url');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE order_type_enum AS ENUM ('delivery', 'pickup');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE payment_type_enum AS ENUM ('cash', 'card', 'payme', 'click');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE order_status_enum AS ENUM ('new', 'accepted', 'preparing', 'delivering', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 1. Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  full_name VARCHAR(120) NOT NULL,
  phone VARCHAR(30) NOT NULL UNIQUE,
  email VARCHAR(150) UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  preferred_language VARCHAR(5) NOT NULL DEFAULT 'uz',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 2. Admins table
CREATE TABLE IF NOT EXISTS admins (
  id SERIAL PRIMARY KEY,
  full_name VARCHAR(120) NOT NULL,
  username VARCHAR(60) NOT NULL UNIQUE,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role admin_role_enum NOT NULL DEFAULT 'super_admin',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_login_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 3. Categories table
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(80) NOT NULL UNIQUE,
  name_uz VARCHAR(100) NOT NULL,
  name_ru VARCHAR(100) NOT NULL,
  description_uz TEXT,
  description_ru TEXT,
  icon VARCHAR(255),
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_virtual BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 4. Products table
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  slug VARCHAR(140) NOT NULL UNIQUE,
  name_uz VARCHAR(160) NOT NULL,
  name_ru VARCHAR(160) NOT NULL,
  description_uz TEXT NOT NULL,
  description_ru TEXT NOT NULL,
  ingredients_uz TEXT NOT NULL,
  ingredients_ru TEXT NOT NULL,
  price INTEGER NOT NULL CHECK (price >= 0),
  old_price INTEGER CHECK (old_price IS NULL OR old_price >= 0),
  calories INTEGER CHECK (calories IS NULL OR calories >= 0),
  volume_uz VARCHAR(60) NOT NULL,
  volume_ru VARCHAR(60) NOT NULL,
  badge_uz VARCHAR(50),
  badge_ru VARCHAR(50),
  image_url VARCHAR(255) NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  is_new BOOLEAN NOT NULL DEFAULT FALSE,
  is_promo BOOLEAN NOT NULL DEFAULT FALSE,
  is_kids BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 5. Product Images table
CREATE TABLE IF NOT EXISTS product_images (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE ON UPDATE CASCADE,
  image_url VARCHAR(255) NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 6. Addresses table
CREATE TABLE IF NOT EXISTS addresses (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  label VARCHAR(60) NOT NULL,
  street_address VARCHAR(255) NOT NULL,
  apartment VARCHAR(60),
  entrance VARCHAR(30),
  floor VARCHAR(30),
  landmark VARCHAR(150),
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 7. Promotions table
CREATE TABLE IF NOT EXISTS promotions (
  id SERIAL PRIMARY KEY,
  title_uz VARCHAR(180) NOT NULL,
  title_ru VARCHAR(180) NOT NULL,
  description_uz TEXT NOT NULL,
  description_ru TEXT NOT NULL,
  promo_code VARCHAR(40) UNIQUE,
  discount_percent INTEGER NOT NULL DEFAULT 0 CHECK (discount_percent >= 0 AND discount_percent <= 100),
  discount_amount INTEGER NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
  min_order_amount INTEGER NOT NULL DEFAULT 0 CHECK (min_order_amount >= 0),
  badge_text VARCHAR(40),
  image_url VARCHAR(255),
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL ON UPDATE CASCADE,
  product_id INTEGER REFERENCES products(id) ON DELETE SET NULL ON UPDATE CASCADE,
  starts_at TIMESTAMP WITH TIME ZONE,
  ends_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 8. Banners table
CREATE TABLE IF NOT EXISTS banners (
  id SERIAL PRIMARY KEY,
  title_uz VARCHAR(180) NOT NULL,
  title_ru VARCHAR(180) NOT NULL,
  subtitle_uz VARCHAR(255),
  subtitle_ru VARCHAR(255),
  cta_text_uz VARCHAR(60) NOT NULL DEFAULT 'Buyurtma berish',
  cta_text_ru VARCHAR(60) NOT NULL DEFAULT 'Заказать',
  image_url VARCHAR(255) NOT NULL,
  link_type banner_link_type_enum NOT NULL DEFAULT 'category',
  promotion_id INTEGER REFERENCES promotions(id) ON DELETE SET NULL ON UPDATE CASCADE,
  product_id INTEGER REFERENCES products(id) ON DELETE SET NULL ON UPDATE CASCADE,
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL ON UPDATE CASCADE,
  target_url VARCHAR(255),
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 9. Orders table
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  order_number VARCHAR(30) NOT NULL UNIQUE,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  address_id INTEGER REFERENCES addresses(id) ON DELETE SET NULL ON UPDATE CASCADE,
  promotion_id INTEGER REFERENCES promotions(id) ON DELETE SET NULL ON UPDATE CASCADE,
  customer_name VARCHAR(120) NOT NULL,
  customer_phone VARCHAR(30) NOT NULL,
  delivery_address TEXT,
  branch_name VARCHAR(120),
  order_type order_type_enum NOT NULL DEFAULT 'delivery',
  payment_type payment_type_enum NOT NULL DEFAULT 'cash',
  status order_status_enum NOT NULL DEFAULT 'new',
  subtotal_amount INTEGER NOT NULL CHECK (subtotal_amount >= 0),
  delivery_fee INTEGER NOT NULL DEFAULT 0 CHECK (delivery_fee >= 0),
  discount_amount INTEGER NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
  total_amount INTEGER NOT NULL CHECK (total_amount >= 0),
  promo_code VARCHAR(40),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 10. Order Items table
CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE ON UPDATE CASCADE,
  product_id INTEGER REFERENCES products(id) ON DELETE SET NULL ON UPDATE CASCADE,
  product_name_uz VARCHAR(160) NOT NULL,
  product_name_ru VARCHAR(160) NOT NULL,
  product_image VARCHAR(255),
  unit_price INTEGER NOT NULL CHECK (unit_price >= 0),
  quantity INTEGER NOT NULL CHECK (quantity >= 1),
  total_price INTEGER NOT NULL CHECK (total_price >= 0),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Helpful Indexes for fast filtering and search
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_is_available ON products(is_available);
CREATE INDEX IF NOT EXISTS idx_products_is_new ON products(is_new);
CREATE INDEX IF NOT EXISTS idx_products_is_promo ON products(is_promo);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON addresses(user_id);
