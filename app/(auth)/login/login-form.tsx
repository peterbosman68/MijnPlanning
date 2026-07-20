"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import { loginAction, type LoginActionState } from "./actions";
import styles from "./login.module.css";

const initialState: LoginActionState = { message: "" };

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button className={styles.submit} type="submit" disabled={pending}>
      {pending ? "Bezig met inloggen…" : "Inloggen"}
    </button>
  );
}

export function LoginForm() {
  const [state, formAction] = useActionState(loginAction, initialState);
  const [passwordVisible, setPasswordVisible] = useState(false);

  return (
    <form className={styles.form} action={formAction} noValidate>
      <div className={styles.field}>
        <label htmlFor="email">E-mailadres</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          inputMode="email"
          required
          maxLength={320}
          suppressHydrationWarning
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="password">Wachtwoord</label>
        <div className={styles.passwordControl}>
          <input
            id="password"
            name="password"
            type={passwordVisible ? "text" : "password"}
            autoComplete="current-password"
            required
            maxLength={1024}
            suppressHydrationWarning
          />
          <button
            className={styles.passwordToggle}
            type="button"
            aria-label={passwordVisible ? "Wachtwoord verbergen" : "Wachtwoord tonen"}
            aria-pressed={passwordVisible}
            onClick={() => setPasswordVisible((visible) => !visible)}
          >
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
              <circle cx="12" cy="12" r="2.5" />
              {passwordVisible ? <path d="m4 4 16 16" /> : null}
            </svg>
          </button>
        </div>
      </div>

      {state.message ? (
        <p className={styles.error} role="alert">
          {state.message}
        </p>
      ) : null}

      <SubmitButton />

      <div className={styles.authLinks}>
        <Link className={styles.secondaryLink} href="/wachtwoord-vergeten">
          Wachtwoord vergeten?
        </Link>
      </div>
    </form>
  );
}
