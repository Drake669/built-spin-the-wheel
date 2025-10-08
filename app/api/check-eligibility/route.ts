import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const email = decodeURIComponent(searchParams.get("email") || "");
    const wheelId = decodeURIComponent(searchParams.get("wheelId") || "");

    if (!email || email === "undefined" || email.trim() === "") {
      return NextResponse.json(
        { error: "Email parameter is required" },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!wheelId || wheelId === "undefined" || wheelId.trim() === "") {
      return NextResponse.json(
        { error: "Wheel ID parameter is required" },
        { status: 400, headers: corsHeaders }
      );
    }

    const currentDate = new Date();
    const eventStartDate = new Date("2025-10-06T12:00:00Z");
    const eventEndDate = new Date("2025-10-10T14:00:00Z");

    if (currentDate < eventStartDate || currentDate > eventEndDate) {
      return NextResponse.json(
        {
          eligible: false,
          reason:
            currentDate < eventStartDate
              ? "The spin event hasn't started yet. Come back from October 6th to 10th, 2025 between 12:00 PM and 2:00 PM GMT!"
              : "The spin event has ended. Thank you for participating!",
          hasWonPrize: false,
          numberOfSpins: 0,
        },
        { headers: corsHeaders }
      );
    }

    const currentHour = currentDate.getUTCHours();
    if (currentHour < 12 || currentHour >= 14) {
      return NextResponse.json(
        {
          eligible: false,
          reason:
            "The spin event is only available between 12:00 PM and 2:00 PM GMT. Please come back during these hours!",
          hasWonPrize: false,
          numberOfSpins: 0,
        },
        { headers: corsHeaders }
      );
    }

    const activity = await prisma.spinTheWheelActivity.findFirst({
      where: {
        email: email,
        wheelId: wheelId ?? "",
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    if (!activity) {
      return NextResponse.json(
        {
          eligible: true,
          reason: "No activity found - eligible to spin",
          hasWonPrize: false,
          numberOfSpins: 0,
        },
        { headers: corsHeaders }
      );
    }

    const hasWonPrize = activity.hasWonPrize;
    const numberOfSpins = Number(activity.numberOfSpins);
    const hasMaxSpins = numberOfSpins >= 1;
    const isEligible = !hasWonPrize && !hasMaxSpins;

    return NextResponse.json(
      {
        eligible: isEligible,
        hasWonPrize: hasWonPrize,
        numberOfSpins: numberOfSpins,
        reason: !isEligible
          ? hasWonPrize
            ? "Already won a prize"
            : "Maximum spins reached"
          : "Eligible to spin",
        activity: {
          id: activity.id,
          name: activity.name,
          email: activity.email,
          phoneNumber: activity.phoneNumber,
          prize: activity.prize,
          wheelId: activity.wheelId,
        },
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("Error checking eligibility:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: corsHeaders }
    );
  }
}
