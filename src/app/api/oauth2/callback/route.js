import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { google } from "googleapis";

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const { userId } = auth();

    if (!code) {
      return new Response(
        JSON.stringify({ error: "Authorization code not found" }),
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { clerkId: userId } });

    if (!user || !user.credentialsPath) {
      return new Response(JSON.stringify({ error: "Credentials not found" }), {
        status: 400,
      });
    }

    // Parse the credentials directly from the database
    const credentials = JSON.parse(user.credentialsPath);

    const { client_id, client_secret, redirect_uris } = credentials.web;

    // Create OAuth2 client with the credentials
    const oAuth2Client = new google.auth.OAuth2(
      client_id,
      client_secret,
      redirect_uris
    );

    // Exchange the authorization code for access tokens
    const { tokens } = await oAuth2Client.getToken(code);

    // Update the user's token in the database
    await prisma.user.update({
      where: { clerkId: userId },
      data: { tokenPath: JSON.stringify(tokens) },
    });

    return new Response(null, {
      status: 302,
      headers: { Location: "/" },
    });
  } catch (error) {
    console.error("Error during authorization:", error);
    return new Response(
      JSON.stringify({ error: "Error during authorization" }),
      { status: 500 }
    );
  }
}
