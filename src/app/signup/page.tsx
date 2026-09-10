import Link from "next/link";
import { resendSignupConfirmation, signup } from "../login/actions";
import styles from "../login/login.module.css";

type SignupPageProps = {
  searchParams: Promise<{ error?: string; message?: string; resend?: string }>;
};

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const params = await searchParams;
  const isResend = params.resend === "1";

  return (
    <main className={styles.shell}>
      <section className={styles.card} aria-labelledby="signup-title">
        <p className={styles.brand}>English Coach</p>
        <h1 id="signup-title" className={styles.title}>
          {isResend ? "Confirm your email" : "Create your account"}
        </h1>
        <p className={styles.copy}>
          {isResend ? "Send a fresh confirmation link." : "Start learning English."}
        </p>

        {params.error ? <p className={styles.error}>{params.error}</p> : null}
        {params.message ? <p className={styles.message}>{params.message}</p> : null}

        {isResend ? (
          <form className={styles.form}>
            <label className={styles.field}>
              Email
              <input name="email" type="email" autoComplete="email" required />
            </label>
            <button
              type="submit"
              className={styles.primaryButton}
              formAction={resendSignupConfirmation}
            >
              Send confirmation email
            </button>
          </form>
        ) : (
          <form className={styles.form}>
            <label className={styles.field}>
              Display name <span>Used on your learning profile</span>
              <input name="displayName" autoComplete="name" required />
            </label>
            <label className={styles.field}>
              Email
              <input name="email" type="email" autoComplete="email" required />
            </label>
            <label className={styles.field}>
              Password <span>At least 8 characters</span>
              <input
                name="password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
              />
            </label>
            <button type="submit" className={styles.primaryButton} formAction={signup}>
              Create account
            </button>
          </form>
        )}

        <div className={styles.divider}>
          {isResend ? "Already confirmed?" : "Already have an account?"}
        </div>
        <Link className={styles.secondaryLink} href="/login">
          Sign in
        </Link>
      </section>
    </main>
  );
}
