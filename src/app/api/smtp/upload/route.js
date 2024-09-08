import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server"; // Assuming you're using Clerk's nextjs package for authentication

// POST /api/smtp/upload
export async function POST(req) {
  try {
    const smtpList = await req.json();
    const user = await currentUser();

    if (!user || !user.id) {
      return new Response(
        JSON.stringify({ error: "User not authenticated." }),
        { status: 401 }
      );
    }

    // Validate that the file contains an array of SMTP credentials
    if (!Array.isArray(smtpList)) {
      return new Response(
        JSON.stringify({
          error: "Invalid file format. Expected an array of SMTP credentials.",
        }),
        { status: 400 }
      );
    }

    // Process each SMTP credential in the array
    const processedSmtps = await Promise.all(
      smtpList.map(async (smtp) => {
        const { host, port, secure, user: smtpUser, password } = smtp;

        // Upsert the SMTP credential in the database, associated with the current user
        return await prisma.sMTP.upsert({
          where: {
            user_host_port_secure_unique: {
              host,
              port,
              secure,
              user: smtpUser,
            },
          },
          update: {
            password, // Replace existing password
            currentUsage: 0, // Reset usage count (if applicable)
            createdAt: new Date(), // Update creation time (if desired)
          },
          create: {
            host,
            port,
            secure,
            user: smtpUser,
            password,
            currentUsage: 0,
            clerkUserId: user.id, // Associate with the authenticated Clerk user
          },
        });
      })
    );

    return new Response(
      JSON.stringify({
        message: "SMTP credentials processed successfully",
        processedSmtps,
      }),
      { status: 201 }
    );
  } catch (error) {
    console.error("Error processing SMTP credentials:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
}

// GET /api/smtp/upload
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
    const smtps = await prisma.sMTP.findMany({
      where: {
        clerkUserId: user.id,
      },
    });

    return new Response(JSON.stringify({ smtps }), { status: 200 });
  } catch (error) {
    console.log("Error fetching SMTP records:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
}
