import { NextRequest, NextResponse } from "next/server";
import {
  sendSpinActivityEmails,
  type SpinActivityForEmail,
} from "@/lib/sendSpinEmails";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const preferredRegion = ["iad1"];

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as SpinActivityForEmail;
    if (!body || !body.email || !body.name) {
      return NextResponse.json(
        { ok: false, error: "Invalid payload" },
        { status: 400 }
      );
    }
    await sendSpinActivityEmails(body);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[send-spin-emails] failed", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
