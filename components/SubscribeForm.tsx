"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function SubscribeForm() {
  const [phone, setPhone] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "ok" | "error">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (phone.replace(/\D/g, "").length < 8) {
      setState("error");
      return;
    }
    setState("loading");
    const { error } = await supabase.rpc("subscribe", { p_phone: phone, p_name: null });
    setState(error ? "error" : "ok");
    if (!error) setPhone("");
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2 sm:flex-row">
      <input
        className="input"
        inputMode="tel"
        placeholder="Votre numéro WhatsApp"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        aria-label="Numéro WhatsApp"
      />
      <button className="btn-primary shrink-0" disabled={state === "loading"}>
        {state === "loading" ? "…" : "Recevoir les promos"}
      </button>
      {state === "ok" && <p className="text-sm text-emerald-600">Merci, vous êtes inscrit(e) !</p>}
      {state === "error" && <p className="text-sm text-red-600">Numéro invalide ou erreur, réessayez.</p>}
    </form>
  );
}
