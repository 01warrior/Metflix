import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const channels = await db.channel.findMany({
    where: { isActive: true },
    orderBy: [{ category: "asc" }, { order: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      url: true,
      logo: true,
      category: true,
      order: true,
    },
  });
  return NextResponse.json({ data: channels });
}