"use server";

import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function field(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function authError(path: "/login" | "/signup", message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

export async function login(formData: FormData) {
  const email = field(formData, "email");
  const password = field(formData, "password");

  if (!email || !password) authError("/login", "Email and password are required.");

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) authError("/login", error.message);

  redirect("/");
}

export async function signup(formData: FormData) {
  const email = field(formData, "email");
  const password = field(formData, "password");
  const displayName = field(formData, "displayName");

  if (!email || !password) authError("/signup", "Email and password are required.");
  if (password.length < 8) authError("/signup", "Use a password with at least 8 characters.");

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: displayName ? { display_name: displayName } : undefined,
    },
  });

  if (error) authError("/signup", error.message);

  if (data.session) redirect("/");
  redirect("/signup?message=Check%20your%20email%20to%20confirm%20your%20account.");
}

export async function resendSignupConfirmation(formData: FormData) {
  const email = field(formData, "email");
  if (!email) {
    redirect("/signup?resend=1&error=Email%20is%20required.");
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
  });

  if (error) {
    redirect(`/signup?resend=1&error=${encodeURIComponent(error.message)}`);
  }

  redirect("/signup?resend=1&message=Confirmation%20email%20sent.%20Check%20your%20inbox.");
}

export async function logout() {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect("/login");
}
