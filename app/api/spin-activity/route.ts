import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import {
  sendSpinActivityEmails,
  type SpinActivityForEmail,
} from "@/lib/sendSpinEmails";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      email,
      phoneNumber,
      wheelId,
      prize,
      hasWonPrize,
      numberOfSpins,
    } = body;

    if (!name || !email || !phoneNumber || !wheelId) {
      return NextResponse.json(
        {
          error: "Missing required fields: name, email, phoneNumber, wheelId",
        },
        { status: 400 }
      );
    }

    const activity = await prisma.spinTheWheelActivity.create({
      data: {
        name,
        email,
        phoneNumber,
        wheelId,
        prize: prize || null,
        hasWonPrize: hasWonPrize ?? false,
        numberOfSpins: numberOfSpins ? BigInt(numberOfSpins) : BigInt(0),
      },
    });

    const activityDataForEmail: SpinActivityForEmail = {
      id: activity.id,
      name: activity.name,
      email: activity.email,
      phoneNumber: activity.phoneNumber,
      wheelId: activity.wheelId,
      prize: activity.prize ?? undefined,
      hasWonPrize: activity.hasWonPrize,
      numberOfSpins: Number(activity.numberOfSpins),
      createdAt: activity.createdAt,
    };

    await sendSpinActivityEmails(activityDataForEmail);

    return NextResponse.json(
      {
        success: true,
        message: "Spin activity created successfully",
        activity: {
          ...activity,
          numberOfSpins: Number(activity.numberOfSpins),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating spin activity:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id,
      email,
      name,
      phoneNumber,
      wheelId,
      prize,
      hasWonPrize,
      numberOfSpins,
    } = body;

    if (!id && !email) {
      return NextResponse.json(
        { error: "Either id or email is required for update" },
        { status: 400 }
      );
    }

    const whereClause: Prisma.SpinTheWheelActivityWhereInput = id
      ? { id }
      : { email };

    const existingActivity = await prisma.spinTheWheelActivity.findFirst({
      where: whereClause,
      orderBy: id ? undefined : { updatedAt: "desc" },
    });

    if (!existingActivity) {
      return NextResponse.json(
        { error: "Spin activity not found" },
        { status: 404 }
      );
    }

    const updateData: Prisma.SpinTheWheelActivityUpdateInput = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
    if (wheelId !== undefined) updateData.wheelId = wheelId;
    if (prize !== undefined) updateData.prize = prize;
    if (hasWonPrize !== undefined) updateData.hasWonPrize = hasWonPrize;
    if (numberOfSpins !== undefined)
      updateData.numberOfSpins = BigInt(numberOfSpins);

    const updatedActivity = await prisma.spinTheWheelActivity.update({
      where: { id: existingActivity.id },
      data: updateData,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Spin activity updated successfully",
        activity: {
          ...updatedActivity,
          numberOfSpins: Number(updatedActivity.numberOfSpins),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating spin activity:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const existingActivity = await prisma.spinTheWheelActivity.findFirst({
      where: { email },
      orderBy: { updatedAt: "desc" },
    });

    if (!existingActivity) {
      return NextResponse.json(
        { error: "Spin activity not found for this email" },
        { status: 404 }
      );
    }

    const updatedActivity = await prisma.spinTheWheelActivity.update({
      where: { id: existingActivity.id },
      data: {
        numberOfSpins: existingActivity.numberOfSpins + BigInt(1),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Spin count incremented successfully",
      activity: {
        ...updatedActivity,
        numberOfSpins: Number(updatedActivity.numberOfSpins),
      },
    });
  } catch (error) {
    console.error("Error incrementing spin count:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
