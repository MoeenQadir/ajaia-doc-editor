import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserIdFromRequest, checkDocumentAccess } from "@/lib/permissions";

interface RouteParams {
  params: {
    id: string;
    commentId: string;
  };
}

// PATCH /api/documents/[id]/comments/[commentId] - Resolve / unresolve comment
export async function PATCH(req: Request, { params }: RouteParams) {
  try {
    const userId = getUserIdFromRequest(req);
    const { id: docId, commentId } = params;

    const document = await prisma.document.findUnique({
      where: { id: docId },
      include: { shares: true },
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const access = checkDocumentAccess(userId, document);
    if (!access.allowed) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const existing = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!existing || existing.documentId !== docId) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    const body = await req.json();
    const resolved = typeof body.resolved === "boolean" ? body.resolved : !existing.resolved;

    const updated = await prisma.comment.update({
      where: { id: commentId },
      data: { resolved },
      include: {
        author: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json({ comment: updated });
  } catch (error) {
    console.error("PATCH /api/documents/[id]/comments/[commentId] error:", error);
    return NextResponse.json({ error: "Failed to update comment" }, { status: 500 });
  }
}

// DELETE /api/documents/[id]/comments/[commentId] - Delete comment
export async function DELETE(req: Request, { params }: RouteParams) {
  try {
    const userId = getUserIdFromRequest(req);
    const { id: docId, commentId } = params;

    const document = await prisma.document.findUnique({
      where: { id: docId },
      include: { shares: true },
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment || comment.documentId !== docId) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    // Only comment author or document owner can delete
    if (comment.authorId !== userId && document.ownerId !== userId) {
      return NextResponse.json(
        { error: "Forbidden: You cannot delete another user's comment" },
        { status: 403 }
      );
    }

    await prisma.comment.delete({
      where: { id: commentId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/documents/[id]/comments/[commentId] error:", error);
    return NextResponse.json({ error: "Failed to delete comment" }, { status: 500 });
  }
}

