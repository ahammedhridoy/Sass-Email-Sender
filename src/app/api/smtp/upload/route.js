import { prisma } from "@/lib/prisma";

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

    // Delete all existing SMTP credentials
    await prisma.sMTP.deleteMany({});

    // Store each SMTP credential in the database
    const createdSmtps = await Promise.all(
      smtpList.map(async (smtp) => {
        const { host, port, secure, user, password } = smtp;
        return await prisma.sMTP.create({
          data: {
            host,
            port,
            secure,
            user,
            password,
          },
        });
      })
    );

    return new Response(
      JSON.stringify({
        message: "SMTP credentials uploaded successfully",
        createdSmtps,
      }),
      { status: 201 }
    );
  } catch (error) {
    console.error("Error uploading SMTP credentials:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
}
