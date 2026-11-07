import { supabase } from "./supabase";
import type { Category, Offer, Product } from "./types";

export async function getCategories(): Promise<Category[]> {
  const { data } = await supabase
    .from("categories")
    .select("*")
    .order("position", { ascending: true });
  return (data as Category[]) || [];
}

export async function getProducts(opts: {
  categoryId?: string;
  q?: string;
  brand?: string;
  sort?: string;
  tag?: string;
  limit?: number;
  promoOnly?: boolean;
} = {}): Promise<Product[]> {
  let query = supabase.from("v_products").select("*");
  if (opts.categoryId) query = query.eq("category_id", opts.categoryId);
  if (opts.brand) query = query.eq("brand", opts.brand);
  if (opts.tag) query = query.contains("tags", [opts.tag]);
  if (opts.promoOnly) query = query.gt("discount_percent", 0);
  if (opts.q) {
    const safe = opts.q.replace(/[%,()]/g, " ").trim();
    if (safe) query = query.or(`name.ilike.%${safe}%,brand.ilike.%${safe}%`);
  }
  switch (opts.sort) {
    case "prix-asc":
      query = query.order("final_price", { ascending: true });
      break;
    case "prix-desc":
      query = query.order("final_price", { ascending: false });
      break;
    default:
      query = query.order("created_at", { ascending: false });
  }
  if (opts.limit) query = query.limit(opts.limit);
  const { data } = await query;
  return (data as Product[]) || [];
}

export async function getProduct(id: string): Promise<Product | null> {
  const { data } = await supabase.from("v_products").select("*").eq("id", id).maybeSingle();
  return (data as Product) || null;
}

export async function getActiveOffers(): Promise<Offer[]> {
  const now = new Date().toISOString();
  const { data } = await supabase
    .from("offers")
    .select("*")
    .eq("is_active", true)
    .lte("starts_at", now)
    .gte("ends_at", now)
    .order("percent", { ascending: false })
    .order("ends_at", { ascending: true });
  return (data as Offer[]) || [];
}
