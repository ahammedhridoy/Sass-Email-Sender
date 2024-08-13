import { google } from "googleapis";
import fs from "fs/promises";
import path from "path";

const credentialsPath = path.join(process.cwd(), "credentials.json");

async function getOAuth2Client() {
  const credentials = JSON.parse(await fs.readFile(credentialsPath, "utf-8"));
  const { client_id, client_secret, redirect_uris } = credentials.web;
  return new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
}

export async function GET() {
  try {
    const oAuth2Client = await getOAuth2Client();
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
