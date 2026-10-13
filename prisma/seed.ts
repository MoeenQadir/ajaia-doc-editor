import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Upsert Alice
  const alice = await prisma.user.upsert({
    where: { email: "alice@ajaia.io" },
    update: {
      name: "Alice (Owner)",
    },
    create: {
      id: "user-alice",
      name: "Alice (Owner)",
      email: "alice@ajaia.io",
    },
  });

  // Upsert Bob
  const bob = await prisma.user.upsert({
    where: { email: "bob@ajaia.io" },
    update: {
      name: "Bob (Collaborator)",
    },
    create: {
      id: "user-bob",
      name: "Bob (Collaborator)",
      email: "bob@ajaia.io",
    },
  });

  console.log(`Users seeded: ${alice.name} (${alice.id}), ${bob.name} (${bob.id})`);

  // Sample Shared Document
  const sampleDocId = "doc-sample-architecture-spec";
  const existingDoc = await prisma.document.findUnique({
    where: { id: sampleDocId },
  });

  const sampleContent = `
    <h1>Project Alpha: AI-Native Architecture Specification</h1>
    <p>Welcome to <strong>Ajaia Docs</strong>, an AI-native collaborative document editor inspired by Google Docs and tailored for modern intelligent workflows.</p>
    <h2>Key Architectural Pillars</h2>
    <ul>
      <li><strong>Instant Zero-Config Persistence:</strong> Powered by SQLite and Prisma ORM for seamless local performance.</li>
      <li><strong>Multi-User Simulation:</strong> Seamlessly switch between <em>Alice (Owner)</em> and <em>Bob (Collaborator)</em> via the active user switcher in the navbar.</li>
      <li><strong>Real-Time Debounced Auto-Save:</strong> Edits are captured smoothly with live status feedback.</li>
      <li><strong>Rich Text & Typography:</strong> Full formatting suite supporting Bold, Italic, Underline, Headers, and Lists.</li>
      <li><strong>Universal Document Ingestion:</strong> Ingest <code>.txt</code>, <code>.md</code>, and <code>.docx</code> files directly into formatted canvas docs.</li>
    </ul>
    <h2>Collaborator Notes</h2>
    <p>This document is owned by <strong>Alice</strong> and shared with <strong>Bob</strong> with full editing permissions. Feel free to collaborate, modify headings, or test the theme toggle!</p>
  `.trim();

  if (!existingDoc) {
    const doc = await prisma.document.create({
      data: {
        id: sampleDocId,
        title: "Project Alpha: AI-Native Architecture Spec",
        content: sampleContent,
        ownerId: alice.id,
      },
    });

    await prisma.docShare.create({
      data: {
        documentId: doc.id,
        userId: bob.id,
        permission: "edit",
      },
    });

    console.log(`Sample document seeded and shared with Bob: ${doc.title}`);
  } else {
    console.log(`Sample document already exists: ${existingDoc.title}`);
  }

  console.log("Database seed completed successfully.");
}

main()
  .catch((e) => {
    console.error("Error during database seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

