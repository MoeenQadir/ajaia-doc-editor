import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserIdFromRequest, checkDocumentAccess } from "@/lib/permissions";

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/documents/[id] - Fetch document metadata + content
export async function GET(req: Request, { params }: RouteParams) {
  try {
    const userId = getUserIdFromRequest(req);
    const docId = params.id;

    const document = await prisma.document.findUnique({
      where: { id: docId },
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

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    const access = checkDocumentAccess(userId, document);

    if (!access.allowed) {
      return NextResponse.json(
        { error: "Access denied: You do not have permission to view this document" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      document,
      access,
    });
  } catch (error) {
    console.error("GET /api/documents/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch document" },
      { status: 500 }
    );
  }
}

// PATCH /api/documents/[id] - Update document title or HTML content (Auto-save)
export async function PATCH(req: Request, { params }: RouteParams) {
  try {
    const userId = getUserIdFromRequest(req);
    const docId = params.id;

    const document = await prisma.document.findUnique({
      where: { id: docId },
      include: {
        shares: true,
      },
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
        { error: "Forbidden: You do not have edit permissions for this document" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const updateData: { title?: string; content?: string } = {};

    if (typeof body.title === "string") {
      updateData.title = body.title.trim() || "Untitled Document";
    }
    if (typeof body.content === "string") {
      updateData.content = body.content;
    }

    const updated = await prisma.document.update({
      where: { id: docId },
      data: updateData,
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

    // Automatically save version history snapshot on update
    try {
      await prisma.docVersion.create({
        data: {
          documentId: docId,
          title: updated.title,
          content: updated.content,
        },
      });
    } catch (vErr) {
      console.warn("Could not create version snapshot:", vErr);
    }

    return NextResponse.json({
      document: updated,
      access,
    });
  } catch (error) {
    console.error("PATCH /api/documents/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update document" },
      { status: 500 }
    );
  }
}

// DELETE /api/documents/[id] - Delete document if current user is owner
export async function DELETE(req: Request, { params }: RouteParams) {
  try {
    const userId = getUserIdFromRequest(req);
    const docId = params.id;

    const document = await prisma.document.findUnique({
      where: { id: docId },
      include: {
        shares: true,
      },
    });

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    const access = checkDocumentAccess(userId, document);

    if (!access.canDelete) {
      return NextResponse.json(
        { error: "Forbidden: Only the document owner can delete this document" },
        { status: 403 }
      );
    }

    await prisma.document.delete({
      where: { id: docId },
    });

    return NextResponse.json({
      success: true,
      message: "Document successfully deleted",
    });
  } catch (error) {
    console.error("DELETE /api/documents/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete document" },
      { status: 500 }
    );
  }
}

