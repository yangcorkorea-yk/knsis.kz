import { Channel } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { assertMvpChannel, isMvpChannel, send, UnsupportedChannelError } from "./send";

describe("messaging guard", () => {
  it("accepts inapp and email", () => {
    expect(isMvpChannel(Channel.inapp)).toBe(true);
    expect(isMvpChannel(Channel.email)).toBe(true);
    expect(() => assertMvpChannel(Channel.inapp)).not.toThrow();
    expect(() => assertMvpChannel(Channel.email)).not.toThrow();
  });

  it.each([Channel.wa, Channel.tg, Channel.sms])("rejects %s (reserved for M-POST)", (ch) => {
    expect(isMvpChannel(ch)).toBe(false);
    expect(() => assertMvpChannel(ch)).toThrow(UnsupportedChannelError);
  });

  it("send() rejects reserved channels before doing any work", async () => {
    await expect(
      send({ leadId: "00000000-0000-0000-0000-000000000000", channel: Channel.wa, body: "hi" }),
    ).rejects.toBeInstanceOf(UnsupportedChannelError);
  });
});
