// utils/getNextSMTP.js
import { prisma } from "@/lib/prisma";

export async function getNextSMTP() {
  const smtp = await prisma.sMTP.findFirst({
    orderBy: {
      currentUsage: "asc",
    },
  });

  await prisma.sMTP.update({
    where: { id: smtp.id },
    data: { currentUsage: smtp.currentUsage + 1 },
  });

  return smtp;
}
