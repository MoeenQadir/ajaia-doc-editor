import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserIdFromRequest, checkDocumentAccess } from "@/lib/permissions";

interface RouteParams {
  params: {
    id: string;
  };
}

// POST /api/documents/[id]/share - Share document with user
export async function POST(req: Request, { params }: RouteParams) {
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

    // Only owner can manage shares
    if (access.role !== "owner") {
      return NextResponse.json(
        { error: "Forbidden: Only the document owner can share this document" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { targetUserId, email, permission = "edit" } = body;

    let targetUser = null;
    if (targetUserId) {
      targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
    } else if (email) {
      targetUser = await prisma.user.findUnique({ where: { email } });
    }

    if (!targetUser) {
      // If user isn't found, check if it's Alice or Bob or auto-provision
      if (email === "bob@ajaia.io" || targetUserId === "user-bob") {
        targetUser = await prisma.user.upsert({
          where: { id: "user-bob" },
          update: {},
          create: {
            id: "user-bob",
            name: "Bob (Collaborator)",
            email: "bob@ajaia.io",
          },
        });
      } else if (email === "alice@ajaia.io" || targetUserId === "user-alice") {
        targetUser = await prisma.user.upsert({
          where: { id: "user-alice" },
          update: {},
          create: {
            id: "user-alice",
            name: "Alice (Owner)",
            email: "alice@ajaia.io",
          },
        });
      } else if (email) {
        // Auto-provision standard mock user for provided email
        targetUser = await prisma.user.create({
          data: {
            id: `user-${Date.now()}`,
            name: email.split("@")[0],
            email,
          },
        });
      } else {
        return NextResponse.json(
          { error: "Missing target user ID or email" },
          { status: 400 }
        );
      }
    }

    if (targetUser.id === document.ownerId) {
      return NextResponse.json(
        { error: "Cannot share document with the owner" },
        { status: 400 }
      );
    }

    const share = await prisma.docShare.upsert({
      where: {
        documentId_userId: {
          documentId: docId,
          userId: targetUser.id,
        },
      },
      update: {
        permission: permission === "view" ? "view" : "edit",
      },
      create: {
        documentId: docId,
        userId: targetUser.id,
        permission: permission === "view" ? "view" : "edit",
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      share,
    });
  } catch (error) {
    console.error("POST /api/documents/[id]/share error:", error);
    return NextResponse.json(
      { error: "Failed to share document" },
      { status: 500 }
    );
  }
}

