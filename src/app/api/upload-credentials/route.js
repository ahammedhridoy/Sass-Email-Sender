import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function POST(req) {
  try {
    // Get the user from Clerk server-side auth
    const { userId } = auth(req);

    if (!userId) {
      return new Response(JSON.stringify({ error: "User not authenticated" }), {
        status: 401,
      });
    }

    // Parse the form data
    const formData = await req.formData();
    const file = formData.get("credentials");
    const fileName = file.name.split(".json")[0];

    // Validate file
    if (!file || !(file instanceof File)) {
      return new Response(JSON.stringify({ error: "No file provided" }), {
        status: 400,
      });
    }
    if (!file.name.endsWith(".json")) {
      return new Response(
        JSON.stringify({
          error: "Invalid file format. Only JSON files are allowed.",
        }),
        { status: 400 }
      );
    }

    // Parse and validate JSON content
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const fileContent = JSON.parse(fileBuffer.toString());

    if (
      typeof fileContent !== "object" ||
      fileContent === null ||
      !fileContent.web
    ) {
      return new Response(JSON.stringify({ error: "Invalid JSON content" }), {
        status: 400,
      });
    }

    // Convert JSON object to string for database storage
    const credentialsString = JSON.stringify(fileContent);

    // Update user credentials in the database
    const updateResult = await prisma.user.update({
      where: {
        clerkId: userId,
      },
      data: { credentialsPath: credentialsString, username: fileName }, // Store as a string
    });

    return new Response(
      JSON.stringify({
        message: "Credentials uploaded and saved successfully",
        success: true,
        updateResult,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error uploading credentials:", error);
    return new Response(
      JSON.stringify({
        error: "Error uploading credentials: " + error.message,
      }),
      { status: 500 }
    );
  }
}
