"use strict";
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _OrgEventProcessor_instances, _OrgEventProcessor_topicArn, _OrgEventProcessor_orgId, _OrgEventProcessor_cachedCertificates, _OrgEventProcessor_fetchAndValidateCertificate;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrgEventProcessor = void 0;
const crypto_1 = require("crypto");
const _1 = require(".");
// URLs that are safe to retrieve certificates from
const SNS_CERTIFICATE_URL_HOSTS = ["sns.us-east-1.amazonaws.com"];
const SNS_CERTIFICATE_HOST = "sns.amazonaws.com";
/** A utility for processing org event messages */
class OrgEventProcessor {
    /**
     * Constructor.
     * @param {string} orgId The org id
     * @param {OrgEventProcessorOptions} options Additional options for the processor
     */
    constructor(orgId, options) {
        _OrgEventProcessor_instances.add(this);
        _OrgEventProcessor_topicArn.set(this, void 0);
        _OrgEventProcessor_orgId.set(this, void 0);
        _OrgEventProcessor_cachedCertificates.set(this, void 0);
        __classPrivateFieldSet(this, _OrgEventProcessor_topicArn, _1.envs[options?.env ?? "prod"].OrgEventsTopicArn, "f");
        __classPrivateFieldSet(this, _OrgEventProcessor_orgId, orgId, "f");
        __classPrivateFieldSet(this, _OrgEventProcessor_cachedCertificates, new Map(), "f");
    }
    /**
     * Checks an SNS message and its signature. Throws an error if the message
     * invalid or the signature is invalid.
     *
     * @param {SnsMessage} message The SNS message to check
     */
    async checkMessage(message) {
        // Check the topic ARN
        if (message.TopicArn !== __classPrivateFieldGet(this, _OrgEventProcessor_topicArn, "f")) {
            throw new Error(`Expected topic ARN '${__classPrivateFieldGet(this, _OrgEventProcessor_topicArn, "f")}', found '${message.TopicArn}'`);
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
        const certificate = await __classPrivateFieldGet(this, _OrgEventProcessor_instances, "m", _OrgEventProcessor_fetchAndValidateCertificate).call(this, new URL(message.SigningCertURL));
        // Extract fields specific to subscription confirmations
        const subscribeUrl = message.SubscribeURL;
        const token = message.Token;
        // Check the signature
        const fields = ["Message", message.Message, "MessageId", message.MessageId]
            .concat(subscribeUrl !== undefined ? ["SubscribeURL", subscribeUrl] : [])
            .concat(["Timestamp", message.Timestamp])
            .concat(token !== undefined ? ["Token", token] : [])
            .concat(["TopicArn", message.TopicArn, "Type", message.Type]);
        const verify = (0, crypto_1.createVerify)("RSA-SHA256");
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
     * @param {OrgEventMessage} message The org event message to check
     * @return {OrgEventBase} The org event
     */
    async parse(message) {
        await this.checkMessage(message);
        // Check that the event is for the expected org
        const orgEvent = JSON.parse(message.Message);
        if (orgEvent.org !== __classPrivateFieldGet(this, _OrgEventProcessor_orgId, "f")) {
            throw new Error(`Expected org to be '${__classPrivateFieldGet(this, _OrgEventProcessor_orgId, "f")}', found '${orgEvent.org}'`);
        }
        return orgEvent;
    }
}
exports.OrgEventProcessor = OrgEventProcessor;
_OrgEventProcessor_topicArn = new WeakMap(), _OrgEventProcessor_orgId = new WeakMap(), _OrgEventProcessor_cachedCertificates = new WeakMap(), _OrgEventProcessor_instances = new WeakSet(), _OrgEventProcessor_fetchAndValidateCertificate = 
/**
 * Fetches a certificate from a given URL or from the certificate cache.
 * Throws an error if the URL does not correspond to an SNS certificate URL.
 *
 * Note: Ideally, this method would verify the certificate chain, but there
 * is no obvious chain. Instead, this method only fetches certificates from
 * a small set of allowlisted URLs.
 *
 * @param {URL} url The URL of the certificate
 * @return {X509Certificate} The certificate
 */
async function _OrgEventProcessor_fetchAndValidateCertificate(url) {
    const currTime = new Date().getTime();
    const cachedCertificate = __classPrivateFieldGet(this, _OrgEventProcessor_cachedCertificates, "f").get(url);
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
    const certificate = new crypto_1.X509Certificate(await blob.text());
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
    __classPrivateFieldGet(this, _OrgEventProcessor_cachedCertificates, "f").set(url, certificate);
    return certificate;
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3JnX2V2ZW50X3Byb2Nlc3Nvci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9vcmdfZXZlbnRfcHJvY2Vzc29yLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7OztBQUFBLG1DQUF1RDtBQUN2RCx3QkFBc0M7QUFFdEMsbURBQW1EO0FBQ25ELE1BQU0seUJBQXlCLEdBQUcsQ0FBQyw2QkFBNkIsQ0FBQyxDQUFDO0FBRWxFLE1BQU0sb0JBQW9CLEdBQUcsbUJBQW1CLENBQUM7QUFzQ2pELGtEQUFrRDtBQUNsRCxNQUFhLGlCQUFpQjtJQUs1Qjs7OztPQUlHO0lBQ0gsWUFBWSxLQUFhLEVBQUUsT0FBa0M7O1FBVHBELDhDQUFrQjtRQUNsQiwyQ0FBZTtRQUN4Qix3REFBK0M7UUFRN0MsdUJBQUEsSUFBSSwrQkFBYSxPQUFJLENBQUMsT0FBTyxFQUFFLEdBQUcsSUFBSSxNQUFNLENBQUMsQ0FBQyxpQkFBaUIsTUFBQSxDQUFDO1FBQ2hFLHVCQUFBLElBQUksNEJBQVUsS0FBSyxNQUFBLENBQUM7UUFDcEIsdUJBQUEsSUFBSSx5Q0FBdUIsSUFBSSxHQUFHLEVBQUUsTUFBQSxDQUFDO0lBQ3ZDLENBQUM7SUFFRDs7Ozs7T0FLRztJQUNILEtBQUssQ0FBQyxZQUFZLENBQUMsT0FBbUI7UUFDcEMsc0JBQXNCO1FBQ3RCLElBQUksT0FBTyxDQUFDLFFBQVEsS0FBSyx1QkFBQSxJQUFJLG1DQUFVLEVBQUUsQ0FBQztZQUN4QyxNQUFNLElBQUksS0FBSyxDQUFDLHVCQUF1Qix1QkFBQSxJQUFJLG1DQUFVLGFBQWEsT0FBTyxDQUFDLFFBQVEsR0FBRyxDQUFDLENBQUM7UUFDekYsQ0FBQztRQUVELGdGQUFnRjtRQUNoRixJQUFJLFNBQVMsSUFBSSxPQUFPLEVBQUUsQ0FBQztZQUN6QixNQUFNLElBQUksS0FBSyxDQUFDLHNDQUFzQyxDQUFDLENBQUM7UUFDMUQsQ0FBQztRQUVELHlEQUF5RDtRQUN6RCxJQUFJLE9B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Q0FBb0IsQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLFdBQVcsQ0FBQyxDQUFDO0lBQy9DLE9BQU8sV0FBVyxDQUFDO0FBQ3JCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBYNTA5Q2VydGlmaWNhdGUsIGNyZWF0ZVZlcmlmeSB9IGZyb20gXCJjcnlwdG9cIjtcbmltcG9ydCB7IEVudmlyb25tZW50LCBlbnZzIH0gZnJvbSBcIi5cIjtcblxuLy8gVVJMcyB0aGF0IGFyZSBzYWZlIHRvIHJldHJpZXZlIGNlcnRpZmljYXRlcyBmcm9tXG5jb25zdCBTTlNfQ0VSVElGSUNBVEVfVVJMX0hPU1RTID0gW1wic25zLnVzLWVhc3QtMS5hbWF6b25hd3MuY29tXCJdO1xuXG5jb25zdCBTTlNfQ0VSVElGSUNBVEVfSE9TVCA9IFwic25zLmFtYXpvbmF3cy5jb21cIjtcblxuLyoqIFRoZSBjb21tb24gZmllbGRzIG9mIFNOUyBtZXNzYWdlcyAqL1xuZXhwb3J0IGludGVyZmFjZSBTbnNNZXNzYWdlIHtcbiAgVHlwZTogc3RyaW5nO1xuICBNZXNzYWdlSWQ6IHN0cmluZztcbiAgVG9waWNBcm46IHN0cmluZztcbiAgTWVzc2FnZTogc3RyaW5nO1xuICBUaW1lc3RhbXA6IHN0cmluZztcbiAgU2lnbmF0dXJlVmVyc2lvbjogc3RyaW5nO1xuICBTaWduYXR1cmU6IHN0cmluZztcbiAgU2lnbmluZ0NlcnRVUkw6IHN0cmluZztcbn1cblxuLyoqIFRoZSBmb3JtYXQgb2YgYSBzdWJzY3JpcHRpb24gY29uZmlybWF0aW9uIHNlbnQgYnkgU05TICovXG5leHBvcnQgaW50ZXJmYWNlIFN1YnNjcmlwdGlvbkNvbmZpcm1hdGlvbk1lc3NhZ2UgZXh0ZW5kcyBTbnNNZXNzYWdlIHtcbiAgVG9rZW46IHN0cmluZztcbiAgU3Vic2NyaWJlVVJMOiBzdHJpbmc7XG59XG5cbi8qKiBDb21tb24gZmllbGRzIGZvciBhbiBvcmcgZXZlbnQgKi9cbmV4cG9ydCBpbnRlcmZhY2UgT3JnRXZlbnRCYXNlIHtcbiAgb3JnOiBzdHJpbmc7XG4gIHV0Y190aW1lc3RhbXA6IG51bWJlcjtcbiAgb3JnX2V2ZW50OiBzdHJpbmc7XG59XG5cbi8qKiBUaGUgZm9ybWF0IG9mIGFuIGV2ZW50IG1lc3NhZ2Ugc2VudCBieSBTTlMgKi9cbmV4cG9ydCBpbnRlcmZhY2UgT3JnRXZlbnRNZXNzYWdlIGV4dGVuZHMgU25zTWVzc2FnZSB7XG4gIFN1YmplY3Q/OiBzdHJpbmc7XG4gIFVuc3Vic2NyaWJlVVJMOiBzdHJpbmc7XG59XG5cbi8qKiBPcHRpb25zIGZvciB0aGUgcHJvY2Vzc29yICovXG5leHBvcnQgaW50ZXJmYWNlIE9yZ0V2ZW50UHJvY2Vzc29yT3B0aW9ucyB7XG4gIGVudjogRW52aXJvbm1lbnQ7XG59XG5cbi8qKiBBIHV0aWxpdHkgZm9yIHByb2Nlc3Npbmcgb3JnIGV2ZW50IG1lc3NhZ2VzICovXG5leHBvcnQgY2xhc3MgT3JnRXZlbnRQcm9jZXNzb3Ige1xuICByZWFkb25seSAjdG9waWNBcm46IHN0cmluZztcbiAgcmVhZG9ubHkgI29yZ0lkOiBzdHJpbmc7XG4gICNjYWNoZWRDZXJ0aWZpY2F0ZXM6IE1hcDxVUkwsIFg1MDlDZXJ0aWZpY2F0ZT47XG5cbiAgLyoqXG4gICAqIENvbnN0cnVjdG9yLlxuICAgKiBAcGFyYW0ge3N0cmluZ30gb3JnSWQgVGhlIG9yZyBpZFxuICAgKiBAcGFyYW0ge09yZ0V2ZW50UHJvY2Vzc29yT3B0aW9uc30gb3B0aW9ucyBBZGRpdGlvbmFsIG9wdGlvbnMgZm9yIHRoZSBwcm9jZXNzb3JcbiAgICovXG4gIGNvbnN0cnVjdG9yKG9yZ0lkOiBzdHJpbmcsIG9wdGlvbnM/OiBPcmdFdmVudFByb2Nlc3Nvck9wdGlvbnMpIHtcbiAgICB0aGlzLiN0b3BpY0FybiA9IGVudnNbb3B0aW9ucz8uZW52ID8/IFwicHJvZFwiXS5PcmdFdmVudHNUb3BpY0FybjtcbiAgICB0aGlzLiNvcmdJZCA9IG9yZ0lkO1xuICAgIHRoaXMuI2NhY2hlZENlcnRpZmljYXRlcyA9IG5ldyBNYXAoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVja3MgYW4gU05TIG1lc3NhZ2UgYW5kIGl0cyBzaWduYXR1cmUuIFRocm93cyBhbiBlcnJvciBpZiB0aGUgbWVzc2FnZVxuICAgKiBpbnZhbGlkIG9yIHRoZSBzaWduYXR1cmUgaXMgaW52YWxpZC5cbiAgICpcbiAgICogQHBhcmFtIHtTbnNNZXNzYWdlfSBtZXNzYWdlIFRoZSBTTlMgbWVzc2FnZSB0byBjaGVja1xuICAgKi9cbiAgYXN5bmMgY2hlY2tNZXNzYWdlKG1lc3NhZ2U6IFNuc01lc3NhZ2UpIHtcbiAgICAvLyBDaGVjayB0aGUgdG9waWMgQVJOXG4gICAgaWYgKG1lc3NhZ2UuVG9waWNBcm4gIT09IHRoaXMuI3RvcGljQXJuKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYEV4cGVjdGVkIHRvcGljIEFSTiAnJHt0aGlzLiN0b3BpY0Fybn0nLCBmb3VuZCAnJHttZXNzYWdlLlRvcGljQXJufSdgKTtcbiAgICB9XG5cbiAgICAvLyBCb3RoIHN1YnNjcmlwdGlvbiBjb25maXJtYXRpb25zIGFuZCBvcmcgZXZlbnQgbWVzc2FnZXMgc2hvdWxkIGhhdmUgbm8gc3ViamVjdFxuICAgIGlmIChcIlN1YmplY3RcIiBpbiBtZXNzYWdlKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJFeHBlY3RlZCBhIG1lc3NhZ2Ugd2l0aG91dCBhIHN1YmplY3RcIik7XG4gICAgfVxuXG4gICAgLy8gVGhlIG9yZyBldmVudHMgdG9waWMgdXNlcyBzaWduYXR1cmUgdmVyc2lvbiAyIChTSEEyNTYpXG4gICAgaWYgKG1lc3NhZ2UuU2lnbmF0dXJlVmVyc2lvbiAhPT0gXCIyXCIpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkV4cGVjdGVkIHNpZ25hdHVyZSB2ZXJzaW9uIDJcIik7XG4gICAgfVxuXG4gICAgLy8gUmV0cmlldmUgdGhlIGNlcnRpZmljYXRlIGFuZCBzYW5pdHkgY2hlY2sgaXRcbiAgICBjb25zdCBjZXJ0aWZpY2F0ZSA9IGF3YWl0IHRoaXMuI2ZldGNoQW5kVmFsaWRhdGVDZXJ0aWZpY2F0ZShuZXcgVVJMKG1lc3NhZ2UuU2lnbmluZ0NlcnRVUkwpKTtcblxuICAgIC8vIEV4dHJhY3QgZmllbGRzIHNwZWNpZmljIHRvIHN1YnNjcmlwdGlvbiBjb25maXJtYXRpb25zXG4gICAgY29uc3Qgc3Vic2NyaWJlVXJsID0gKG1lc3NhZ2UgYXMgU3Vic2NyaXB0aW9uQ29uZmlybWF0aW9uTWVzc2FnZSkuU3Vic2NyaWJlVVJMO1xuICAgIGNvbnN0IHRva2VuID0gKG1lc3NhZ2UgYXMgU3Vic2NyaXB0aW9uQ29uZmlybWF0aW9uTWVzc2FnZSkuVG9rZW47XG5cbiAgICAvLyBDaGVjayB0aGUgc2lnbmF0dXJlXG4gICAgY29uc3QgZmllbGRzID0gW1wiTWVzc2FnZVwiLCBtZXNzYWdlLk1lc3NhZ2UsIFwiTWVzc2FnZUlkXCIsIG1lc3NhZ2UuTWVzc2FnZUlkXVxuICAgICAgLmNvbmNhdChzdWJzY3JpYmVVcmwgIT09IHVuZGVmaW5lZCA/IFtcIlN1YnNjcmliZVVSTFwiLCBzdWJzY3JpYmVVcmxdIDogW10pXG4gICAgICAuY29uY2F0KFtcIlRpbWVzdGFtcFwiLCBtZXNzYWdlLlRpbWVzdGFtcF0pXG4gICAgICAuY29uY2F0KHRva2VuICE9PSB1bmRlZmluZWQgPyBbXCJUb2tlblwiLCB0b2tlbl0gOiBbXSlcbiAgICAgIC5jb25jYXQoW1wiVG9waWNBcm5cIiwgbWVzc2FnZS5Ub3BpY0FybiwgXCJUeXBlXCIsIG1lc3NhZ2UuVHlwZV0pO1xuICAgIGNvbnN0IHZlcmlmeSA9IGNyZWF0ZVZlcmlmeShcIlJTQS1TSEEyNTZcIik7XG4gICAgdmVyaWZ5LnVwZGF0ZShmaWVsZHMuam9pbihcIlxcblwiKSArIFwiXFxuXCIpO1xuICAgIGNvbnN0IGlzVmFsaWQgPSB2ZXJpZnkudmVyaWZ5KGNlcnRpZmljYXRlLnB1YmxpY0tleSwgbWVzc2FnZS5TaWduYXR1cmUsIFwiYmFzZTY0XCIpO1xuICAgIGlmICghaXNWYWxpZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVGhlIG9yZyBldmVudCBoYXMgYW4gaW52YWxpZCBzaWduYXR1cmVcIik7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFBhcnNlIGFuIG9yZyBldmVudCBhbmQgY2hlY2sgaXRzIHNpZ25hdHVyZS4gVGhyb3dzIGFuIGVycm9yIGlmIHRoZVxuICAgKiBtZXNzYWdlIGlzIG5vdCBhIHZhbGlkIG9yZyBldmVudCBvciB0aGUgc2lnbmF0dXJlIGlzIGludmFsaWQuXG4gICAqXG4gICAqIEBwYXJhbSB7T3JnRXZlbnRNZXNzYWdlfSBtZXNzYWdlIFRoZSBvcmcgZXZlbnQgbWVzc2FnZSB0byBjaGVja1xuICAgKiBAcmV0dXJuIHtPcmdFdmVudEJhc2V9IFRoZSBvcmcgZXZlbnRcbiAgICovXG4gIGFzeW5jIHBhcnNlKG1lc3NhZ2U6IE9yZ0V2ZW50TWVzc2FnZSk6IFByb21pc2U8T3JnRXZlbnRCYXNlPiB7XG4gICAgYXdhaXQgdGhpcy5jaGVja01lc3NhZ2UobWVzc2FnZSk7XG5cbiAgICAvLyBDaGVjayB0aGF0IHRoZSBldmVudCBpcyBmb3IgdGhlIGV4cGVjdGVkIG9yZ1xuICAgIGNvbnN0IG9yZ0V2ZW50OiBPcmdFdmVudEJhc2UgPSBKU09OLnBhcnNlKG1lc3NhZ2UuTWVzc2FnZSk7XG4gICAgaWYgKG9yZ0V2ZW50Lm9yZyAhPT0gdGhpcy4jb3JnSWQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgRXhwZWN0ZWQgb3JnIHRvIGJlICcke3RoaXMuI29yZ0lkfScsIGZvdW5kICcke29yZ0V2ZW50Lm9yZ30nYCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG9yZ0V2ZW50O1xuICB9XG5cbiAgLyoqXG4gICAqIEZldGNoZXMgYSBjZXJ0aWZpY2F0ZSBmcm9tIGEgZ2l2ZW4gVVJMIG9yIGZyb20gdGhlIGNlcnRpZmljYXRlIGNhY2hlLlxuICAgKiBUaHJvd3MgYW4gZXJyb3IgaWYgdGhlIFVSTCBkb2VzIG5vdCBjb3JyZXNwb25kIHRvIGFuIFNOUyBjZXJ0aWZpY2F0ZSBVUkwuXG4gICAqXG4gICAqIE5vdGU6IElkZWFsbHksIHRoaXMgbWV0aG9kIHdvdWxkIHZlcmlmeSB0aGUgY2VydGlmaWNhdGUgY2hhaW4sIGJ1dCB0aGVyZVxuICAgKiBpcyBubyBvYnZpb3VzIGNoYWluLiBJbnN0ZWFkLCB0aGlzIG1ldGhvZCBvbmx5IGZldGNoZXMgY2VydGlmaWNhdGVzIGZyb21cbiAgICogYSBzbWFsbCBzZXQgb2YgYWxsb3dsaXN0ZWQgVVJMcy5cbiAgICpcbiAgICogQHBhcmFtIHtVUkx9IHVybCBUaGUgVVJMIG9mIHRoZSBjZXJ0aWZpY2F0ZVxuICAgKiBAcmV0dXJuIHtYNTA5Q2VydGlmaWNhdGV9IFRoZSBjZXJ0aWZpY2F0ZVxuICAgKi9cbiAgYXN5bmMgI2ZldGNoQW5kVmFsaWRhdGVDZXJ0aWZpY2F0ZSh1cmw6IFVSTCk6IFByb21pc2U8WDUwOUNlcnRpZmljYXRlPiB7XG4gICAgY29uc3QgY3VyclRpbWUgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgICBjb25zdCBjYWNoZWRDZXJ0aWZpY2F0ZSA9IHRoaXMuI2NhY2hlZENlcnRpZmljYXRlcy5nZXQodXJsKTtcbiAgICBpZiAoY2FjaGVkQ2VydGlmaWNhdGUgJiYgY3VyclRpbWUgPCBuZXcgRGF0ZShjYWNoZWRDZXJ0aWZpY2F0ZS52YWxpZFRvKS5nZXRUaW1lKCkpIHtcbiAgICAgIHJldHVybiBjYWNoZWRDZXJ0aWZpY2F0ZTtcbiAgICB9XG5cbiAgICAvLyBPbmx5IGZldGNoIGNlcnRpZmljYXRlcyBmcm9tIEhUVFBTIFVSTHNcbiAgICBpZiAodXJsLnByb3RvY29sICE9PSBcImh0dHBzOlwiKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJFeHBlY3RlZCBzaWduaW5nIGNlcnRpZmljYXRlIFVSTCB0byB1c2UgSFRUUFNcIik7XG4gICAgfVxuXG4gICAgLy8gT25seSBmZXRjaCBjZXJ0aWZpY2F0ZSBVUkxzIGZvciBTTlNcbiAgICBpZiAoU05TX0NFUlRJRklDQVRFX1VSTF9IT1NUUy5pbmRleE9mKHVybC5ob3N0KSA9PT0gLTEpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkV4cGVjdGVkIHNpZ25pbmcgY2VydGlmaWNhdGUgVVJMIGZvciBTTlMgaW4gdXMtZWFzdC0xXCIpO1xuICAgIH1cblxuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2godXJsKTtcbiAgICBpZiAoIXJlc3BvbnNlLm9rKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYFVuYWJsZSB0byBkb3dubG9hZCBjZXJ0aWZpY2F0ZS4gU3RhdHVzOiAke3Jlc3BvbnNlLnN0YXR1c31gKTtcbiAgICB9XG4gICAgY29uc3QgYmxvYiA9IGF3YWl0IHJlc3BvbnNlLmJsb2IoKTtcbiAgICBjb25zdCBjZXJ0aWZpY2F0ZSA9IG5ldyBYNTA5Q2VydGlmaWNhdGUoYXdhaXQgYmxvYi50ZXh0KCkpO1xuICAgIGlmICghY2VydGlmaWNhdGUuY2hlY2tIb3N0KFNOU19DRVJUSUZJQ0FURV9IT1NUKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBFeHBlY3RlZCBjZXJ0aWZpY2F0ZSB0byBiZSBmb3IgJyR7U05TX0NFUlRJRklDQVRFX0hPU1R9J2ApO1xuICAgIH1cblxuICAgIC8vIENoZWNrIHZhbGlkaXR5IHRpbWVzXG4gICAgaWYgKGN1cnJUaW1lIDwgbmV3IERhdGUoY2VydGlmaWNhdGUudmFsaWRGcm9tKS5nZXRUaW1lKCkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkNlcnRpZmljYXRlIG5vdCB2YWxpZCB5ZXRcIik7XG4gICAgfVxuICAgIGlmIChuZXcgRGF0ZShjZXJ0aWZpY2F0ZS52YWxpZFRvKS5nZXRUaW1lKCkgPCBjdXJyVGltZSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ2VydGlmaWNhdGUgZXhwaXJlZFwiKTtcbiAgICB9XG5cbiAgICB0aGlzLiNjYWNoZWRDZXJ0aWZpY2F0ZXMuc2V0KHVybCwgY2VydGlmaWNhdGUpO1xuICAgIHJldHVybiBjZXJ0aWZpY2F0ZTtcbiAgfVxufVxuIl19