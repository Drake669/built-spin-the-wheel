import { NextRequest, NextResponse } from "next/server";
import {
  sendSpinActivityEmails,
  type SpinActivityForEmail,
} from "@/lib/sendSpinEmails";

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
    const data: SpinActivityForEmail = await request.json();
    await sendSpinActivityEmails(data);
    return NextResponse.json({ success: true }, { headers: corsHeaders });
  } catch (err) {
    console.error("QStash email route error:", err);
    return NextResponse.json(
      { error: "Email send failed" },
      { status: 500, headers: corsHeaders }
    );
  }
}
