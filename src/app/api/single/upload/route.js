import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { currentUser, getAuth } from "@clerk/nextjs/server";

// POST /api/single/upload
export async function POST(req) {
  try {
    const { host, port, smtpUser, password, secure } = await req.json();
    console.log(secure);

    const user = await currentUser();

    if (!user || !user.id) {
      return new Response(
        JSON.stringify({ error: "User not authenticated." }),
        { status: 401 }
      );
    }

    // Validate the input data
    if (!host || !port || !smtpUser || !password) {
      return new Response(
        JSON.stringify({
          error: "Invalid input. All fields are required.",
        }),
        { status: 400 }
      );
    }

    // Upsert: Update if exists, create if not
    const smtpCredential = await prisma.single.upsert({
      where: {
        user_host_port_secure_unique: {
          host,
          port: parseInt(port),
          secure,
          user: smtpUser,
        },
      },
      update: {
        password,
      },
      create: {
        host,
        port: parseInt(port),
        secure,
        user: smtpUser,
        password,
        clerkUserId: user.id,
      },
    });

    return new Response(JSON.stringify(smtpCredential), { status: 201 });
  } catch (error) {
    console.error("Error handling SMTP credentials:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
}

// GET /api/single/upload
export async function GET() {
  try {
    const user = await currentUser(); // Get the currently authenticated Clerk user

    if (!user || !user.id) {
      return new Response(
        JSON.stringify({ error: "User not authenticated." }),
        { status: 401 }
      );
    }

    // Find all SMTP records associated with the authenticated user
    const smtps = await prisma.single.findMany({
      where: {
        clerkUserId: user.id,
      },
    });
    return new Response(JSON.stringify({ smtps }), { status: 200 });
  } catch (error) {
    console.log(error);
  }
}

// DELETE /api/single/upload
export async function DELETE(req) {
  try {
    // Get the current authenticated user's Clerk ID
    const { userId } = getAuth(req);

    if (!userId) {
      return NextResponse.json(
        { message: "Unauthorized: User not authenticated" },
        { status: 401 }
      );
    }

    // Count SMTP records for the authenticated user
    const smtpCount = await prisma.single.count({
      where: {
        clerkUserId: userId, // Only count SMTP records for this user
      },
    });

    if (smtpCount === 0) {
      return NextResponse.json(
        { message: "SMTP files not found for this user" },
        { status: 404 }
      );
    }

    // Delete SMTP records for the authenticated user
    await prisma.single.deleteMany({
      where: {
        clerkUserId: userId, // Only delete SMTP records for this user
      },
    });
    return NextResponse.json(
      { message: "SMTP files deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { message: "Error deleting SMTP files" },
      { status: 500 }
    );
  }
}
