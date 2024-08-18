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
        const emailList = formData.get("to")?.split(",") || [];
        const subject = formData.get("subject");
        const html = formData.get("html");
        const sender = formData.get("sender");
        const username = formData.get("username");
        const attachments = formData.getAll("attachments");
        const batchSize = parseInt(formData.get("batchSize"));
        const delayTime = parseInt(formData.get("delayTime"));
        const emailHeader = formData.get("emailHeader") === "true";
        console.log(emailHeader);

        if (!emailList.length || !subject || !html || !sender || !username) {
          throw new Error("Missing required fields");
        }

        const randomInv = Math.floor(Math.random() * 10000000) + 1; // Generate random invoice number

        const { userId } = auth();
        const user = await prisma.user.findUnique({
          where: { clerkId: userId },
        });

        if (!user || !user.credentialsPath || !user.tokenPath) {
          controller.enqueue(
            encoder.encode(
              JSON.stringify({ error: "Credentials or token not found" }) + "\n"
            )
          );
          controller.close();
          return;
        }

        const credentials = JSON.parse(user.credentialsPath);
        const { client_id, client_secret, redirect_uris } = credentials.web;

        const oAuth2Client = new google.auth.OAuth2(
          client_id,
          client_secret,
          redirect_uris[0]
        );

        const token = JSON.parse(user.tokenPath);
        oAuth2Client.setCredentials(token);

        const accessToken = await oAuth2Client.getAccessToken();

        const transporter = nodemailer.createTransport({
          service: "gmail",
          pool: true,
          maxMessages: Infinity,
          auth: {
            type: "OAuth2",
            user: `${username}`,
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

        // Fetch headers from the database
        const headersRecord = await prisma.user.findUnique({
          where: { clerkId: userId },
        });

        if (!headersRecord || !headersRecord.content) {
          throw new Error("No mail headers found");
        }

        const headersArray = headersRecord.content
          .split("\n")
          .filter((line) => line.trim() !== "");

        for (let i = 0; i < emailList.length; i++) {
          const currentEmail = emailList[i];
          const randomHeader =
            headersArray[Math.floor(Math.random() * headersArray.length)];

          await transporter.sendMail({
            from: `${sender} <${username}>`,
            to: currentEmail,
            subject: `${subject} #${randomInv}`,
            html: `${emailHeader ? randomHeader + "<br/>" : ""}${html}`,
            attachments: attachmentsList,
          });

          const message = `${currentEmail}`;
          controller.enqueue(
            encoder.encode(
              JSON.stringify({
                message: `Email Sent Successfully\nTo: ${currentEmail}`,
                subject,
                html,
                sender,
                username,
                attachments: attachmentsList.map(
                  (attachment) => attachment.filename
                ),
                batchSize,
                delayTime,
              }) + "\n"
            )
          );

          if ((i + 1) % batchSize === 0) {
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
            }) + "\n"
          )
        );
        controller.close();
      }
    },
  });

  return new Response(stream, { headers });
}
