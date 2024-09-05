import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function DELETE(req) {
  try {
    const smtpCount = await prisma.sMTP.count();

    if (smtpCount === 0) {
      return NextResponse.json(
        { message: "SMTP files not found" },
        { status: 404 }
      );
    }

    await prisma.sMTP.deleteMany({});
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
