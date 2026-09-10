import assert from "node:assert/strict";
import test from "node:test";
import manifest from "../src/app/manifest.ts";

test("Phase 1 web app manifest exposes a stable standalone root identity", () => {
  const value = manifest();

  assert.equal(value.id, "/");
  assert.equal(value.start_url, "/");
  assert.equal(value.scope, "/");
  assert.equal(value.display, "standalone");
  assert.equal(value.orientation, "portrait-primary");
});

test("manifest icon remains usable by iPhone Home Screen web apps", () => {
  const value = manifest();
  const icon = value.icons?.find((candidate) => candidate.src === "/icon.svg");

  assert.ok(icon);
  assert.equal(icon.type, "image/svg+xml");
  assert.equal(icon.sizes, "any");
  assert.equal(icon.purpose, "any");
});
