import type { ReactNode } from "react";

import { requireUser } from "@/lib/auth/require-user";

export default async function TakenLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  await requireUser();
  return children;
}
