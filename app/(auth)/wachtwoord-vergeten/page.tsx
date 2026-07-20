import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth/session";

import styles from "../login/login.module.css";
import { ForgotPasswordForm } from "./forgot-password-form";

export const metadata: Metadata = {
  title: "Wachtwoord vergeten | MijnPlanning",
  referrer: "no-referrer",
};

export default async function ForgotPasswordPage() {
  const session = await getSession();
  if (session) {
    redirect("/vandaag");
  }

  return (
    <main className={styles.page}>
      <section className={styles.panel} aria-labelledby="forgot-password-title">
        <div className={styles.brandMark} aria-hidden="true">
          MP
        </div>
        <p className={styles.eyebrow}>Account herstellen</p>
        <h1 id="forgot-password-title">Wachtwoord vergeten?</h1>
        <p className={styles.intro}>
          Vul het e-mailadres van je MijnPlanning-account in. Je ontvangt een
          eenmalige link die dertig minuten geldig is.
        </p>
        <ForgotPasswordForm />
      </section>
    </main>
  );
}
