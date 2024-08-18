import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function GET(req) {
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

    return new Response(JSON.stringify({ username: user.username }), {
      status: 200,
    });
  } catch (error) {
    console.error("Error fetching username:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
    });
  }
}
