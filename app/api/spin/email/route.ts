import { NextRequest, NextResponse } from "next/server";
import {
  sendSpinActivityEmails,
  type SpinActivityForEmail,
} from "@/lib/sendSpinEmails";

export async function POST(request: NextRequest) {
  try {
    const data: SpinActivityForEmail = await request.json();
    await sendSpinActivityEmails(data);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("QStash email route error:", err);
    return NextResponse.json({ error: "Email send failed" }, { status: 500 });
  }
}
