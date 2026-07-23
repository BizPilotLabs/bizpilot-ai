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
  {
    key: "teams.read",
    name: "Read teams",
    resource: "teams",
    action: "read",
    description: "View teams and team memberships.",
  },
  {
    key: "teams.create",
    name: "Create teams",
    resource: "teams",
    action: "create",
    description: "Create teams within an organization.",
  },
  {
    key: "teams.update",
    name: "Update teams",
    resource: "teams",
    action: "update",
    description: "Update teams, leads, and team memberships.",
  },
  {
    key: "teams.delete",
    name: "Delete teams",
    resource: "teams",
    action: "delete",
    description: "Archive teams within an organization.",
  },
  {
    key: "comments.read",
    name: "Read comments",
    resource: "comments",
    action: "read",
    description: "View task comments within an organization.",
  },
  {
    key: "comments.create",
    name: "Create comments",
    resource: "comments",
    action: "create",
    description: "Create task comments within an organization.",
  },
  {
    key: "comments.update",
    name: "Update comments",
    resource: "comments",
    action: "update",
    description: "Update owned comments or moderate comments with elevated access.",
  },
  {
    key: "comments.delete",
    name: "Delete comments",
    resource: "comments",
    action: "delete",
    description: "Delete owned comments or moderate comments with elevated access.",
  },
  {
    key: "attachments.read",
    name: "Read attachments",
    resource: "attachments",
    action: "read",
    description: "View task attachment metadata within an organization.",
  },
  {
    key: "attachments.create",
    name: "Create attachments",
    resource: "attachments",
    action: "create",
    description: "Upload task attachment metadata within an organization.",
  },
  {
    key: "attachments.delete",
    name: "Delete attachments",
    resource: "attachments",
    action: "delete",
    description: "Delete task attachments within an organization.",
  },
  {
    key: "activities.read",
    name: "Read activities",
    resource: "activities",
    action: "read",
    description: "View organization activity feed records.",
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