import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth/session";

import styles from "../login/login.module.css";
import { ResetPasswordForm } from "./reset-password-form";

export const metadata: Metadata = {
  title: "Nieuw wachtwoord | MijnPlanning",
  referrer: "no-referrer",
};

type ResetPasswordPageProps = Readonly<{
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>;

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const session = await getSession();
  if (session) {
    redirect("/vandaag");
  }

  const params = await searchParams;
  const token = typeof params.token === "string" ? params.token : "";

  return (
    <main className={styles.page}>
      <section className={styles.panel} aria-labelledby="reset-password-title">
        <div className={styles.brandMark} aria-hidden="true">
          MP
        </div>
        <p className={styles.eyebrow}>Account herstellen</p>
        <h1 id="reset-password-title">Nieuw wachtwoord instellen</h1>
        <p className={styles.intro}>
          Kies een nieuw wachtwoord voor je eigen MijnPlanning-account.
        </p>
        <ResetPasswordForm token={token} />
      </section>
    </main>
  );
}
