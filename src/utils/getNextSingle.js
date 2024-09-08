import { prisma } from "@/lib/prisma";

// Get the next available SMTP server in a round-robin fashion
export async function getNextSingle(userId) {
  // Fetch all SMTP servers associated with the current user
  const smtpServers = await prisma.single.findMany({
    where: { clerkUserId: userId },
    orderBy: { currentUsage: "asc" },
  });

  if (smtpServers.length === 0) {
    throw new Error("No SMTP servers found for this user");
  }

  // Find the next SMTP server to use
  const smtp = smtpServers[0];

  // Update `currentUsage` for the chosen SMTP
  await prisma.single.update({
    where: { id: smtp.id },
    data: { currentUsage: smtp.currentUsage + 1 },
  });

  // Rotate SMTP servers
  if (smtp.currentUsage + 1 >= smtpServers.length) {
    await prisma.single.updateMany({
      where: { clerkUserId: userId },
      data: { currentUsage: 0 },
    });
  }

  return smtp;
}
