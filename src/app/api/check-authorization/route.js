import fs from "fs/promises";
import path from "path";

const tokenPath = path.join(process.cwd(), "token.json");

export async function GET() {
  try {
    await fs.access(tokenPath); // Check if the token file exists
    return new Response(JSON.stringify({ message: "Authorized" }), {
      status: 200,
    });
  } catch {
    return new Response(JSON.stringify({ error: "Not authorized" }), {
      status: 401,
    });
  }
}
