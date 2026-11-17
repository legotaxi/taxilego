import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { hasAppleIdentity, needsDriverRegistration, resolveAuthIntent } from "./apple-auth";

describe("hasAppleIdentity", () => {
  it("recognizes an Apple-linked account for the grant-disconnect step", () => {
    assert.equal(hasAppleIdentity({ providers: ["apple"] }), true);
    assert.equal(hasAppleIdentity({ provider: "apple" }), true);
  });

  it("does not request Apple grant disconnection for non-Apple accounts", () => {
    assert.equal(hasAppleIdentity({ providers: ["google"] }), false);
    assert.equal(hasAppleIdentity(null), false);
  });
});

describe("resolveAuthIntent", () => {
  it("preserves driver intent in the same-origin Apple callback", () => {
    assert.equal(resolveAuthIntent("driver", null), "driver");
    assert.equal(resolveAuthIntent(null, "driver"), "driver");
  });

  it("defaults unknown callback intent to the passenger app", () => {
    assert.equal(resolveAuthIntent("other", null), "passenger");
  });
});

describe("needsDriverRegistration", () => {
  it("keeps an incomplete pending Apple-created driver on the open registration form", () => {
    assert.equal(needsDriverRegistration({
      status: "pending",
      bi_url: null,
      license_url: null,
      criminal_record_url: null,
      photo_url: null,
    }), true);
  });

  it("sends a completed driver past registration", () => {
    assert.equal(needsDriverRegistration({
      status: "pending",
      bi_url: "bi.pdf",
      license_url: "license.pdf",
      criminal_record_url: "record.pdf",
      photo_url: "photo.jpg",
    }), false);
  });
});