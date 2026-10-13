import { describe, it, expect } from "vitest";
import { checkDocumentAccess, type DocumentWithShares } from "../lib/permissions";

describe("Document Access & Sharing Authorization", () => {
  const sampleDoc: DocumentWithShares = {
    id: "doc-test-123",
    ownerId: "user-alice",
    shares: [
      {
        userId: "user-bob",
        permission: "edit",
      },
      {
        userId: "user-charlie",
        permission: "view",
      },
    ],
  };

  it("Owner access -> Allowed (role: 'owner', canEdit: true, canDelete: true)", () => {
    const result = checkDocumentAccess("user-alice", sampleDoc);
    expect(result.allowed).toBe(true);
    expect(result.role).toBe("owner");
    expect(result.canEdit).toBe(true);
    expect(result.canDelete).toBe(true);
  });

  it("Shared user access with edit rights -> Allowed (role: 'shared', canEdit: true, canDelete: false)", () => {
    const result = checkDocumentAccess("user-bob", sampleDoc);
    expect(result.allowed).toBe(true);
    expect(result.role).toBe("shared");
    expect(result.permission).toBe("edit");
    expect(result.canEdit).toBe(true);
    expect(result.canDelete).toBe(false);
  });

  it("Shared user access with view rights -> Allowed (role: 'shared', canEdit: false, canDelete: false)", () => {
    const result = checkDocumentAccess("user-charlie", sampleDoc);
    expect(result.allowed).toBe(true);
    expect(result.role).toBe("shared");
    expect(result.permission).toBe("view");
    expect(result.canEdit).toBe(false);
    expect(result.canDelete).toBe(false);
  });

  it("Unshared user access -> Denied (role: 'none', canEdit: false, canDelete: false)", () => {
    const result = checkDocumentAccess("user-stranger", sampleDoc);
    expect(result.allowed).toBe(false);
    expect(result.role).toBe("none");
    expect(result.canEdit).toBe(false);
    expect(result.canDelete).toBe(false);
  });

  it("Empty or missing user ID -> Denied (role: 'none')", () => {
    const result = checkDocumentAccess("", sampleDoc);
    expect(result.allowed).toBe(false);
    expect(result.role).toBe("none");
  });
});

