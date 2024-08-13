import fs from "fs/promises";
import path from "path";

const CREDENTIALS_PATH = path.join(process.cwd(), "credentials.json");

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get("credentials");

    if (!file || !file.name.endsWith(".json")) {
      return new Response(JSON.stringify({ error: "Invalid file format" }), {
        status: 400,
      });
    }

    const tempPath = path.join(process.cwd(), "credentials.json");
    await fs.writeFile(tempPath, Buffer.from(await file.arrayBuffer()));

    return new Response(
      JSON.stringify({
        message: "Credentials uploaded successfully",
        success: true,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error uploading credentials:", error);
    return new Response(
      JSON.stringify({ error: "Error uploading credentials" }),
      { status: 500 }
    );
  }
}
