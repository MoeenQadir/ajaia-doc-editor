import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { parseFileToHtml } from "@/lib/fileParser";
import { getUserIdFromRequest } from "@/lib/permissions";

export async function POST(req: Request) {
  try {
    const userId = getUserIdFromRequest(req);

    // Ensure user exists
    await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: {
        id: userId,
        name: userId === "user-bob" ? "Bob (Collaborator)" : "Alice (Owner)",
        email: userId === "user-bob" ? "bob@ajaia.io" : "alice@ajaia.io",
      },
    });

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded" },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { title, html } = await parseFileToHtml(file.name, buffer);

    const document = await prisma.document.create({
      data: {
        title: title || "Imported Document",
        content: html || "<p></p>",
        ownerId: userId,
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
        shares: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      document,
    }, { status: 201 });
  } catch (error) {
    console.error("POST /api/upload error:", error);
    return NextResponse.json(
      { error: "Failed to process and import file" },
      { status: 500 }
    );
  }
}

