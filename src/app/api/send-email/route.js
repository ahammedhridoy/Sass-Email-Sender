import { prisma } from "@/lib/prisma";
import nodemailer from "nodemailer";
import { google } from "googleapis";
import { auth } from "@clerk/nextjs/server";

export async function POST(req) {
  const encoder = new TextEncoder();

  const headers = new Headers({
    "Content-Type": "application/json",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const formData = await req.formData();
        const email = formData.get("to");
        const subject = formData.get("subject");
        const html = formData.get("html");
        const sender = formData.get("sender");
        const username = formData.get("username");
        const attachments = formData.getAll("attachments");
        const randomNumber = Math.floor(Math.random() * 999999);
        const batchSize = parseInt(formData.get("batchSize"));
        const delayTime = parseInt(formData.get("delayTime")); // Default to 10 seconds

        // Log received data for debugging
        console.log("Received Data:", {
          email,
          subject,
          html,
          sender,
          username,
          attachments: attachments.map((file) => file.name),
          randomNumber,
          batchSize,
          delayTime,
        });

        // Ensure email is defined and not empty
        if (!email) {
          return new Response(
            JSON.stringify({ error: "Recipient email is required" }),
            { status: 400 }
          );
        }

        // Fetch user from the database
        const { userId } = auth();
        const user = await prisma.user.findUnique({
          where: { clerkId: userId },
        });

        if (!user || !user.credentialsPath || !user.tokenPath) {
          return new Response(
            JSON.stringify({ error: "Credentials or token not found" }),
            { status: 400 }
          );
          controller.close();
          return;
        }

        // Directly parse the credentials from the database
        const credentials = JSON.parse(user.credentialsPath);
        const { client_id, client_secret, redirect_uris } = credentials.web;

        // Create OAuth2 client
        const oAuth2Client = new google.auth.OAuth2(
          client_id,
          client_secret,
          redirect_uris[0]
        );

        // Set credentials and fetch access token
        const token = JSON.parse(user.tokenPath);
        oAuth2Client.setCredentials(token);

        const accessToken = await oAuth2Client.getAccessToken();

        const transporter = nodemailer.createTransport({
          service: "gmail",
          pool: true,
          maxMessages: Infinity,
          auth: {
            type: "OAuth2",
            user: `${username}@gmail.com`,
            clientId: client_id,
            clientSecret: client_secret,
            refreshToken: token.refresh_token,
            accessToken: accessToken.token,
          },
        });

        const attachmentsList = await Promise.all(
          attachments.map(async (file) => ({
            filename: file.name,
            content: Buffer.from(await file.arrayBuffer()),
          }))
        );

        const emails = formData.get("to").split(",");
        for (let i = 0; i < emails.length; i++) {
          const currentEmail = emails[i];

          await transporter.sendMail({
            from: `${sender} <${username}@gmail.com>`,
            to: currentEmail,
            subject,
            html,
            attachments: attachmentsList,
          });

          const message = `Email sent to ${currentEmail}`;
          console.log(message);
          controller.enqueue(
            encoder.encode(
              JSON.stringify({
                message,
                subject,
                html,
                sender,
                username,
                attachments: attachmentsList.map(
                  (attachment) => attachment.filename
                ),
                batchSize,
                delayTime,
              })
            )
          );

          if ((i + 1) % batchSize === 0) {
            const batchMessage = `Batch complete. Waiting ${delayTime} seconds...`;
            console.log(batchMessage);
            controller.enqueue(
              encoder.encode(
                JSON.stringify({
                  message: batchMessage,
                  subject,
                  html,
                  sender,
                  username,
                  attachments: attachmentsList.map(
                    (attachment) => attachment.filename
                  ),
                  batchSize,
                  delayTime,
                })
              )
            );
            await new Promise((resolve) =>
              setTimeout(resolve, delayTime * 1000)
            );
          }
        }

        controller.close();
      } catch (error) {
        console.error("Error sending emails:", error);
        controller.enqueue(
          encoder.encode(
            JSON.stringify({
              error: error.message,
            })
          )
        );
        controller.close();
      }
    },
  });

  return new Response(stream, { headers });
}
