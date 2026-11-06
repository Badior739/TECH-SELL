export type Category = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  position: number;
};

export type Product = {
  id: string;
  category_id: string | null;
  name: string;
  brand: string | null;
  description: string | null;
  price: number;
  stock: number;
  warranty_months: number;
  specs: Record<string, string>;
  images: string[];
  tags: string[];
  created_at: string;
  discount_percent: number;
  final_price: number;
};

export type Offer = {
  id: string;
  title: string;
  percent: number;
  category_id: string | null;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
};

export type OrderStatus = "nouvelle" | "validee" | "livree" | "annulee";

export type OrderItem = {
  id: string;
  name: string;
  unit_price: number;
  quantity: number;
};

export type Order = {
  id: string;
  order_number: number;
  customer_name: string;
  phone: string;
  address: string | null;
  city: string | null;
  note: string | null;
  payment_method: "livraison" | "mobile_money";
  status: OrderStatus;
  total: number;
  created_at: string;
  order_items: OrderItem[];
};

export type Subscriber = {
  id: string;
  phone: string;
  name: string | null;
  opted_in: boolean;
  created_at: string;
};

export const TAGS: { value: string; label: string }[] = [
  { value: "promo", label: "Promo" },
  { value: "bestseller", label: "Best-seller" },
  { value: "nouveau", label: "Nouveau" },
  { value: "recommande", label: "Recommandé" },
];
