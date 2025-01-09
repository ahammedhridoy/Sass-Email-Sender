import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";

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

    // Find the user by clerkId (assuming userId is equivalent to clerkId)
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user?.credentialsPath) {
      return NextResponse.json({ message: "SMTP not found" }, { status: 404 });
    }

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Update the user record to nullify credentialsPath and username
    await prisma.user.update({
      where: { clerkId: userId },
      data: {
        credentialsPath: null,
        username: null,
      },
    });

    return NextResponse.json(
      { message: "Credentials deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Error deleting credentials" },
      { status: 500 }
    );
  }
}
