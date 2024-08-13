import fs from "fs/promises";
import path from "path";

export async function GET() {
  try {
    const tokenPath = path.join(process.cwd(), "token.json");
    const tokenExists = await fs
      .access(tokenPath)
      .then(() => true)
      .catch(() => false);

    return new Response(JSON.stringify({ authTokenGenerated: tokenExists }), {
      status: 200,
    });
  } catch (error) {
    console.error("Error checking token:", error);
    return new Response(JSON.stringify({ error: "Error checking token" }), {
      status: 500,
    });
  }
}
