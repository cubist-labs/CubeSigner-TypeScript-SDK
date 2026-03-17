import type { OrgEventMessage, SubscriptionConfirmationMessage } from "../src/org_event_processor";
import { OrgEventProcessor } from "../src/org_event_processor";
import ORG_EVENT_JSON from "../../../assets/org_event.json";
import SUBSCRIPTION_CONFIRMATION_JSON from "../../../assets/subscription_confirmation.json";
import { envs } from "@cubist-labs/cubesigner-sdk";

describe("Org event processor", () => {
  const orgId = "Org#3765d967-fec3-4aae-8e8e-34f07c3e59a4";
  const orgEvent: OrgEventMessage = ORG_EVENT_JSON;
  const subscriptionConfirmation: SubscriptionConfirmationMessage = SUBSCRIPTION_CONFIRMATION_JSON;
  const verifier = new OrgEventProcessor(orgId, {
    env: {
      ...envs.beta,
      OrgEventsTopicArn:
        "arn:aws:sns:us-east-1:053176135220:Sandbox-CubeSignerStack1234-OrgEventsTopic4416298A-7laxbPjh4XNV",
    },
  });

  it("parse valid event", async () => {
    const event = await verifier.parse(orgEvent);
    expect(event.org_event).toEqual("KeyCreated");
  });

  it("parse event from wrong topic ARN", async () => {
    const wrongVerifier = new OrgEventProcessor(orgId);
    await expect(wrongVerifier.parse(orgEvent)).rejects.toThrow();
  });

  it("parse event with subject", async () => {
    const invalidOrgEvent: OrgEventMessage = { ...orgEvent, Subject: "Extended Vehicle Warranty" };
    await expect(verifier.parse(invalidOrgEvent)).rejects.toThrow();
  });

  it("parse event with wrong signature version", async () => {
    const invalidOrgEvent: OrgEventMessage = { ...orgEvent, SignatureVersion: "1" };
    await expect(verifier.parse(invalidOrgEvent)).rejects.toThrow();
  });

  it("parse event from wrong org", async () => {
    const wrongVerifier = new OrgEventProcessor("Org#06aadcc8-1669-4cb5-a129-a293de388b71", {
      env: "beta",
    });
    await expect(wrongVerifier.parse(orgEvent)).rejects.toThrow();
  });

  it("parse event with wrong signature", async () => {
    const invalidSignature = "A" + orgEvent.Signature.substring(1);
    const invalidOrgEvent: OrgEventMessage = { ...orgEvent, Signature: invalidSignature };
    await expect(verifier.parse(invalidOrgEvent)).rejects.toThrow();
  });

  it("parse event with invalid cert URL protocol", async () => {
    const invalidOrgEvent: OrgEventMessage = {
      ...orgEvent,
      SigningCertURL:
        "http://sns.us-east-1.amazonaws.com/SimpleNotificationService-60eadc530605d63b8e62a523676ef735.pem",
    };
    await expect(verifier.parse(invalidOrgEvent)).rejects.toThrow();
  });

  it("parse event with invalid cert URL", async () => {
    const invalidOrgEvent: OrgEventMessage = {
      ...orgEvent,
      SigningCertURL:
        "https://sns.us-east-2.amazonaws.com/SimpleNotificationService-60eadc530605d63b8e62a523676ef735.pem",
    };
    await expect(verifier.parse(invalidOrgEvent)).rejects.toThrow();
  });

  it("check valid subscription confirmation", async () => {
    await verifier.checkMessage(subscriptionConfirmation);
  });

  it("check invalid message", async () => {
    const invalidMessage: SubscriptionConfirmationMessage = {
      ...subscriptionConfirmation,
      SigningCertURL: "invalid",
    };
    await expect(verifier.checkMessage(invalidMessage)).rejects.toThrow();
  });
});
