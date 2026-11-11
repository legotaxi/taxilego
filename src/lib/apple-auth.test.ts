import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { hasAppleIdentity } from "./apple-auth";

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