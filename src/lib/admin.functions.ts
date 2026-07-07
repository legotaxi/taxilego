import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(supabase: any, userId: string) {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  return !!data;
}

const DOC_FIELDS = ["bi_url", "license_url", "criminal_record_url", "photo_url"] as const;

export const listDriverApplications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    if (!(await assertAdmin(supabase, userId))) {
      return { authorized: false, drivers: [] };
    }
    const { data: drivers, error } = await supabase
      .from("drivers")
      .select(
        "id, status, license_number, bi_number, rating, total_rides, created_at, approved_at, bi_url, license_url, criminal_record_url, photo_url",
      )
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) return { authorized: true, drivers: [], error: error.message };

    const ids = (drivers ?? []).map((d) => d.id);
    const { data: profiles } = ids.length
      ? await supabase.from("profiles").select("id, full_name, phone, avatar_url").in("id", ids)
      : { data: [] as Array<{ id: string; full_name: string; phone: string; avatar_url: string }> };

    const map = new Map((profiles ?? []).map((p: any) => [p.id, p]));

    // Sign all document paths in parallel (1 hour expiry)
    const enriched = await Promise.all(
      (drivers ?? []).map(async (d: any) => {
        const signed: Record<string, string | null> = {};
        await Promise.all(
          DOC_FIELDS.map(async (field) => {
            const path = d[field];
            if (!path) {
              signed[field] = null;
              return;
            }
            const { data: s } = await supabase.storage
              .from("driver-docs")
              .createSignedUrl(path, 3600);
            signed[field] = s?.signedUrl ?? null;
          }),
        );
        return {
          ...d,
          profile: map.get(d.id) ?? null,
          documents: {
            bi: signed.bi_url,
            license: signed.license_url,
            criminal_record: signed.criminal_record_url,
            photo: signed.photo_url,
          },
        };
      }),
    );

    return { authorized: true, drivers: enriched };
  });

export const updateDriverStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        driverId: z.string().uuid(),
        status: z.enum(["pending", "approved", "suspended", "rejected"]),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    if (!(await assertAdmin(supabase, userId))) {
      return { ok: false, error: "Sem permissão" };
    }
    const patch: { status: typeof data.status; approved_at?: string | null } = { status: data.status };
    if (data.status === "approved") patch.approved_at = new Date().toISOString();
    if (data.status === "rejected" || data.status === "pending") patch.approved_at = null;
    const { error } = await supabase.from("drivers").update(patch).eq("id", data.driverId);
    if (error) return { ok: false, error: error.message };

    if (data.status === "approved") {
      await supabase
        .from("user_roles")
        .upsert({ user_id: data.driverId, role: "driver" }, { onConflict: "user_id,role" });
    }
    return { ok: true };
  });

export const getAdminStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const { data: roleRow } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleRow) {
      return { authorized: false, stats: null, recentRides: [] };
    }

    const [ridesRes, driversRes, usersRes, txRes, recentRes] = await Promise.all([
      supabase.from("rides").select("id, status, fare_kz", { count: "exact" }),
      supabase.from("drivers").select("id, status", { count: "exact" }),
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("transactions").select("amount_kz"),
      supabase
        .from("rides")
        .select("id, status, category, fare_kz, pickup_address, dropoff_address, created_at")
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

    const rides = ridesRes.data ?? [];
    const drivers = driversRes.data ?? [];
    const totalRevenueKz = rides.reduce((s, r) => s + Number(r.fare_kz ?? 0), 0);
    const completedRides = rides.filter((r) => r.status === "completed").length;
    const activeRides = rides.filter((r) =>
      ["requested", "accepted", "in_progress"].includes(r.status),
    ).length;
    const onlineDrivers = drivers.filter((d) => d.status === "approved").length;

    return {
      authorized: true,
      stats: {
        totalRides: ridesRes.count ?? 0,
        completedRides,
        activeRides,
        totalDrivers: driversRes.count ?? 0,
        onlineDrivers,
        totalUsers: usersRes.count ?? 0,
        totalRevenueKz,
      },
      recentRides: recentRes.data ?? [],
    };
  });
