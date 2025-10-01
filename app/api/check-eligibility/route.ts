import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get("email");
    const wheelId = searchParams.get("wheelId");

    if (!email || email === "undefined" || email.trim() === "") {
      return NextResponse.json(
        { error: "Email parameter is required" },
        { status: 400 }
      );
    }

    if (!wheelId || wheelId === "undefined" || wheelId.trim() === "") {
      return NextResponse.json(
        { error: "Wheel ID parameter is required" },
        { status: 400 }
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
      return NextResponse.json({
        eligible: true,
        reason: "No activity found - eligible to spin",
        hasWonPrize: false,
        numberOfSpins: 0,
      });
    }

    const hasWonPrize = activity.hasWonPrize;
    const numberOfSpins = Number(activity.numberOfSpins);
    const hasMaxSpins = numberOfSpins >= 3;
    const isEligible = !hasWonPrize && !hasMaxSpins;

    return NextResponse.json({
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
    });
  } catch (error) {
    console.error("Error checking eligibility:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
