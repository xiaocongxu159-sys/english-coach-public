import assert from "node:assert/strict";
import test from "node:test";
import { getAppUrl } from "../src/lib/app-url.ts";

test("development without NEXT_PUBLIC_APP_URL falls back to localhost", () => {
  assert.equal(getAppUrl({ NODE_ENV: "development" }), "http://localhost:3000");
});

test("production requires NEXT_PUBLIC_APP_URL", () => {
  assert.throws(
    () => getAppUrl({ NODE_ENV: "production" }),
    /Missing NEXT_PUBLIC_APP_URL in production/,
  );
});

test("production requires https", () => {
  assert.throws(
    () =>
      getAppUrl({
        NODE_ENV: "production",
        NEXT_PUBLIC_APP_URL: "http://english-coach.example.com",
      }),
    /must use https in production/,
  );
});

test("production returns a normalized https origin", () => {
  assert.equal(
    getAppUrl({
      NODE_ENV: "production",
      NEXT_PUBLIC_APP_URL: "https://english-coach.example.com/",
    }),
    "https://english-coach.example.com",
  );
});

test("application URL rejects path, query, hash and non-http protocols", () => {
  assert.throws(
    () =>
      getAppUrl({
        NODE_ENV: "production",
        NEXT_PUBLIC_APP_URL: "https://english-coach.example.com/app",
      }),
    /application origin root/,
  );
  assert.throws(
    () =>
      getAppUrl({
        NODE_ENV: "production",
        NEXT_PUBLIC_APP_URL: "https://english-coach.example.com/?preview=1",
      }),
    /credentials, query, or hash/,
  );
  assert.throws(
    () =>
      getAppUrl({
        NODE_ENV: "production",
        NEXT_PUBLIC_APP_URL: "ftp://english-coach.example.com",
      }),
    /must use http or https/,
  );
});
