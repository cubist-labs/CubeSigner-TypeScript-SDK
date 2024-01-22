import { expect } from "chai";
import { messageMatchesSessionExpired } from "../src/events";

describe("SessionExpiredMessages", () => {
  it("session expired regexes", async () => {
    [
      "Auth token for epoch 1 has expired",
      "Refresh token for epoch 123 has expired",
      "Outdated session",
      "Session 'some purpose' for 'User#123' has been revoked",
      "Session 'some other purpose' for 'Role#234' has expired",
    ].forEach((m) => {
      expect(messageMatchesSessionExpired(m)).to.be.true;
    });
  });
});
