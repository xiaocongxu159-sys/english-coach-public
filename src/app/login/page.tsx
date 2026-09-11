import Link from "next/link";
import { login } from "./actions";
import styles from "./login.module.css";
import { LoginSubmitButton } from "./submit-button";

type LoginPageProps = {
  searchParams: Promise<{ error?: string; message?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const needsConfirmation = params.error?.toLowerCase().includes("email not confirmed") ?? false;

  return (
    <main className={styles.shell}>
      <section className={styles.card} aria-labelledby="auth-title">
        <p className={styles.brand}>English Coach</p>
        <h1 id="auth-title" className={styles.title}>
          Welcome back
        </h1>
        <p className={styles.copy}>Continue learning English.</p>

        {params.error ? <p className={styles.error}>{params.error}</p> : null}
        {needsConfirmation ? (
          <Link className={styles.inlineLink} href="/signup?resend=1">
            Resend confirmation email
          </Link>
        ) : null}
        {params.message ? <p className={styles.message}>{params.message}</p> : null}

        <form className={styles.form} action={login}>
          <label className={styles.field}>
            Email
            <input name="email" type="email" autoComplete="email" required />
          </label>
          <label className={styles.field}>
            Password
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              minLength={8}
              required
            />
          </label>
          <LoginSubmitButton />
        </form>

        <div className={styles.divider}>New to English Coach?</div>
        <Link className={styles.secondaryLink} href="/signup">
          Create an account
        </Link>
      </section>
    </main>
  );
}
