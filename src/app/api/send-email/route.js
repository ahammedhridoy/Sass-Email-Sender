import nodemailer from "nodemailer";
import { google } from "googleapis";
import fs from "fs/promises";
import path from "path";

const TOKEN_PATH = path.join(process.cwd(), "token.json");

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
        const subject = formData.get("subject");
        const html = formData.get("html");
        const sender = formData.get("sender");
        const username = formData.get("username");
        const attachments = formData.getAll("attachments");
        const batchSize = parseInt(formData.get("batchSize"), 10) || 50;
        const delayTime = parseInt(formData.get("delayTime"), 10) || 10; // Default to 10 seconds

        console.log("Received Data:", {
          subject,
          html,
          sender,
          username,
          attachments: attachments.map((file) => file.name),
          batchSize,
          delayTime,
        });

        if (!subject || !html || !sender || !username) {
          controller.enqueue(
            encoder.encode(
              JSON.stringify({
                error: "Missing required fields",
              })
            )
          );
          controller.close();
          return;
        }

        const tempPath = path.join(process.cwd(), "credentials.json");
        const credentials = JSON.parse(await fs.readFile(tempPath, "utf-8"));
        const { client_id, client_secret, redirect_uris } = credentials.web;
        const oAuth2Client = new google.auth.OAuth2(
          client_id,
          client_secret,
          redirect_uris[0]
        );

        const token = JSON.parse(await fs.readFile(TOKEN_PATH, "utf-8"));
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

        const emails = formData.get("to").split(","); // Assuming `to` contains a list of emails separated by commas
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
