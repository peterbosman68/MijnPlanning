import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth/session";

import { LoginForm } from "./login-form";
import styles from "./login.module.css";

export default async function LoginPage() {
  const session = await getSession();

  if (session) {
    redirect("/vandaag");
  }

  return (
    <main className={styles.page}>
      <section className={styles.panel} aria-labelledby="login-title">
        <div className={styles.brandMark} aria-hidden="true">
          MP
        </div>
        <p className={styles.eyebrow}>Persoonlijke planning</p>
        <h1 id="login-title">Inloggen bij MijnPlanning</h1>
        <p className={styles.intro}>
          Gebruik je eigen MijnPlanning-account. De Microsoft-koppeling staat hier los van.
        </p>
        <LoginForm />
      </section>
    </main>
  );
}
