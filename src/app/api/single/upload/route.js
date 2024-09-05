import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// POST /api/single/upload
export async function POST(req) {
  try {
    const { host, port, smtpUser, password, secure = true } = await req.json();

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
    const smtps = await prisma.single.findMany();
    return new Response(JSON.stringify({ smtps }), { status: 200 });
  } catch (error) {
    console.log(error);
  }
}

// DELETE /api/single/upload
export async function DELETE(req) {
  try {
    const smtpCount = await prisma.single.count();

    if (smtpCount === 0) {
      return NextResponse.json(
        { message: "SMTP files not found" },
        { status: 404 }
      );
    }

    await prisma.single.deleteMany({});
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
