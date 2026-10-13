import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserIdFromRequest } from "@/lib/permissions";

// GET /api/documents - Returns owned and shared documents for current user
export async function GET(req: Request) {
  try {
    const userId = getUserIdFromRequest(req);

    // Verify user exists or ensure placeholder
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      // If user record doesn't exist, provide fallback
      await prisma.user.upsert({
        where: { id: userId },
        update: {},
        create: {
          id: userId,
          name: userId === "user-bob" ? "Bob (Collaborator)" : "Alice (Owner)",
          email: userId === "user-bob" ? "bob@ajaia.io" : "alice@ajaia.io",
        },
      });
    }

    const [owned, shared] = await Promise.all([
      prisma.document.findMany({
        where: { ownerId: userId },
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
        orderBy: { updatedAt: "desc" },
      }),
      prisma.document.findMany({
        where: {
          shares: {
            some: { userId: userId },
          },
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
        orderBy: { updatedAt: "desc" },
      }),
    ]);

    return NextResponse.json({ owned, shared });
  } catch (error: any) {
    console.error("GET /api/documents error:", error);
    return NextResponse.json(
      { error: "Failed to fetch documents", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}

// POST /api/documents - Creates a new blank document for the current user
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

    let body = { title: "Untitled Document", content: "" };
    try {
      const parsed = await req.json();
      if (parsed.title) body.title = parsed.title;
      if (parsed.content) body.content = parsed.content;
    } catch {
      // Body was empty or not JSON, fallback to defaults
    }

    const document = await prisma.document.create({
      data: {
        title: body.title.trim() || "Untitled Document",
        content: body.content || "<p></p>",
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

    return NextResponse.json(document, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/documents error:", error);
    return NextResponse.json(
      { error: "Failed to create document", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}

