import { google } from "googleapis";
import fs from "fs";
import path from "path";

// Path for credentials file and token storage
const CREDENTIALS_PATH = path.join(process.cwd(), "credentials.json");
const TOKEN_PATH = path.join(process.cwd(), "token.json");

// Read credentials from file
const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, "utf-8"));
const { client_id, client_secret, redirect_uris } = credentials.web;

// Create OAuth2 client instance
const oAuth2Client = new google.auth.OAuth2(
  client_id,
  client_secret,
  redirect_uris[0]
);

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");

    if (!code) {
      return new Response(
        JSON.stringify({ error: "Authorization code not found" }),
        { status: 400 }
      );
    }

    // Exchange authorization code for tokens
    const { tokens } = await oAuth2Client.getToken(code);

    // Save tokens to a file
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));

    // Redirect to home page
    return new Response(null, {
      status: 302,
      headers: {
        Location: "/",
      },
    });
  } catch (error) {
    console.error("Error during authorization:", error);
    return new Response(
      JSON.stringify({ error: "Error during authorization" }),
      { status: 500 }
    );
  }
}
