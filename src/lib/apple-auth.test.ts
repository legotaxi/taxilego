import { describe, expect, it } from "vitest";
import { hasAppleIdentity, needsDriverRegistration, resolveAuthIntent } from "./apple-auth";

describe("hasAppleIdentity", () => {
  it("recognizes an Apple-linked account for the grant-disconnect step", () => {
    expect(hasAppleIdentity({ providers: ["apple"] })).toBe(true);
    expect(hasAppleIdentity({ provider: "apple" })).toBe(true);
  });

  it("does not request Apple grant disconnection for non-Apple accounts", () => {
    expect(hasAppleIdentity({ providers: ["google"] })).toBe(false);
    expect(hasAppleIdentity(null)).toBe(false);
  });
});

describe("resolveAuthIntent", () => {
  it("preserves driver intent in the same-origin Apple callback", () => {
    expect(resolveAuthIntent("driver", null)).toBe("driver");
    expect(resolveAuthIntent(null, "driver")).toBe("driver");
  });

  it("defaults unknown callback intent to the passenger app", () => {
    expect(resolveAuthIntent("other", null)).toBe("passenger");
  });
});

describe("needsDriverRegistration", () => {
  it("keeps an incomplete pending Apple-created driver on the open registration form", () => {
    expect(needsDriverRegistration({
      status: "pending",
      bi_url: null,
      license_url: null,
      criminal_record_url: null,
      photo_url: null,
    })).toBe(true);
  });

  it("sends a completed driver past registration", () => {
    expect(needsDriverRegistration({
      status: "pending",
      bi_url: "bi.pdf",
      license_url: "license.pdf",
      criminal_record_url: "record.pdf",
      photo_url: "photo.jpg",
    })).toBe(false);
  });
});