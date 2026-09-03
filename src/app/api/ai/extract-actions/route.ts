import { NextRequest, NextResponse } from "next/server";
import { extractActionItems } from "@/lib/utils/task-breakdown";

export async function POST(req: NextRequest) {
  const { notes } = await req.json();
  if (!notes) {
    return NextResponse.json({ error: "Notes are required" }, { status: 400 });
  }

  const actions = extractActionItems(notes);
  return NextResponse.json({ actions });
}
