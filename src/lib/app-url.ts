type AppUrlEnv = {
  NEXT_PUBLIC_APP_URL?: string;
  NODE_ENV?: string;
};

export function getAppUrl(env: AppUrlEnv = process.env) {
  const configured = env.NEXT_PUBLIC_APP_URL?.trim();

  if (!configured) {
    if (env.NODE_ENV === "production") {
      throw new Error("Missing NEXT_PUBLIC_APP_URL in production");
    }
    return "http://localhost:3000";
  }

  let url: URL;
  try {
    url = new URL(configured);
  } catch {
    throw new Error("NEXT_PUBLIC_APP_URL must be an absolute http(s) URL");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("NEXT_PUBLIC_APP_URL must use http or https");
  }

  if (env.NODE_ENV === "production" && url.protocol !== "https:") {
    throw new Error("NEXT_PUBLIC_APP_URL must use https in production");
  }

  if (url.username || url.password || url.search || url.hash) {
    throw new Error("NEXT_PUBLIC_APP_URL must not include credentials, query, or hash");
  }

  if (url.pathname !== "/") {
    throw new Error("NEXT_PUBLIC_APP_URL must point to the application origin root");
  }

  return url.origin;
}
