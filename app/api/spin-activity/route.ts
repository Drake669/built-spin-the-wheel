import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import nodemailer from "nodemailer";
import path from "path";

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

    const activityDataForEmail = {
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

    const queue = (fn: () => void) =>
      typeof setImmediate !== "undefined"
        ? setImmediate(fn)
        : setTimeout(fn, 0);
    queue(() => {
      void sendSpinActivityEmails(activityDataForEmail).catch((err) => {
        console.error("[sendSpinActivityEmails] failed", err);
      });
    });

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

async function sendSpinActivityEmails(activity: {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  wheelId: string;
  prize?: string;
  hasWonPrize: boolean;
  numberOfSpins: number;
  createdAt: Date;
}) {
  const gmailUser = process.env.GMAIL_USER;
  const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;
  const csUser = process.env.CUSTOMER_SUCCESS_USER;
  const csAppPassword = process.env.CUSTOMER_SUCCESS_APP_PASSWORD;

  if (!gmailUser || !gmailAppPassword || !csUser) {
    console.warn("Email env vars missing. Skipping sendSpinActivityEmails.");
    return;
  }

  const attachments = [
    {
      filename: "logo.png",
      path: path.join(process.cwd(), "public", "logo.png"),
      cid: "logo",
    },
    {
      filename: "footer.png",
      path: path.join(process.cwd(), "public", "footer.png"),
      cid: "footer",
    },
    {
      filename: "facebook.png",
      path: path.join(process.cwd(), "public", "facebook.png"),
      cid: "facebook",
    },
    {
      filename: "twitter.png",
      path: path.join(process.cwd(), "public", "twitter.png"),
      cid: "twitter",
    },
    {
      filename: "instagram.png",
      path: path.join(process.cwd(), "public", "instagram.png"),
      cid: "instagram",
    },
    {
      filename: "linked.png",
      path: path.join(process.cwd(), "public", "linked.png"),
      cid: "linkedin",
    },
  ];

  try {
    const transporterGmail = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: gmailUser,
        pass: gmailAppPassword,
      },
    });

    const detailsHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="margin:0 0 16px 0;">New Spin-the-Wheel Activity</h2>
        <p style="margin:0 0 10px 0;">Name: <strong>${
          activity.name
        }</strong></p>
        <p style="margin:0 0 10px 0;">Email: <strong>${
          activity.email
        }</strong></p>
        <p style="margin:0 0 10px 0;">Phone: <strong>${
          activity.phoneNumber
        }</strong></p>
        <p style="margin:0 0 10px 0;">Wheel ID: <strong>${
          activity.wheelId
        }</strong></p>
        <p style="margin:0 0 10px 0;">Prize: <strong>${
          activity.prize ?? "-"
        }</strong></p>
        <p style="margin:0 0 10px 0;">Has Won Prize: <strong>${
          activity.hasWonPrize ? "Yes" : "No"
        }</strong></p>
        <p style="margin:0 0 10px 0;">Number of Spins: <strong>${
          activity.numberOfSpins
        }</strong></p>
      </div>
    `;

    await transporterGmail.sendMail({
      from: `"Built Team" <${gmailUser}>`,
      to: csUser,
      subject: "New Spin Activity Recorded",
      text: `New spin activity recorded.\nName: ${activity.name}\nEmail: ${
        activity.email
      }\nPhone: ${activity.phoneNumber}\nWheel ID: ${
        activity.wheelId
      }\nPrize: ${activity.prize ?? "-"}\nHas Won Prize: ${
        activity.hasWonPrize ? "Yes" : "No"
      }\nSpins: ${activity.numberOfSpins}`,
      html: detailsHtml,
      attachments,
    });
  } catch (err) {
    console.error("[Email] Gmail->CustomerSuccess failed", err);
  }

  try {
    if (!csAppPassword) {
      const transporterFallback = nodemailer.createTransport({
        service: "gmail",
        auth: { user: gmailUser, pass: gmailAppPassword },
      });
      await transporterFallback.sendMail({
        from: `"Customer Success" <${csUser || gmailUser}>`,
        to: activity.email,
        subject: "Congratulations on your spin!",
        text: `Hi ${
          activity.name
        },\n\nCongratulations on participating in Built's Spin-the-Wheel!${
          activity.prize ? ` You won: ${activity.prize}.` : ""
        } \n\nThanks for engaging with us!`,
        html: buildCongratsHtml(activity),
        attachments,
      });
      return;
    }

    const transporterCS = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: csUser,
        pass: csAppPassword,
      },
    });

    await transporterCS.sendMail({
      from: `"Customer Success" <${csUser}>`,
      to: activity.email,
      subject: "Congratulations on your spin!",
      text: `Hi ${
        activity.name
      },\n\nCongratulations on participating in Built's Spin-the-Wheel!${
        activity.prize ? ` You won: ${activity.prize}.` : ""
      } \n\nThanks for engaging with us!`,
      html: buildCongratsHtml(activity),
      attachments,
    });
  } catch (err) {
    console.error("[Email] CustomerSuccess->Participant failed", err);
  }
}

function buildCongratsHtml(activity: { name: string; prize?: string }) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <img src="cid:logo" alt="Built Team Logo" style="max-width: 150px; height: auto;" />
      </div>
      <p style="color: #333; font-size: 16px; line-height: 1.6;">Hi ${
        activity.name
      },</p>
      <p style="color: #333; font-size: 16px; line-height: 1.6;">Congratulations on participating in Built's Spin-the-Wheel!</p>
      ${
        activity.prize
          ? `<p style="color: #333; font-size: 16px; line-height: 1.6;">You won: <strong>${activity.prize}</strong>.</p>`
          : ""
      }
      <p style="color: #333; font-size: 16px; line-height: 1.6;">Thank you for engaging with us. We appreciate your time!</p>
      <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
        <img src="cid:footer" alt="Footer" style="max-width: 100%; height: auto;" />
        <div style="padding: 20px 0; text-align: center;">
          <p style="color: #64748b; font-size: 14px; margin: 0 0 15px 0; text-align: center;">Copyright © 2025 Built Financial Technologies.</p>
          <div style="text-align: center; margin-bottom: 20px;">
            <a href="https://facebook.com/builtaccounting" target="_blank" rel="noopener noreferrer" style="text-decoration: none;">
              <img src="cid:facebook" alt="Facebook" style="width: 24px; height: 24px;" />
            </a>
            <a href="https://x.com/built_africa" target="_blank" rel="noopener noreferrer" style="text-decoration: none; margin-left:8px;">
              <img src="cid:twitter" alt="X (Twitter)" style="width: 24px; height: 24px;" />
            </a>
            <a href="https://instagram.com/builtaccounting" target="_blank" rel="noopener noreferrer" style="text-decoration: none; margin-left:8px;">
              <img src="cid:instagram" alt="Instagram" style="width: 24px; height: 24px;" />
            </a>
            <a href="https://linkedin.com/company/built-accounting" target="_blank" rel="noopener noreferrer" style="text-decoration: none; margin-left:8px;">
              <img src="cid:linkedin" alt="LinkedIn" style="width: 24px; height: 24px;" />
            </a>
          </div>
        </div>
      </div>
    </div>
  `;
}
