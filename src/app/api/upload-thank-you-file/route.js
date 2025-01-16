import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import fs from "fs";
import path from "path";

export async function POST(req) {
  const { userId } = auth();

  // Parse the incoming request to extract file content
  const { fileContent } = await req.json();

  if (!fileContent) {
    return new Response(JSON.stringify({ error: "No file content provided" }), {
      status: 400,
    });
  }

  // Save the content to a local file
  const filePath = path.join(process.cwd(), "text-file2.txt");
  fs.writeFileSync(filePath, fileContent, "utf8");

  // Save or update the file content in the database
  await prisma.user.upsert({
    where: { clerkId: userId },
    update: { message: fileContent },
    create: { message: fileContent, clerkId: userId },
  });

  // Return a success response
  return new Response(
    JSON.stringify({ message: "File uploaded successfully" }),
    { status: 200 }
  );
}
