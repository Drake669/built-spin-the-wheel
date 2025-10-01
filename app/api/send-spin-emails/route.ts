import { NextRequest, NextResponse } from "next/server";
import {
  sendSpinActivityEmails,
  type SpinActivityForEmail,
} from "@/lib/sendSpinEmails";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const preferredRegion = ["iad1"];

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as SpinActivityForEmail;
    if (!body || !body.email || !body.name) {
      return NextResponse.json(
        { ok: false, error: "Invalid payload" },
        { status: 400, headers: corsHeaders }
      );
    }
    await sendSpinActivityEmails(body);
    return NextResponse.json({ ok: true }, { headers: corsHeaders });
  } catch (err) {
    console.error("[send-spin-emails] failed", err);
    return NextResponse.json(
      { ok: false },
      { status: 500, headers: corsHeaders }
    );
  }
}
