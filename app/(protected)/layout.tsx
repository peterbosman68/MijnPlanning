import type { ReactNode } from "react";
import Link from "next/link";

import { requireUser } from "@/lib/auth/require-user";

import { logoutAction } from "./session-actions";
import styles from "./protected-shell.module.css";

export default async function ProtectedLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const session = await requireUser();

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <Link className={styles.brand} href="/vandaag">
          <span aria-hidden="true">MP</span>
          <strong>MijnPlanning</strong>
        </Link>

        <nav className={styles.navigation} aria-label="Hoofdnavigatie">
          <Link href="/vandaag">Vandaag</Link>
          <Link href="/taken">ToDo</Link>
        </nav>

        <div className={styles.account}>
          <span title={session.user.email}>{session.user.email}</span>
          <form action={logoutAction}>
            <button type="submit">Uitloggen</button>
          </form>
        </div>
      </header>
      {children}
    </div>
  );
}
