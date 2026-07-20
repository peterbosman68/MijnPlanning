"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";

import styles from "../login/login.module.css";
import {
  resetPasswordAction,
  type ResetPasswordActionState,
} from "./actions";

const initialState: ResetPasswordActionState = {
  status: "idle",
  message: "",
};

type PasswordFieldProps = Readonly<{
  id: string;
  name: "newPassword" | "confirmPassword";
  label: string;
  autoComplete: "new-password";
}>;

function PasswordField({ id, name, label, autoComplete }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className={styles.field}>
      <label htmlFor={id}>{label}</label>
      <div className={styles.passwordControl}>
        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          required
          minLength={8}
          maxLength={1024}
          suppressHydrationWarning
        />
        <button
          className={styles.passwordToggle}
          type="button"
          aria-label={visible ? `${label} verbergen` : `${label} tonen`}
          aria-pressed={visible}
          onClick={() => setVisible((current) => !current)}
        >
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
            <circle cx="12" cy="12" r="2.5" />
            {visible ? <path d="m4 4 16 16" /> : null}
          </svg>
        </button>
      </div>
    </div>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button className={styles.submit} type="submit" disabled={pending}>
      {pending ? "Wachtwoord opslaan…" : "Nieuw wachtwoord opslaan"}
    </button>
  );
}

export function ResetPasswordForm({ token }: Readonly<{ token: string }>) {
  const [state, formAction] = useActionState(resetPasswordAction, initialState);

  useEffect(() => {
    if (token && window.location.search) {
      window.history.replaceState(null, "", "/wachtwoord-herstellen");
    }
  }, [token]);

  if (!token) {
    return (
      <div className={styles.form}>
        <p className={styles.error} role="alert">
          Deze herstellink is ongeldig of verlopen. Vraag een nieuwe link aan.
        </p>
        <div className={styles.authLinks}>
          <Link className={styles.secondaryLink} href="/wachtwoord-vergeten">
            Nieuwe herstellink aanvragen
          </Link>
        </div>
      </div>
    );
  }

  if (state.status === "success") {
    return (
      <div className={styles.form}>
        <p className={styles.success} role="status">
          {state.message}
        </p>
        <Link className={styles.submitLink} href="/login">
          Naar inloggen
        </Link>
      </div>
    );
  }

  return (
    <form className={styles.form} action={formAction} noValidate>
      <input type="hidden" name="token" value={token} />
      <PasswordField
        id="new-password"
        name="newPassword"
        label="Nieuw wachtwoord"
        autoComplete="new-password"
      />
      <PasswordField
        id="confirm-password"
        name="confirmPassword"
        label="Herhaal het wachtwoord"
        autoComplete="new-password"
      />
      <p className={styles.hint}>Gebruik minimaal 8 tekens.</p>

      {state.message ? (
        <p className={styles.error} role="alert">
          {state.message}
        </p>
      ) : null}

      <SubmitButton />

      <div className={styles.authLinks}>
        <Link className={styles.secondaryLink} href="/wachtwoord-vergeten">
          Nieuwe herstellink aanvragen
        </Link>
      </div>
    </form>
  );
}
