export type UserRole = "owner" | "shared" | "none";

export interface DocumentWithShares {
  id?: string;
  ownerId: string;
  shares?: Array<{
    userId: string;
    permission: string;
  }>;
}

export interface PermissionCheckResult {
  allowed: boolean;
  role: UserRole;
  permission?: "edit" | "view";
  canEdit: boolean;
  canDelete: boolean;
}

/**
 * Checks a user's access rights for a given document.
 * 
 * - Owner access -> Allowed (role: "owner", canEdit: true, canDelete: true)
 * - Shared user access -> Allowed (role: "shared", canEdit: permission === "edit", canDelete: false)
 * - Unshared user access -> Denied (role: "none", canEdit: false, canDelete: false)
 */
export function checkDocumentAccess(
  userId: string,
  doc: DocumentWithShares
): PermissionCheckResult {
  if (!userId) {
    return {
      allowed: false,
      role: "none",
      canEdit: false,
      canDelete: false,
    };
  }

  if (doc.ownerId === userId) {
    return {
      allowed: true,
      role: "owner",
      permission: "edit",
      canEdit: true,
      canDelete: true,
    };
  }

  const share = doc.shares?.find((s) => s.userId === userId);
  if (share) {
    return {
      allowed: true,
      role: "shared",
      permission: share.permission as "edit" | "view",
      canEdit: share.permission === "edit",
      canDelete: false,
    };
  }

  return {
    allowed: false,
    role: "none",
    canEdit: false,
    canDelete: false,
  };
}

export const MOCK_USERS = [
  {
    id: "user-alice",
    name: "Alice (Owner)",
    email: "alice@ajaia.io",
    avatar: "A",
  },
  {
    id: "user-bob",
    name: "Bob (Collaborator)",
    email: "bob@ajaia.io",
    avatar: "B",
  },
] as const;

export type MockUser = typeof MOCK_USERS[number];

export function getUserIdFromRequest(req: Request): string {
  const headerId = req.headers.get("x-user-id");
  if (headerId) return headerId;
  return "user-alice"; // Default fallback
}

