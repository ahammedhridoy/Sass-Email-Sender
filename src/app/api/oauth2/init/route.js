import { prisma } from "@/lib/prisma";
import { google } from "googleapis"; // Ensure this import is included
import { auth } from "@clerk/nextjs/server";

export async function GET(req) {
  try {
    const { userId } = auth();

    const oAuth2Client = await getOAuth2Client(userId);
    const SCOPES = ["https://mail.google.com/"];
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: "offline",
      scope: SCOPES,
    });

    return new Response(null, { status: 302, headers: { Location: authUrl } });
  } catch (error) {
    console.error("Error generating auth URL:", error);
    return new Response(
      JSON.stringify({ error: "Error generating auth URL" }),
      { status: 500 }
    );
  }
}

async function getOAuth2Client(userId) {
  const user = await prisma.user.findUnique({ where: { clerkId: userId } });

  if (!user || !user.credentialsPath) {
    throw new Error("Credentials not found");
  }

  // Parse the credentialsPath string into a JSON object
  const credentials = JSON.parse(user.credentialsPath);

  // Check if 'web' exists and is properly structured
  if (!credentials || !credentials.web) {
    throw new Error("Invalid credentials format: 'web' property is missing");
  }

  const { client_id, client_secret, redirect_uris } = credentials.web;

  // Ensure values are present
  if (
    !client_id ||
    !client_secret ||
    !redirect_uris ||
    redirect_uris.length === 0
  ) {
    throw new Error("Invalid credentials format: Missing required fields");
  }

  // Create and return the OAuth2 client
  return new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
}
