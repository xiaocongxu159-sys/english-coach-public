import type { EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function verificationResult(
  request: NextRequest,
  status: "success" | "error",
  message?: string,
) {
  const url = new URL("/verify-email", request.url);
  url.searchParams.set("status", status);
  if (message) url.searchParams.set("message", message);
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get("token_hash")?.trim();
  const requestedType = request.nextUrl.searchParams.get("type")?.trim();

  if (!tokenHash) {
    return verificationResult(
      request,
      "error",
      "The confirmation link is missing its token. Please resend the confirmation email and open the newest link.",
    );
  }

  const type = (requestedType || "email") as EmailOtpType;
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.verifyOtp({
    type,
    token_hash: tokenHash,
  });

  if (error) {
    return verificationResult(request, "error", `Email confirmation failed: ${error.message}`);
  }

  if (!data.user?.email_confirmed_at) {
    return verificationResult(
      request,
      "error",
      "The confirmation request completed without confirming the email. Please resend the confirmation email.",
    );
  }

  // Email confirmation and browser session are separate concerns. In-app mail
  // browsers frequently do not share cookies with the learner's normal browser,
  // so always show an explicit success state instead of silently bouncing to
  // the app or login page.
  return verificationResult(request, "success");
}
