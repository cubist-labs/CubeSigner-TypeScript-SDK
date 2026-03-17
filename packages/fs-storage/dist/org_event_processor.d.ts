import type { Environment } from "@cubist-labs/cubesigner-sdk";
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
    env: Environment;
}
/** A utility for processing org event messages */
export declare class OrgEventProcessor {
    #private;
    /**
     * Constructor.
     * @param {string} orgId The org id
     * @param {OrgEventProcessorOptions} options Additional options for the processor
     */
    constructor(orgId: string, options?: OrgEventProcessorOptions);
    /**
     * Checks an SNS message and its signature. Throws an error if the message
     * invalid or the signature is invalid.
     *
     * @param {SnsMessage} message The SNS message to check
     */
    checkMessage(message: SnsMessage): Promise<void>;
    /**
     * Parse an org event and check its signature. Throws an error if the
     * message is not a valid org event or the signature is invalid.
     *
     * @param {OrgEventMessage} message The org event message to check
     * @return {OrgEventBase} The org event
     */
    parse(message: OrgEventMessage): Promise<OrgEventBase>;
}
//# sourceMappingURL=org_event_processor.d.ts.map