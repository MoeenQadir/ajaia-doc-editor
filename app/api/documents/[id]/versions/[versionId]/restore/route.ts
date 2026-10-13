import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserIdFromRequest, checkDocumentAccess } from "@/lib/permissions";

interface RouteParams {
  params: {
    id: string;
    versionId: string;
  };
}

export async function POST(req: Request, { params }: RouteParams) {
  try {
    const userId = getUserIdFromRequest(req);
    const { id: docId, versionId } = params;

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

    const version = await prisma.docVersion.findUnique({
      where: { id: versionId },
    });

    if (!version || version.documentId !== docId) {
      return NextResponse.json(
        { error: "Version snapshot not found" },
        { status: 404 }
      );
    }

    // Save a backup version of current state before restoring
    await prisma.docVersion.create({
      data: {
        documentId: docId,
        title: `${document.title} (Before Restore)`,
        content: document.content,
      },
    });

    // Restore version
    const updated = await prisma.document.update({
      where: { id: docId },
      data: {
        title: version.title,
        content: version.content,
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        shares: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Version restored successfully",
      document: updated,
    });
  } catch (error) {
    console.error("POST /api/documents/[id]/versions/[versionId]/restore error:", error);
    return NextResponse.json(
      { error: "Failed to restore version" },
      { status: 500 }
    );
  }
}

