import Link from "next/link";
import styles from "./verify-email.module.css";

type VerifyEmailPageProps = {
  searchParams: Promise<{ status?: string; message?: string }>;
};

export default async function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  const params = await searchParams;
  const success = params.status === "success";
  const message = success
    ? "Your email address has been confirmed successfully."
    : params.message || "The verification link could not be completed.";

  return (
    <main className={styles.shell}>
      <section className={styles.card} aria-labelledby="verify-title">
        <p className={styles.brand}>English Coach</p>
        <div className={success ? styles.successIcon : styles.errorIcon} aria-hidden="true">
          {success ? "✓" : "!"}
        </div>
        <h1 id="verify-title" className={styles.title}>
          {success ? "Email verified" : "Verification failed"}
        </h1>
        <p className={styles.copy}>{message}</p>

        {success ? (
          <>
            <p className={styles.notice}>Your account is ready. Sign in to continue learning.</p>
            <Link className={styles.primaryLink} href="/login?message=Email%20confirmed.%20Please%20sign%20in.">
              Continue to sign in
            </Link>
          </>
        ) : (
          <>
            <p className={styles.errorNotice}>Please request a new confirmation email and open the newest link.</p>
            <Link className={styles.primaryLink} href="/signup?resend=1">
              Resend confirmation email
            </Link>
            <Link className={styles.secondaryLink} href="/login">
              Back to sign in
            </Link>
          </>
        )}
      </section>
    </main>
  );
}
