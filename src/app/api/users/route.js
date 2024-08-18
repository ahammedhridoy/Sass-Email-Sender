// app/api/users/route.js
import { prisma } from "@/lib/prisma";

export async function POST(req) {
  try {
    const { clerkId } = await req.json();

    if (!clerkId) {
      return new Response(JSON.stringify({ error: "Clerk ID is required" }), {
        status: 400,
      });
    }

    // Check if the user already exists
    let user = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      // Create a new user if it doesn't exist
      user = await prisma.user.create({
        data: {
          clerkId,
          credentialsPath: "",
          tokenPath: "",
          username: "",
          content: "",
        },
      });
    }

    return new Response(
      JSON.stringify({ message: "User linked successfully", user }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error handling /api/users route:", error);

    // Provide more specific error messages if needed
    const errorMessage =
      error.message || "An unexpected error occurred. Please try again later.";

    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
    });
  }
}
