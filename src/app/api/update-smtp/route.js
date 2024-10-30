import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function PATCH(req) {
  try {
    const { userId } = auth();

    if (!userId) {
      return new Response(JSON.stringify({ error: "User not authenticated" }), {
        status: 401,
      });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return new Response(
        JSON.stringify({ error: "User not found in the database" }),
        { status: 404 }
      );
    }

    // Update the specific fields to null for the authenticated user
    await prisma.user.update({
      where: { clerkId: userId },
      data: {
        credentialsPath: null,
        tokenPath: null,
        username: null,
      },
    });

    return NextResponse.json(
      { message: "Fields updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating fields:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
    });
  }
}
