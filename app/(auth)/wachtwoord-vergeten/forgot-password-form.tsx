"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import styles from "../login/login.module.css";
import {
  forgotPasswordAction,
  type ForgotPasswordActionState,
} from "./actions";

const initialState: ForgotPasswordActionState = {
  status: "idle",
  message: "",
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button className={styles.submit} type="submit" disabled={pending}>
      {pending ? "Herstelmail aanvragen…" : "Herstelmail aanvragen"}
    </button>
  );
}

export function ForgotPasswordForm() {
  const [state, formAction] = useActionState(
    forgotPasswordAction,
    initialState,
  );

  return (
    <form className={styles.form} action={formAction} noValidate>
      <div className={styles.field}>
        <label htmlFor="reset-email">E-mailadres</label>
        <input
          id="reset-email"
          name="email"
          type="email"
          autoComplete="username"
          inputMode="email"
          required
          maxLength={320}
          suppressHydrationWarning
        />
      </div>

      {state.message ? (
        <p
          className={state.status === "success" ? styles.success : styles.error}
          role={state.status === "success" ? "status" : "alert"}
        >
          {state.message}
        </p>
      ) : null}

      <SubmitButton />

      <div className={styles.authLinks}>
        <Link className={styles.secondaryLink} href="/login">
          Terug naar inloggen
        </Link>
      </div>
    </form>
  );
}
