// src/app/api/auth/otp/send/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { getInternByEmail } from "@/lib/db/queries";
import { supabase } from "@/lib/storage";

const bodySchema = z.object({ 
  email: z.string().email(),
  method: z.enum(["email", "sms"]).default("email")
});

export async function POST(request: Request) {
  try {
    const { email, method } = bodySchema.parse(await request.json());
    const record = await getInternByEmail(email);

    if (!record || !record.user.isActive) {
      return NextResponse.json({ error: "Account not found or inactive." }, { status: 403 });
    }
    if (record.user.passwordHash) {
      return NextResponse.json({ error: "Account has a password. Log in instead." }, { status: 400 });
    }

    if (method === "email") {
      const { error } = await supabase.auth.signInWithOtp({
        email: record.user.email,
        options: { shouldCreateUser: true },
      });
      if (error) throw error;
      return NextResponse.json({ sent: true, method: "email" });
    }

    if (method === "sms") {
      const phone = (record.intern as any).phone;
      if (!phone) {
        return NextResponse.json({ error: "No phone number associated." }, { status: 400 });
      }

      const response = await fetch("https://textlinksms.com/api/send-verification", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.TEXTLINK_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ phone_number: phone })
      });

      const data = await response.json();
      if (!data.ok) {
        throw new Error(data.message || "Failed to trigger SMS via TextLink");
      }
      return NextResponse.json({ sent: true, method: "sms" });
    }

  } catch (error) {
    console.error("OTP send error:", error);
    return NextResponse.json({ error: "Failed to send verification code" }, { status: 500 });
  }
}