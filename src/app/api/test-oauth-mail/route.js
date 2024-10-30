import { prisma } from "@/lib/prisma";
import nodemailer from "nodemailer";
import { google } from "googleapis";
import { auth } from "@clerk/nextjs/server";

export async function POST(req) {
  try {
    const formData = await req.formData();
    const emailList = formData.get("to")?.split(",") || [];
    const sender = formData.get("sender");
    const username = formData.get("username");
    console.log("formData", formData);
    console.log("emailList", emailList);

    if (!emailList.length || !sender || !username) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400 }
      );
    }

    const { userId } = auth();
    const user = await prisma.user.findUnique({ where: { clerkId: userId } });

    if (!user || !user.credentialsPath || !user.tokenPath) {
      return new Response(
        JSON.stringify({ error: "Credentials or token not found" }),
        { status: 400 }
      );
    }

    const credentials = JSON.parse(user.credentialsPath);
    const { client_id, client_secret, redirect_uris } = credentials.web;

    const oAuth2Client = new google.auth.OAuth2(
      client_id,
      client_secret,
      redirect_uris
    );
    const token = JSON.parse(user.tokenPath);
    oAuth2Client.setCredentials(token);

    const accessToken = await oAuth2Client.getAccessToken();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: username,
        clientId: client_id,
        clientSecret: client_secret,
        refreshToken: token.refresh_token,
        accessToken: accessToken.token,
      },
    });

    for (const recipient of emailList) {
      await transporter.sendMail({
        from: `${sender} <${username}>`,
        to: recipient,
        subject: "Test Email",
        html: "Email Body",
      });
    }

    return new Response(
      JSON.stringify({ message: "Email Sent Successfully" }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error sending emails:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
}
