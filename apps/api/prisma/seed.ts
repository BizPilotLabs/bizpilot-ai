import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const permissions = [
  {
    key: "organizations.read",
    name: "Read organizations",
    resource: "organizations",
    action: "read",
    description: "View organization records and settings.",
  },
  {
    key: "organizations.manage",
    name: "Manage organizations",
    resource: "organizations",
    action: "manage",
    description: "Create and update organization records and settings.",
  },
  {
    key: "users.read",
    name: "Read users",
    resource: "users",
    action: "read",
    description: "View user profiles and membership records.",
  },
  {
    key: "users.manage",
    name: "Manage users",
    resource: "users",
    action: "manage",
    description: "Create, update, suspend, and restore users.",
  },
  {
    key: "roles.read",
    name: "Read roles",
    resource: "roles",
    action: "read",
    description: "View roles and assigned permissions.",
  },
  {
    key: "roles.manage",
    name: "Manage roles",
    resource: "roles",
    action: "manage",
    description: "Create, update, and assign roles and permissions.",
  },
  {
    key: "audit_logs.read",
    name: "Read audit logs",
    resource: "audit_logs",
    action: "read",
    description: "View audit history for an organization.",
  },
] as const;

const seed = async (): Promise<void> => {
  await prisma.$transaction(
    permissions.map((permission) =>
      prisma.permission.upsert({
        where: { key: permission.key },
        update: {
          name: permission.name,
          resource: permission.resource,
          action: permission.action,
          description: permission.description,
          deletedAt: null,
        },
        create: permission,
      }),
    ),
  );
};

seed()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });