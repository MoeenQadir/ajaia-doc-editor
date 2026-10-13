import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserIdFromRequest, checkDocumentAccess } from "@/lib/permissions";

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/documents/[id]/comments - List all comments on the document
export async function GET(req: Request, { params }: RouteParams) {
  try {
    const userId = getUserIdFromRequest(req);
    const docId = params.id;

    const document = await prisma.document.findUnique({
      where: { id: docId },
      include: { shares: true },
    });

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    const access = checkDocumentAccess(userId, document);
    if (!access.allowed) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    const comments = await prisma.comment.findMany({
      where: { documentId: docId },
      include: {
        author: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ comments });
  } catch (error) {
    console.error("GET /api/documents/[id]/comments error:", error);
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    );
  }
}

// POST /api/documents/[id]/comments - Post a new comment
export async function POST(req: Request, { params }: RouteParams) {
  try {
    const userId = getUserIdFromRequest(req);
    const docId = params.id;

    const document = await prisma.document.findUnique({
      where: { id: docId },
      include: { shares: true },
    });

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    const access = checkDocumentAccess(userId, document);
    if (!access.allowed) {
      return NextResponse.json(
        { error: "Forbidden: You do not have access to comment" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const text = (body.text || "").trim();

    if (!text) {
      return NextResponse.json(
        { error: "Comment text cannot be empty" },
        { status: 400 }
      );
    }

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

    const comment = await prisma.comment.create({
      data: {
        documentId: docId,
        authorId: userId,
        text,
      },
      include: {
        author: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    console.error("POST /api/documents/[id]/comments error:", error);
    return NextResponse.json(
      { error: "Failed to post comment" },
      { status: 500 }
    );
  }
}

