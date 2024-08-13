// app/googleAuth.js
import { google } from "googleapis";
import fs from "fs/promises";

export async function getOAuth2Client(credentialsPath) {
  const credentials = JSON.parse(await fs.readFile(credentialsPath, "utf-8"));
  const { client_id, client_secret, redirect_uris } = credentials.web;

  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0] // Use the first redirect URI
  );

  return oAuth2Client;
}
