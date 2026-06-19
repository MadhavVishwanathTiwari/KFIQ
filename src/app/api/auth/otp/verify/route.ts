// src/app/api/auth/otp/verify/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { getInternByEmail } from "@/lib/db/queries";
import { supabase } from "@/lib/storage";
import { createClient } from "@supabase/supabase-js";

const bodySchema = z.object({
  email: z.string().email(),
  code: z.string().min(4),
  method: z.enum(["email", "sms"]).default("email")
});

export async function POST(request: Request) {
  try {
    const { email, code, method } = bodySchema.parse(await request.json());

    if (method === "email") {
      const { data, error } = await supabase.auth.verifyOtp({ email, token: code, type: "email" });
      if (error) throw error;
      return NextResponse.json({ session: data.session });
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

      const { data: sessionData, error: sessionError } = await supabase.auth.verifyOtp({
        type: "magiclink",
        token_hash: token_hash!,
      });
      if (sessionError) throw sessionError;

      return NextResponse.json({ session: sessionData.session });
    }
  } catch (error) {
    console.error("OTP verify error:", error);
    return NextResponse.json({ error: "Failed to verify code" }, { status: 500 });
  }
}