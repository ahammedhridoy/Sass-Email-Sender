import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server"; // To get the authenticated user

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
    const smtpCount = await prisma.sMTP.count({
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
    await prisma.sMTP.deleteMany({
      where: {
        clerkUserId: userId, // Only delete SMTP records for this user
      },
    });

    return NextResponse.json(
      { message: "SMTP files deleted successfully for this user" },
      { status: 200 }
    );
  } catch (error) {
    console.log("Error deleting SMTP files:", error);
    return NextResponse.json(
      { message: "Error deleting SMTP files" },
      { status: 500 }
    );
  }
}
