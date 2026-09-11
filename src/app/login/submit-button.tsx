"use client";

import { useFormStatus } from "react-dom";
import styles from "./login.module.css";

export function LoginSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      className={styles.primaryButton}
      disabled={pending}
      aria-disabled={pending}
    >
      {pending ? "Signing in…" : "Sign in"}
    </button>
  );
}
