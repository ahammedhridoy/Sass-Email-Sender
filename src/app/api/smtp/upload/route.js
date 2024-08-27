import { prisma } from "@/lib/prisma";

// POST /api/smtp/upload
export async function POST(req) {
  try {
    const smtpList = await req.json();

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
        const { host, port, secure, user, password } = smtp;

        // Upsert the SMTP credential in the database
        return await prisma.sMTP.upsert({
          where: {
            user_host_port_secure_unique: {
              host,
              port,
              secure,
              user,
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
            user,
            password,
            currentUsage: 0,
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
    const smtps = await prisma.sMTP.findMany();
    return new Response(JSON.stringify({ smtps }), { status: 200 });
  } catch (error) {
    console.log(error);
  }
}
