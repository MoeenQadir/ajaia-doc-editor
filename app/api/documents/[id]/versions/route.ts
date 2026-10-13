import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserIdFromRequest, checkDocumentAccess } from "@/lib/permissions";

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/documents/[id]/versions - List version history for document
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

    const versions = await prisma.docVersion.findMany({
      where: { documentId: docId },
      orderBy: { savedAt: "desc" },
    });

    return NextResponse.json({ versions });
  } catch (error) {
    console.error("GET /api/documents/[id]/versions error:", error);
    return NextResponse.json(
      { error: "Failed to fetch version history" },
      { status: 500 }
    );
  }
}

// POST /api/documents/[id]/versions - Manually create a version snapshot
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
    if (!access.canEdit) {
      return NextResponse.json(
        { error: "Forbidden: You do not have edit permissions" },
        { status: 403 }
      );
    }

    let body = { title: document.title, content: document.content };
    try {
      const json = await req.json();
      if (json.title) body.title = json.title;
      if (json.content) body.content = json.content;
    } catch {
      // Use existing document values
    }

    const version = await prisma.docVersion.create({
      data: {
        documentId: docId,
        title: body.title,
        content: body.content,
      },
    });

    return NextResponse.json({ success: true, version }, { status: 201 });
  } catch (error) {
    console.error("POST /api/documents/[id]/versions error:", error);
    return NextResponse.json(
      { error: "Failed to create version snapshot" },
      { status: 500 }
    );
  }
}

