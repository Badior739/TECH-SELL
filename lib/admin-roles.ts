export const ADMIN_ROLES = ["super_admin", "manager", "catalog", "orders"] as const;

export type AdminRole = (typeof ADMIN_ROLES)[number];

export const ADMIN_ROLE_LABELS: Record<AdminRole, string> = {
  super_admin: "Super administrateur",
  manager: "Gestionnaire",
  catalog: "Catalogue",
  orders: "Commandes",
};

export const ADMIN_ROLE_DESCRIPTIONS: Record<AdminRole, string> = {
  super_admin: "Tous les accès, y compris les comptes administrateurs.",
  manager: "Produits, catégories, offres, commandes et clients.",
  catalog: "Produits et catégories uniquement.",
  orders: "Tableau de bord, commandes et clients.",
};

export function isAdminRole(value: unknown): value is AdminRole {
  return typeof value === "string" && ADMIN_ROLES.some((role) => role === value);
}
