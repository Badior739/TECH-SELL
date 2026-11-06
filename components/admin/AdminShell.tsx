"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Package,
  Shield,
  Tags,
  TicketPercent,
  UsersRound,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { config } from "@/lib/config";
import { ADMIN_ROLE_LABELS, isAdminRole, type AdminRole } from "@/lib/admin-roles";

const NAV = [
  { href: "/admin", label: "Tableau de bord", icon: LayoutDashboard, roles: ["super_admin", "manager", "orders"] },
  { href: "/admin/commandes", label: "Commandes", icon: ClipboardList, roles: ["super_admin", "manager", "orders"] },
  { href: "/admin/produits", label: "Produits", icon: Package, roles: ["super_admin", "manager", "catalog"] },
  { href: "/admin/categories", label: "Catégories", icon: Tags, roles: ["super_admin", "manager", "catalog"] },
  { href: "/admin/offres", label: "Offres", icon: TicketPercent, roles: ["super_admin", "manager"] },
  { href: "/admin/clients", label: "Clients & promos", icon: UsersRound, roles: ["super_admin", "manager", "orders"] },
  { href: "/admin/utilisateurs", label: "Utilisateurs", icon: Shield, roles: ["super_admin"] },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [state, setState] = useState<"loading" | "ok" | "denied">("loading");
  const [role, setRole] = useState<AdminRole | null>(null);

  useEffect(() => {
    let active = true;
    async function check() {
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;
      if (!user) {
        router.replace("/auth");
        return;
      }
      const { data: row } = await supabase
        .from("admins")
        .select("user_id, role")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!active) return;
      if (row && isAdminRole(row.role)) {
        setRole(row.role);
        setState("ok");
      } else {
        setState("denied");
      }
    }
    check();
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) router.replace("/auth");
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [router]);

  async function logout() {
    await supabase.auth.signOut();
    router.replace("/auth");
  }

  if (state === "loading") {
    return <div className="grid min-h-screen place-items-center text-slate-400">Chargement…</div>;
  }

  if (state === "denied") {
    return (
      <div className="grid min-h-screen place-items-center p-6 text-center">
        <div className="card max-w-md p-8">
          <h1 className="text-xl font-bold text-ink">Accès refusé</h1>
          <p className="mt-2 text-sm text-slate-600">
            Ce compte n&apos;a pas les droits administrateur. Ajoutez-le dans la table <code>admins</code> (voir le
            README).
          </p>
          <button className="btn-dark mt-5" onClick={logout}>Se déconnecter</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen md:flex">
      <aside className="bg-ink text-slate-200 md:sticky md:top-0 md:h-screen md:w-60 md:shrink-0">
        <div className="flex items-center justify-between px-4 py-3 md:block md:py-5">
          <div className="font-extrabold text-white">{config.name}</div>
          <div className="text-xs text-slate-400">Administration</div>
        </div>
        <div className="flex items-center justify-between px-4 pb-2 md:pb-4">
          <span className="text-xs text-slate-400">{role ? ADMIN_ROLE_LABELS[role] : ""}</span>
          <Link href="/" target="_blank" className="text-xs text-slate-400 hover:text-white md:hidden">
            <span className="inline-flex items-center gap-1"><ArrowUpRight size={13} aria-hidden="true" /> Boutique</span>
          </Link>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-2 pb-2 md:block md:space-y-1 md:overflow-visible md:pb-0">
          {NAV.filter((n) => role && n.roles.includes(role)).map((n) => {
            const active = n.href === "/admin" ? pathname === "/admin" : pathname.startsWith(n.href);
            const Icon = n.icon;
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium ${
                  active ? "bg-brand-500 text-white" : "hover:bg-white/10"
                }`}
              >
                <Icon size={16} strokeWidth={1.7} aria-hidden="true" />
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="hidden space-y-1 px-2 pt-4 md:block">
          <Link href="/" target="_blank" className="block rounded-xl px-3 py-2 text-sm hover:bg-white/10">
            <span className="inline-flex items-center gap-2"><ArrowUpRight size={15} aria-hidden="true" /> Voir la boutique</span>
          </Link>
          <button onClick={logout} className="block w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-white/10">
            <span className="inline-flex items-center gap-2"><LogOut size={15} aria-hidden="true" /> Déconnexion</span>
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 p-4 md:p-8">
        {children}
        <div className="mt-10 flex gap-4 text-sm md:hidden">
          <Link href="/" target="_blank" className="text-brand-600 underline">Voir la boutique</Link>
          <button onClick={logout} className="text-red-600 underline">Déconnexion</button>
        </div>
      </main>
    </div>
  );
}
