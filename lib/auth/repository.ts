import "server-only";

import { prisma } from "@/lib/db/client";

export function findUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      passwordHash: true,
      timeZone: true,
    },
  });
}

export function createUser(input: {
  email: string;
  passwordHash: string;
  timeZone?: string;
}) {
  return prisma.user.create({
    data: {
      email: input.email,
      passwordHash: input.passwordHash,
      timeZone: input.timeZone ?? "Europe/Amsterdam",
    },
    select: { id: true, email: true },
  });
}

export function countUsers() {
  return prisma.user.count();
}

export function createSessionRecord(input: {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  now: Date;
}) {
  return prisma.session.create({
    data: {
      userId: input.userId,
      tokenHash: input.tokenHash,
      expiresAt: input.expiresAt,
      createdAt: input.now,
      lastUsedAt: input.now,
    },
    select: { id: true },
  });
}

export function findSessionByTokenHash(tokenHash: string) {
  return prisma.session.findUnique({
    where: { tokenHash },
    include: {
      user: {
        select: { id: true, email: true, timeZone: true },
      },
    },
  });
}

export function touchSession(id: string, now: Date) {
  return prisma.session.updateMany({
    where: { id, revokedAt: null },
    data: { lastUsedAt: now },
  });
}

export function revokeSessionByTokenHash(tokenHash: string, now: Date) {
  return prisma.session.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: now },
  });
}

export function revokeSessionById(id: string, now: Date) {
  return prisma.session.updateMany({
    where: { id, revokedAt: null },
    data: { revokedAt: now },
  });
}

export function revokeAllSessionsForUser(userId: string, now: Date) {
  return prisma.session.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: now },
  });
}
