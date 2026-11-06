import { NextResponse } from "next/server";
import { isAdminRole } from "@/lib/admin-roles";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

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

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    return { response: NextResponse.json({ error: "Session invalide ou expirée." }, { status: 401 }) };
  }

  const { data: actor, error: roleError } = await supabase
    .from("admins")
    .select("role")
    .eq("user_id", data.user.id)
    .maybeSingle();

  if (roleError) {
    console.error("Vérification du rôle admin impossible.", roleError);
    return { response: NextResponse.json({ error: "Impossible de vérifier vos permissions." }, { status: 500 }) };
  }

  if (actor?.role !== "super_admin") {
    return { response: NextResponse.json({ error: "Réservé aux super administrateurs." }, { status: 403 }) };
  }

  return { supabase, actorId: data.user.id };
}

export async function PATCH(request: Request, context: RouteContext) {
  const access = await authorize(request);
  if (access.response) return access.response;

  const { id } = await context.params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    return NextResponse.json({ error: "Identifiant de compte invalide." }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide." }, { status: 400 });
  }

  const role = body && typeof body === "object" ? (body as Record<string, unknown>).role : null;
  if (!isAdminRole(role)) {
    return NextResponse.json({ error: "Niveau d’accès invalide." }, { status: 400 });
  }

  const { error } = await access.supabase.rpc("set_admin_role", {
    p_actor_id: access.actorId,
    p_user_id: id,
    p_role: role,
  });
  if (error) {
    console.error("Modification du rôle admin impossible.", error);
    return NextResponse.json({ error: error.message }, { status: 409 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request, context: RouteContext) {
  const access = await authorize(request);
  if (access.response) return access.response;

  const { id } = await context.params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    return NextResponse.json({ error: "Identifiant de compte invalide." }, { status: 400 });
  }

  const { error } = await access.supabase.rpc("remove_admin_role", {
    p_actor_id: access.actorId,
    p_user_id: id,
  });
  if (error) {
    console.error("Révocation du rôle admin impossible.", error);
    return NextResponse.json({ error: error.message }, { status: 409 });
  }

  return new NextResponse(null, { status: 204 });
}
