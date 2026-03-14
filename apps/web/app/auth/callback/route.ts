import { NextResponse, type NextRequest } from "next/server";
import { supabase } from "@ex-group/db";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      // Redirect to login with error
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("error", error.message);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Redirect to the intended destination
  const redirectUrl = new URL(next, request.url);
  return NextResponse.redirect(redirectUrl);
}
