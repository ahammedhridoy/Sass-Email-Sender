import { prisma } from "@/lib/prisma";
import nodemailer from "nodemailer";
import { auth } from "@clerk/nextjs/server";
import { getNextSMTP } from "src/utils/getNextSMTP";

function replaceTags(template, email) {
  const randomCode = Math.floor(Math.random() * 10000000) + 1;
  const emailName = email;
  const subsid = `${String.fromCharCode(
    65 + Math.floor(Math.random() * 26)
  )}${Math.floor(Math.random() * 1000000000)
    .toString()
    .padStart(9, "0")
    .replace(/(\d{2})(\d{4})(\d{3})/, "$1-$2-$3")}`;

  const invoice = `#${String.fromCharCode(
    65 + Math.floor(Math.random() * 26)
  )}${Math.floor(Math.random() * 1000000)
    .toString()
    .padStart(6, "0")}`;
  const ref = `${String.fromCharCode(
    65 + Math.floor(Math.random() * 26)
  )}${String.fromCharCode(
    65 + Math.floor(Math.random() * 26)
  )}${String.fromCharCode(
    65 + Math.floor(Math.random() * 26)
  )}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${Math.floor(
    Math.random() * 10000
  )
    .toString()
    .padStart(4, "0")}`;

  return template
    .replace(/#RANDOM#/g, `#${randomCode}`)
    .replace(/#EMAIL#/g, `${emailName}`)
    .replace(/#SUBSID#/g, `(#${subsid})`)
    .replace(/#INVOICE#/g, invoice)
    .replace(/#REF#/g, `#${ref}`);
}

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
        let subject = formData.get("subject");
        let html = formData.get("html");
        const sender = formData.get("sender");
        const logo = formData.get("logo");
        const batchSize = parseInt(formData.get("batchSize"));
        const delayTime = parseInt(formData.get("delayTime"));
        const emailHeader = formData.get("emailHeader") === "true";
        const attachments = formData.getAll("attachments");

        if (!emailList.length || !subject || !html || !sender) {
          throw new Error("Missing required fields");
        }

        // Get the current authenticated user
        const { userId } = auth();

        // Initialize index to rotate SMTP servers
        let smtpIndex = 0;

        // Fetch mail headers from the database for the current user
        const headersRecord = await prisma.user.findUnique({
          where: { clerkId: userId },
        });

        if (!headersRecord || !headersRecord.content) {
          throw new Error("No mail headers found for this user");
        }

        const headersArray = headersRecord.content
          .split("\n")
          .filter((line) => line.trim() !== "");

        const attachmentsList = await Promise.all(
          attachments.map(async (file) => ({
            filename: file.name,
            content: Buffer.from(await file.arrayBuffer()),
          }))
        );

        // Loop through the email list and send emails in batches
        for (let i = 0; i < emailList.length; i++) {
          const currentEmail = emailList[i];

          // Get the next SMTP server
          const smtp = await getNextSMTP(userId);

          // Create the nodemailer transporter
          const transporter = nodemailer.createTransport({
            host: smtp.host,
            port: smtp.port,
            secure: smtp.secure, // true for 465, false for other ports
            auth: {
              user: smtp.user,
              pass: smtp.password,
            },
          });

          const randomHeader =
            headersArray[Math.floor(Math.random() * headersArray.length)];

          const processedSubject = replaceTags(subject, currentEmail);
          const processedHtml = replaceTags(
            `${logo ? logo + "<br/>" : ""} ${
              emailHeader ? randomHeader + "<br/>" : ""
            }${html}`,
            currentEmail
          );

          await transporter.sendMail({
            from: `${sender} <${smtp.user}>`,
            to: currentEmail,
            subject: processedSubject,
            html: processedHtml,
            attachments: attachmentsList,
          });

          controller.enqueue(
            encoder.encode(
              JSON.stringify({
                message: `Email Sent Successfully`,
                to: currentEmail,
                subject: processedSubject,
                html: processedHtml,
                sender,
                attachments: attachmentsList.map(
                  (attachment) => attachment.filename
                ),
                batchSize,
                delayTime,
                currentEmailCount: i + 1,
                totalEmailCount: emailList.length,
              }) + "\n"
            )
          );

          // Introduce delay after each batch
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
