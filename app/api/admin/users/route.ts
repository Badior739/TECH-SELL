import { NextResponse } from "next/server";
import { isAdminRole } from "@/lib/admin-roles";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

export const runtime = "nodejs";

type AdminProfile = {
  user_id: string;
  role: string;
};

async function authorize(request: Request) {
  const token = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) {
    return { response: NextResponse.json({ error: "Authentification requise." }, { status: 401 }) };
  }

  let supabase;
  try {
    supabase = createSupabaseAdminClient();
  } catch (error) {
    console.error("Configuration de gestion des comptes absente.", error);
    return { response: NextResponse.json({ error: "La gestion des comptes n’est pas configurée sur le serveur." }, { status: 503 }) };
  }

  const { data: authData, error: authError } = await supabase.auth.getUser(token);
  if (authError || !authData.user) {
    return { response: NextResponse.json({ error: "Session invalide ou expirée." }, { status: 401 }) };
  }

  const { data: actor, error: actorError } = await supabase
    .from("admins")
    .select("role")
    .eq("user_id", authData.user.id)
    .maybeSingle();

  if (actorError) {
    console.error("Vérification du rôle admin impossible.", actorError);
    return { response: NextResponse.json({ error: "Impossible de vérifier vos permissions." }, { status: 500 }) };
  }

  if (actor?.role !== "super_admin") {
    return { response: NextResponse.json({ error: "Réservé aux super administrateurs." }, { status: 403 }) };
  }

  return { supabase, actorId: authData.user.id };
}

export async function GET(request: Request) {
  const access = await authorize(request);
  if (access.response) return access.response;

  const { data: profiles, error: profilesError } = await access.supabase
    .from("admins")
    .select("user_id, role");

  if (profilesError) {
    console.error("Lecture des rôles admin impossible.", profilesError);
    return NextResponse.json({ error: "Impossible de charger les comptes administrateurs." }, { status: 500 });
  }

  const profileRows = (profiles || []) as AdminProfile[];
  const roleById = new Map(profileRows.map((profile) => [profile.user_id, profile.role]));
  const { data: usersData, error: usersError } = await access.supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  if (usersError) {
    console.error("Lecture des utilisateurs Auth impossible.", usersError);
    return NextResponse.json({ error: "Impossible de charger les comptes Auth." }, { status: 500 });
  }

  const users = usersData.users
    .filter((user) => roleById.has(user.id))
    .map((user) => ({
      id: user.id,
      email: user.email || "",
      role: roleById.get(user.id),
      createdAt: user.created_at,
      lastSignInAt: user.last_sign_in_at,
    }));

  return NextResponse.json({ users });
}

export async function POST(request: Request) {
  const access = await authorize(request);
  if (access.response) return access.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide." }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Données du compte invalides." }, { status: 400 });
  }

  const { email, password, role } = body as Record<string, unknown>;
  if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return NextResponse.json({ error: "Saisissez une adresse e-mail valide." }, { status: 400 });
  }
  if (typeof password !== "string" || password.length < 12) {
    return NextResponse.json({ error: "Le mot de passe temporaire doit contenir au moins 12 caractères." }, { status: 400 });
  }
  if (!isAdminRole(role)) {
    return NextResponse.json({ error: "Niveau d’accès invalide." }, { status: 400 });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const { data: created, error: createError } = await access.supabase.auth.admin.createUser({
    email: normalizedEmail,
    password,
    email_confirm: true,
  });

  if (createError || !created.user) {
    return NextResponse.json(
      { error: createError?.message || "La création du compte Auth a échoué." },
      { status: 400 }
    );
  }

  const { error: profileError } = await access.supabase.from("admins").insert({
    user_id: created.user.id,
    role,
  });

  if (profileError) {
    const { error: rollbackError } = await access.supabase.auth.admin.deleteUser(created.user.id);
    if (rollbackError) console.error("Nettoyage du compte Auth incomplet après échec d’attribution du rôle.", rollbackError);
    console.error("Attribution du rôle admin impossible.", profileError);
    return NextResponse.json({ error: "Le compte a été créé, mais son rôle n’a pas pu être attribué." }, { status: 500 });
  }

  return NextResponse.json(
    { user: { id: created.user.id, email: normalizedEmail, role } },
    { status: 201 }
  );
}
