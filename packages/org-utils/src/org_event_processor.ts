import { X509Certificate, createVerify } from "crypto";
import type { EnvInterface, Environment } from "@cubist-labs/cubesigner-sdk";
import { envs } from "@cubist-labs/cubesigner-sdk";

// URLs that are safe to retrieve certificates from
const SNS_CERTIFICATE_URL_HOSTS = ["sns.us-east-1.amazonaws.com"];

const SNS_CERTIFICATE_HOST = "sns.amazonaws.com";

/** The common fields of SNS messages */
export interface SnsMessage {
  Type: string;
  MessageId: string;
  TopicArn: string;
  Message: string;
  Timestamp: string;
  SignatureVersion: string;
  Signature: string;
  SigningCertURL: string;
}

/** The format of a subscription confirmation sent by SNS */
export interface SubscriptionConfirmationMessage extends SnsMessage {
  Token: string;
  SubscribeURL: string;
}

/** Common fields for an org event */
export interface OrgEventBase {
  org: string;
  utc_timestamp: number;
  org_event: string;
}

/** The format of an event message sent by SNS */
export interface OrgEventMessage extends SnsMessage {
  Subject?: string;
  UnsubscribeURL: string;
}

/** Options for the processor */
export interface OrgEventProcessorOptions {
  env: Environment | EnvInterface;
}

/** A utility for processing org event messages */
export class OrgEventProcessor {
  readonly #topicArn: string;
  readonly #orgId: string;
  #cachedCertificates: Map<URL, X509Certificate>;

  /**
   * Constructor.
   *
   * @param orgId The org id
   * @param options Additional options for the processor
   */
  constructor(orgId: string, options?: OrgEventProcessorOptions) {
    const env = options?.env ?? "prod";
    if (typeof env === "string") {
      this.#topicArn = envs[env].OrgEventsTopicArn;
    } else {
      this.#topicArn = env.OrgEventsTopicArn;
    }
    this.#orgId = orgId;
    this.#cachedCertificates = new Map();
  }

  /**
   * Checks an SNS message and its signature. Throws an error if the message
   * invalid or the signature is invalid.
   *
   * @param message The SNS message to check
   */
  async checkMessage(message: SnsMessage) {
    // Check the topic ARN
    if (message.TopicArn !== this.#topicArn) {
      throw new Error(`Expected topic ARN '${this.#topicArn}', found '${message.TopicArn}'`);
    }

    // Both subscription confirmations and org event messages should have no subject
    if ("Subject" in message) {
      throw new Error("Expected a message without a subject");
    }

    // The org events topic uses signature version 2 (SHA256)
    if (message.SignatureVersion !== "2") {
      throw new Error("Expected signature version 2");
    }

    // Retrieve the certificate and sanity check it
    const certificate = await this.#fetchAndValidateCertificate(new URL(message.SigningCertURL));

    // Extract fields specific to subscription confirmations
    const subscribeUrl = (message as SubscriptionConfirmationMessage).SubscribeURL;
    const token = (message as SubscriptionConfirmationMessage).Token;

    // Check the signature
    const fields = ["Message", message.Message, "MessageId", message.MessageId]
      .concat(subscribeUrl !== undefined ? ["SubscribeURL", subscribeUrl] : [])
      .concat(["Timestamp", message.Timestamp])
      .concat(token !== undefined ? ["Token", token] : [])
      .concat(["TopicArn", message.TopicArn, "Type", message.Type]);
    const verify = createVerify("RSA-SHA256");
    verify.update(fields.join("\n") + "\n");
    const isValid = verify.verify(certificate.publicKey, message.Signature, "base64");
    if (!isValid) {
      throw new Error("The org event has an invalid signature");
    }
  }

  /**
   * Parse an org event and check its signature. Throws an error if the
   * message is not a valid org event or the signature is invalid.
   *
   * @param message The org event message to check
   * @returns The org event
   */
  async parse(message: OrgEventMessage): Promise<OrgEventBase> {
    await this.checkMessage(message);

    // Check that the event is for the expected org
    const orgEvent: OrgEventBase = JSON.parse(message.Message);
    if (orgEvent.org !== this.#orgId) {
      throw new Error(`Expected org to be '${this.#orgId}', found '${orgEvent.org}'`);
    }

    return orgEvent;
  }

  /**
   * Fetches a certificate from a given URL or from the certificate cache.
   * Throws an error if the URL does not correspond to an SNS certificate URL.
   *
   * Note: Ideally, this method would verify the certificate chain, but there
   * is no obvious chain. Instead, this method only fetches certificates from
   * a small set of allowlisted URLs.
   *
   * @param url The URL of the certificate
   * @returns The certificate
   */
  async #fetchAndValidateCertificate(url: URL): Promise<X509Certificate> {
    const currTime = new Date().getTime();
    const cachedCertificate = this.#cachedCertificates.get(url);
    if (cachedCertificate && currTime < new Date(cachedCertificate.validTo).getTime()) {
      return cachedCertificate;
    }

    // Only fetch certificates from HTTPS URLs
    if (url.protocol !== "https:") {
      throw new Error("Expected signing certificate URL to use HTTPS");
    }

    // Only fetch certificate URLs for SNS
    if (SNS_CERTIFICATE_URL_HOSTS.indexOf(url.host) === -1) {
      throw new Error("Expected signing certificate URL for SNS in us-east-1");
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Unable to download certificate. Status: ${response.status}`);
    }
    const blob = await response.blob();
    const certificate = new X509Certificate(await blob.text());
    if (!certificate.checkHost(SNS_CERTIFICATE_HOST)) {
      throw new Error(`Expected certificate to be for '${SNS_CERTIFICATE_HOST}'`);
    }

    // Check validity times
    if (currTime < new Date(certificate.validFrom).getTime()) {
      throw new Error("Certificate not valid yet");
    }
    if (new Date(certificate.validTo).getTime() < currTime) {
      throw new Error("Certificate expired");
    }

    this.#cachedCertificates.set(url, certificate);
    return certificate;
  }
}
