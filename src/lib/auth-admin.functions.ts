import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

type AdminSpec = { phone: string; password: string; fullName: string };

const ADMINS: AdminSpec[] = [
  { phone: "921346544", password: "Luba2026", fullName: "Administrador Lego" },
  { phone: "923030408", password: "Shekinah", fullName: "Shekinah Admin" },
];

const emailFor = (phone: string) => `${phone}@legotaxi.local`;

/**
 * Ensures a dedicated admin account exists with the correct password and
 * admin role. Public endpoint, but only acts when caller provides one of the
 * known admin phone + password pairs.
 */
export const ensureAdminAccount = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({ phone: z.string(), password: z.string() }).parse(input),
  )
  .handler(async ({ data }) => {
    const normalized = data.phone.replace(/\D/g, "");
    const spec = ADMINS.find((a) => a.phone === normalized && a.password === data.password);
    if (!spec) {
      return { ok: false, error: "Credenciais admin inválidas" };
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const email = emailFor(spec.phone);

    const { data: list } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    });
    let user = list?.users.find((u) => u.email?.toLowerCase() === email);

    if (!user) {
      const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: spec.password,
        email_confirm: true,
        user_metadata: { phone: spec.phone, full_name: spec.fullName },
      });
      if (createErr || !created.user) {
        return { ok: false, error: createErr?.message ?? "Erro ao criar admin" };
      }
      user = created.user;
    } else {
      await supabaseAdmin.auth.admin.updateUserById(user.id, {
        password: spec.password,
        email_confirm: true,
        user_metadata: { phone: spec.phone, full_name: spec.fullName },
      });
    }

    await supabaseAdmin.from("profiles").upsert(
      { id: user.id, full_name: spec.fullName, phone: spec.phone },
      { onConflict: "id" },
    );

    await supabaseAdmin
      .from("user_roles")
      .delete()
      .eq("user_id", user.id)
      .in("role", ["passenger", "driver"]);
    await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: user.id, role: "admin" }, { onConflict: "user_id,role" });

    await supabaseAdmin.from("drivers").delete().eq("id", user.id);

    return { ok: true };
  });
