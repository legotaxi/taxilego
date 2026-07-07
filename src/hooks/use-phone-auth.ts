import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ensureAdminAccount } from "@/lib/auth-admin.functions";

export type UserType = "passenger" | "driver";

// Admin phone numbers (special access) — login admin exclusivo
const ADMIN_ACCOUNTS: Record<string, string> = {
  "921346544": "Luba2026",
  "923030408": "Shekinah",
};
const ADMIN_PHONES = Object.keys(ADMIN_ACCOUNTS);

interface PhoneAuthResponse {
  success: boolean;
  message?: string;
  error?: string;
  user?: any;
  session?: any;
}

export function usePhoneAuth() {
  const [loading, setLoading] = useState(false);

  /**
   * Sign up with phone number and password
   * Automatically logs in the user after signup (NO EMAIL CONFIRMATION)
   */
  const signUpWithPhone = async (
    phone: string,
    password: string,
    fullName: string,
    userType: UserType = "passenger"
  ): Promise<PhoneAuthResponse> => {
    setLoading(true);
    try {
      // Validate inputs
      if (!phone.trim()) {
        return { success: false, error: "Número de telefone obrigatório" };
      }
      
      // Normalize phone: remove non-digits and ensure it has at least 9 digits
      const normalizedPhone = phone.replace(/\D/g, "");
      if (normalizedPhone.length < 9) {
        return { success: false, error: "Número de telefone inválido (mínimo 9 dígitos)" };
      }

      // Block signups using the reserved admin phone
      if (ADMIN_PHONES.includes(normalizedPhone)) {
        return {
          success: false,
          error: "Este número é reservado para administração. Use 'Entrar'.",
        };
      }

      if (!password.trim() || password.length < 6) {
        return { success: false, error: "Palavra-passe deve ter pelo menos 6 caracteres" };
      }
      if (!fullName.trim()) {
        return { success: false, error: "Nome completo obrigatório" };
      }

      // Check if phone already exists
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("phone", normalizedPhone)
        .maybeSingle();

      if (existingProfile) {
        return { success: false, error: "Este número de telefone já está registado" };
      }

      // Create auth user with phone as identifier
      // Using phone@legotaxi.local as internal email (not shown to user)
      const { data, error } = await supabase.auth.signUp({
        email: `${normalizedPhone}@legotaxi.local`,
        password,
        options: {
          data: {
            phone: normalizedPhone,
            full_name: fullName,
            user_type: userType,
          },
          // Disable email confirmation - user enters directly
          emailRedirectTo: undefined,
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (!data.user) {
        return { success: false, error: "Erro ao criar conta" };
      }

      // Update profile with phone and name
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          phone: normalizedPhone,
        })
        .eq("id", data.user.id);

      if (profileError) {
        console.error("Erro ao atualizar perfil:", profileError);
        return { success: false, error: "Erro ao atualizar perfil" };
      }

      // Admin phones are reserved (blocked above); no role assignment needed here.

      // If driver, only assign the driver role.
      // The driver record itself is created later, after the candidate
      // submits the required documents in /motoristas-registo.
      if (userType === "driver") {
        await supabase
          .from("user_roles")
          .upsert({
            user_id: data.user.id,
            role: "driver",
          });
      }

      // Automatically sign in the user (NO EMAIL CONFIRMATION NEEDED)
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: `${normalizedPhone}@legotaxi.local`,
        password,
      });

      if (signInError) {
        console.error("Erro ao fazer login automático:", signInError);
        return { success: false, error: "Erro ao fazer login automático" };
      }

      return {
        success: true,
        message: userType === "driver"
          ? "Conta criada! Submeta agora os seus documentos para análise."
          : "Bem-vindo ao Lego Taxi!",
        user: signInData.user,
        session: signInData.session,
      };
    } catch (err: any) {
      const message = err?.message || "Erro desconhecido";
      console.error("Erro no signup:", err);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Sign in with phone number and password
   * No email confirmation needed
   */
  const signInWithPhone = async (
    phone: string,
    password: string
  ): Promise<PhoneAuthResponse> => {
    setLoading(true);
    try {
      if (!phone.trim()) {
        return { success: false, error: "Número de telefone obrigatório" };
      }
      if (!password.trim()) {
        return { success: false, error: "Palavra-passe obrigatória" };
      }

      // Normalize phone: remove non-digits
      const normalizedPhone = phone.replace(/\D/g, "");
      if (normalizedPhone.length < 9) {
        return { success: false, error: "Número de telefone inválido" };
      }

      // Special path: dedicated admin login
      if (ADMIN_PHONES.includes(normalizedPhone)) {
        const expectedPassword = ADMIN_ACCOUNTS[normalizedPhone];
        if (password !== expectedPassword) {
          return { success: false, error: "Palavra-passe de admin incorreta" };
        }
        const ensured = await ensureAdminAccount({
          data: { phone: normalizedPhone, password: expectedPassword },
        });
        if (!ensured.ok) {
          return { success: false, error: ensured.error || "Erro a preparar conta admin" };
        }
        const { data: adminData, error: adminErr } = await supabase.auth.signInWithPassword({
          email: `${normalizedPhone}@legotaxi.local`,
          password: expectedPassword,
        });
        if (adminErr || !adminData.user) {
          return { success: false, error: adminErr?.message || "Erro ao entrar como admin" };
        }
        return {
          success: true,
          message: "Bem-vindo, Admin!",
          user: adminData.user,
          session: adminData.session,
        };
      }

      // Sign in directly with internal email (phone@legotaxi.local)
      // Skip pre-check: RLS blocks anonymous profile reads, so we'd get false negatives.
      const { data, error } = await supabase.auth.signInWithPassword({
        email: `${normalizedPhone}@legotaxi.local`,
        password,
      });

      if (error) {
        const msg = (error.message || "").toLowerCase();
        if (msg.includes("invalid") || msg.includes("credentials")) {
          return { success: false, error: "Número de telefone ou palavra-passe incorretos" };
        }
        return { success: false, error: error.message };
      }

      if (!data.user) {
        return { success: false, error: "Erro ao fazer login" };
      }

      return {
        success: true,
        message: "Bem-vindo de volta!",
        user: data.user,
        session: data.session,
      };
    } catch (err: any) {
      const message = err?.message || "Erro desconhecido";
      console.error("Erro no signin:", err);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Sign out the current user
   */
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      return { success: true };
    } catch (err: any) {
      console.error("Erro ao fazer logout:", err);
      return { success: false, error: err?.message || "Erro ao fazer logout" };
    }
  };

  return {
    loading,
    signUpWithPhone,
    signInWithPhone,
    signOut,
  };
}
