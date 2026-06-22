import { NextResponse } from "next/server";
import { z } from "zod";
import { getInternByEmail, toOnboardingIntern } from "@/lib/db/queries";
import { setSessionCookie } from "@/lib/auth";
import { supabase } from "@/lib/storage";
import { createClient } from "@supabase/supabase-js";

const bodySchema = z.object({
  email: z.string().email(),
  code: z.string().min(4),
  method: z.enum(["email", "sms"]).default("email")
});

// After the one-time code is confirmed, establish the app's own onboarding
// session cookie so that /api/onboarding/status (which reads that cookie)
// can authenticate the user. Without this the verify succeeds but every
// subsequent request is unauthenticated.
async function establishSession(email: string) {
  const record = await getInternByEmail(email);
  if (!record) {
    return NextResponse.json({ error: "Account not found." }, { status: 404 });
  }

  await setSessionCookie({
    internId: record.intern.id,
    userId: record.user.id,
    email: record.user.email,
  });

  return NextResponse.json({ intern: toOnboardingIntern(record) });
}

export async function POST(request: Request) {
  try {
    const { email, code, method } = bodySchema.parse(await request.json());

    if (method === "email") {
      const { error } = await supabase.auth.verifyOtp({ email, token: code, type: "email" });
      if (error) throw error;
      return await establishSession(email);
    }

    if (method === "sms") {
      const record = await getInternByEmail(email);
      const phone = (record?.intern as any)?.phone;

      // 1. Verify code with TextLink
      const textlinkRes = await fetch("https://textlinksms.com/api/verify-code", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.TEXTLINK_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ phone_number: phone, code })
      });
      const textlinkData = await textlinkRes.json();

      if (!textlinkData.ok) {
        return NextResponse.json({ error: "Invalid SMS code." }, { status: 400 });
      }

      // 2. Code is valid. Force a Supabase session using the Admin API
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      
      const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: "magiclink",
        email: email,
      });
      if (linkError) throw linkError;

      // Extract the token_hash to instantly consume the generated magic link on the server
      const url = new URL(linkData.properties.action_link);
      const token_hash = url.searchParams.get("token_hash");

      const { error: sessionError } = await supabase.auth.verifyOtp({
        type: "magiclink",
        token_hash: token_hash!,
      });
      if (sessionError) throw sessionError;

      return await establishSession(email);
    }
  } catch (error) {
    console.error("OTP verify error:", error);
    return NextResponse.json({ error: "Failed to verify code" }, { status: 500 });
  }
}