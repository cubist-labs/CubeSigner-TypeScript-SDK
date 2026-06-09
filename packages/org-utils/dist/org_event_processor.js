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
const cubesigner_sdk_1 = require("@cubist-labs/cubesigner-sdk");
// URLs that are safe to retrieve certificates from
const SNS_CERTIFICATE_URL_HOSTS = ["sns.us-east-1.amazonaws.com"];
const SNS_CERTIFICATE_HOST = "sns.amazonaws.com";
/** A utility for processing org event messages */
class OrgEventProcessor {
    /**
     * Constructor.
     *
     * @param orgId The org id
     * @param options Additional options for the processor
     */
    constructor(orgId, options) {
        _OrgEventProcessor_instances.add(this);
        _OrgEventProcessor_topicArn.set(this, void 0);
        _OrgEventProcessor_orgId.set(this, void 0);
        _OrgEventProcessor_cachedCertificates.set(this, void 0);
        const env = options?.env ?? "prod";
        if (typeof env === "string") {
            __classPrivateFieldSet(this, _OrgEventProcessor_topicArn, cubesigner_sdk_1.envs[env].OrgEventsTopicArn, "f");
        }
        else {
            __classPrivateFieldSet(this, _OrgEventProcessor_topicArn, env.OrgEventsTopicArn, "f");
        }
        __classPrivateFieldSet(this, _OrgEventProcessor_orgId, orgId, "f");
        __classPrivateFieldSet(this, _OrgEventProcessor_cachedCertificates, new Map(), "f");
    }
    /**
     * Checks an SNS message and its signature. Throws an error if the message
     * invalid or the signature is invalid.
     *
     * @param message The SNS message to check
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
     * @param message The org event message to check
     * @returns The org event
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
 * @param url The URL of the certificate
 * @returns The certificate
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3JnX2V2ZW50X3Byb2Nlc3Nvci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9vcmdfZXZlbnRfcHJvY2Vzc29yLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7OztBQUFBLG1DQUF1RDtBQUV2RCwrREFBa0Q7QUFFbEQsbURBQW1EO0FBQ25ELE1BQU0seUJBQXlCLEdBQUcsQ0FBQyw2QkFBNkIsQ0FBQyxDQUFDO0FBRWxFLE1BQU0sb0JBQW9CLEdBQUcsbUJBQW1CLENBQUM7QUFzQ2pELGtEQUFrRDtBQUNsRCxNQUFhLGlCQUFpQjtJQUs1Qjs7Ozs7T0FLRztJQUNILFlBQVksS0FBYSxFQUFFLE9BQWtDOztRQVZwRCw4Q0FBa0I7UUFDbEIsMkNBQWU7UUFDeEIsd0RBQStDO1FBUzdDLE1BQU0sR0FBRyxHQUFHLE9BQU8sRUFBRSxHQUFHLElBQUksTUFBTSxDQUFDO1FBQ25DLElBQUksT0FBTyxHQUFHLEtBQUssUUFBUSxFQUFFLENBQUM7WUFDNUIsdUJBQUEsSUFBSSwrQkFBYSxxQkFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLGlCQUFpQixNQUFBLENBQUM7UUFDL0MsQ0FBQzthQUFNLENBQUM7WUFDTix1QkFBQSxJQUFJLCtCQUFhLEdBQUcsQ0FBQyxpQkFBaUIsTUFBQSxDQUFDO1FBQ3pDLENBQUM7UUFDRCx1QkFBQSxJQUFJLDRCQUFVLEtBQUssTUFBQSxDQUFDO1FBQ3BCLHVCQUFBLElBQUkseUNBQXVCLElBQUksR0FBRyxFQUFFLE1BQUEsQ0FBQztJQUN2QyxDQUFDO0lBRUQ7Ozs7O09BS0c7SUFDSCxLQUFLLENBQUMsWUFBWSxDQUFDLE9BQW1CO1FBQ3BDLHNCQUFzQjtRQUN0QixJQUFJLE9BQU8sQ0FBQyxRQUFRLEtBQUssdUJBQUEsSUFBSSxtQ0FBVSxFQUFFLENBQUM7WUFDeEMsTUFBTSxJQUFJLEtBQUssQ0FBQyx1QkFBdUIsdUJBQUEsSUFBSSxtQ0FBVSxhQUFhLE9BQU8sQ0FBQyxRQUFRLEdBQUcs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RCxJQUFJLElBQUksSUFBSSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQyxPQUFPLEVBQUUsR0FBRyxRQUFRLEVBQUUsQ0FBQztRQUN2RCxNQUFNLElBQUksS0FBSyxDQUFDLHFCQUFxQixDQUFDLENBQUM7SUFDekMsQ0FBQztJQUVELHVCQUFBLElBQUksNkNBQW9CLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxXQUFXLENBQUMsQ0FBQztJQUMvQyxPQUFPLFdBQVcsQ0FBQztBQUNyQixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgWDUwOUNlcnRpZmljYXRlLCBjcmVhdGVWZXJpZnkgfSBmcm9tIFwiY3J5cHRvXCI7XG5pbXBvcnQgdHlwZSB7IEVudkludGVyZmFjZSwgRW52aXJvbm1lbnQgfSBmcm9tIFwiQGN1YmlzdC1kZXYvY3ViZXNpZ25lci1zZGtcIjtcbmltcG9ydCB7IGVudnMgfSBmcm9tIFwiQGN1YmlzdC1kZXYvY3ViZXNpZ25lci1zZGtcIjtcblxuLy8gVVJMcyB0aGF0IGFyZSBzYWZlIHRvIHJldHJpZXZlIGNlcnRpZmljYXRlcyBmcm9tXG5jb25zdCBTTlNfQ0VSVElGSUNBVEVfVVJMX0hPU1RTID0gW1wic25zLnVzLWVhc3QtMS5hbWF6b25hd3MuY29tXCJdO1xuXG5jb25zdCBTTlNfQ0VSVElGSUNBVEVfSE9TVCA9IFwic25zLmFtYXpvbmF3cy5jb21cIjtcblxuLyoqIFRoZSBjb21tb24gZmllbGRzIG9mIFNOUyBtZXNzYWdlcyAqL1xuZXhwb3J0IGludGVyZmFjZSBTbnNNZXNzYWdlIHtcbiAgVHlwZTogc3RyaW5nO1xuICBNZXNzYWdlSWQ6IHN0cmluZztcbiAgVG9waWNBcm46IHN0cmluZztcbiAgTWVzc2FnZTogc3RyaW5nO1xuICBUaW1lc3RhbXA6IHN0cmluZztcbiAgU2lnbmF0dXJlVmVyc2lvbjogc3RyaW5nO1xuICBTaWduYXR1cmU6IHN0cmluZztcbiAgU2lnbmluZ0NlcnRVUkw6IHN0cmluZztcbn1cblxuLyoqIFRoZSBmb3JtYXQgb2YgYSBzdWJzY3JpcHRpb24gY29uZmlybWF0aW9uIHNlbnQgYnkgU05TICovXG5leHBvcnQgaW50ZXJmYWNlIFN1YnNjcmlwdGlvbkNvbmZpcm1hdGlvbk1lc3NhZ2UgZXh0ZW5kcyBTbnNNZXNzYWdlIHtcbiAgVG9rZW46IHN0cmluZztcbiAgU3Vic2NyaWJlVVJMOiBzdHJpbmc7XG59XG5cbi8qKiBDb21tb24gZmllbGRzIGZvciBhbiBvcmcgZXZlbnQgKi9cbmV4cG9ydCBpbnRlcmZhY2UgT3JnRXZlbnRCYXNlIHtcbiAgb3JnOiBzdHJpbmc7XG4gIHV0Y190aW1lc3RhbXA6IG51bWJlcjtcbiAgb3JnX2V2ZW50OiBzdHJpbmc7XG59XG5cbi8qKiBUaGUgZm9ybWF0IG9mIGFuIGV2ZW50IG1lc3NhZ2Ugc2VudCBieSBTTlMgKi9cbmV4cG9ydCBpbnRlcmZhY2UgT3JnRXZlbnRNZXNzYWdlIGV4dGVuZHMgU25zTWVzc2FnZSB7XG4gIFN1YmplY3Q/OiBzdHJpbmc7XG4gIFVuc3Vic2NyaWJlVVJMOiBzdHJpbmc7XG59XG5cbi8qKiBPcHRpb25zIGZvciB0aGUgcHJvY2Vzc29yICovXG5leHBvcnQgaW50ZXJmYWNlIE9yZ0V2ZW50UHJvY2Vzc29yT3B0aW9ucyB7XG4gIGVudjogRW52aXJvbm1lbnQgfCBFbnZJbnRlcmZhY2U7XG59XG5cbi8qKiBBIHV0aWxpdHkgZm9yIHByb2Nlc3Npbmcgb3JnIGV2ZW50IG1lc3NhZ2VzICovXG5leHBvcnQgY2xhc3MgT3JnRXZlbnRQcm9jZXNzb3Ige1xuICByZWFkb25seSAjdG9waWNBcm46IHN0cmluZztcbiAgcmVhZG9ubHkgI29yZ0lkOiBzdHJpbmc7XG4gICNjYWNoZWRDZXJ0aWZpY2F0ZXM6IE1hcDxVUkwsIFg1MDlDZXJ0aWZpY2F0ZT47XG5cbiAgLyoqXG4gICAqIENvbnN0cnVjdG9yLlxuICAgKlxuICAgKiBAcGFyYW0gb3JnSWQgVGhlIG9yZyBpZFxuICAgKiBAcGFyYW0gb3B0aW9ucyBBZGRpdGlvbmFsIG9wdGlvbnMgZm9yIHRoZSBwcm9jZXNzb3JcbiAgICovXG4gIGNvbnN0cnVjdG9yKG9yZ0lkOiBzdHJpbmcsIG9wdGlvbnM/OiBPcmdFdmVudFByb2Nlc3Nvck9wdGlvbnMpIHtcbiAgICBjb25zdCBlbnYgPSBvcHRpb25zPy5lbnYgPz8gXCJwcm9kXCI7XG4gICAgaWYgKHR5cGVvZiBlbnYgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgIHRoaXMuI3RvcGljQXJuID0gZW52c1tlbnZdLk9yZ0V2ZW50c1RvcGljQXJuO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLiN0b3BpY0FybiA9IGVudi5PcmdFdmVudHNUb3BpY0FybjtcbiAgICB9XG4gICAgdGhpcy4jb3JnSWQgPSBvcmdJZDtcbiAgICB0aGlzLiNjYWNoZWRDZXJ0aWZpY2F0ZXMgPSBuZXcgTWFwKCk7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2tzIGFuIFNOUyBtZXNzYWdlIGFuZCBpdHMgc2lnbmF0dXJlLiBUaHJvd3MgYW4gZXJyb3IgaWYgdGhlIG1lc3NhZ2VcbiAgICogaW52YWxpZCBvciB0aGUgc2lnbmF0dXJlIGlzIGludmFsaWQuXG4gICAqXG4gICAqIEBwYXJhbSBtZXNzYWdlIFRoZSBTTlMgbWVzc2FnZSB0byBjaGVja1xuICAgKi9cbiAgYXN5bmMgY2hlY2tNZXNzYWdlKG1lc3NhZ2U6IFNuc01lc3NhZ2UpIHtcbiAgICAvLyBDaGVjayB0aGUgdG9waWMgQVJOXG4gICAgaWYgKG1lc3NhZ2UuVG9waWNBcm4gIT09IHRoaXMuI3RvcGljQXJuKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYEV4cGVjdGVkIHRvcGljIEFSTiAnJHt0aGlzLiN0b3BpY0Fybn0nLCBmb3VuZCAnJHttZXNzYWdlLlRvcGljQXJufSdgKTtcbiAgICB9XG5cbiAgICAvLyBCb3RoIHN1YnNjcmlwdGlvbiBjb25maXJtYXRpb25zIGFuZCBvcmcgZXZlbnQgbWVzc2FnZXMgc2hvdWxkIGhhdmUgbm8gc3ViamVjdFxuICAgIGlmIChcIlN1YmplY3RcIiBpbiBtZXNzYWdlKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJFeHBlY3RlZCBhIG1lc3NhZ2Ugd2l0aG91dCBhIHN1YmplY3RcIik7XG4gICAgfVxuXG4gICAgLy8gVGhlIG9yZyBldmVudHMgdG9waWMgdXNlcyBzaWduYXR1cmUgdmVyc2lvbiAyIChTSEEyNTYpXG4gICAgaWYgKG1lc3NhZ2UuU2lnbmF0dXJlVmVyc2lvbiAhPT0gXCIyXCIpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkV4cGVjdGVkIHNpZ25hdHVyZSB2ZXJzaW9uIDJcIik7XG4gICAgfVxuXG4gICAgLy8gUmV0cmlldmUgdGhlIGNlcnRpZmljYXRlIGFuZCBzYW5pdHkgY2hlY2sgaXRcbiAgICBjb25zdCBjZXJ0aWZpY2F0ZSA9IGF3YWl0IHRoaXMuI2ZldGNoQW5kVmFsaWRhdGVDZXJ0aWZpY2F0ZShuZXcgVVJMKG1lc3NhZ2UuU2lnbmluZ0NlcnRVUkwpKTtcblxuICAgIC8vIEV4dHJhY3QgZmllbGRzIHNwZWNpZmljIHRvIHN1YnNjcmlwdGlvbiBjb25maXJtYXRpb25zXG4gICAgY29uc3Qgc3Vic2NyaWJlVXJsID0gKG1lc3NhZ2UgYXMgU3Vic2NyaXB0aW9uQ29uZmlybWF0aW9uTWVzc2FnZSkuU3Vic2NyaWJlVVJMO1xuICAgIGNvbnN0IHRva2VuID0gKG1lc3NhZ2UgYXMgU3Vic2NyaXB0aW9uQ29uZmlybWF0aW9uTWVzc2FnZSkuVG9rZW47XG5cbiAgICAvLyBDaGVjayB0aGUgc2lnbmF0dXJlXG4gICAgY29uc3QgZmllbGRzID0gW1wiTWVzc2FnZVwiLCBtZXNzYWdlLk1lc3NhZ2UsIFwiTWVzc2FnZUlkXCIsIG1lc3NhZ2UuTWVzc2FnZUlkXVxuICAgICAgLmNvbmNhdChzdWJzY3JpYmVVcmwgIT09IHVuZGVmaW5lZCA/IFtcIlN1YnNjcmliZVVSTFwiLCBzdWJzY3JpYmVVcmxdIDogW10pXG4gICAgICAuY29uY2F0KFtcIlRpbWVzdGFtcFwiLCBtZXNzYWdlLlRpbWVzdGFtcF0pXG4gICAgICAuY29uY2F0KHRva2VuICE9PSB1bmRlZmluZWQgPyBbXCJUb2tlblwiLCB0b2tlbl0gOiBbXSlcbiAgICAgIC5jb25jYXQoW1wiVG9waWNBcm5cIiwgbWVzc2FnZS5Ub3BpY0FybiwgXCJUeXBlXCIsIG1lc3NhZ2UuVHlwZV0pO1xuICAgIGNvbnN0IHZlcmlmeSA9IGNyZWF0ZVZlcmlmeShcIlJTQS1TSEEyNTZcIik7XG4gICAgdmVyaWZ5LnVwZGF0ZShmaWVsZHMuam9pbihcIlxcblwiKSArIFwiXFxuXCIpO1xuICAgIGNvbnN0IGlzVmFsaWQgPSB2ZXJpZnkudmVyaWZ5KGNlcnRpZmljYXRlLnB1YmxpY0tleSwgbWVzc2FnZS5TaWduYXR1cmUsIFwiYmFzZTY0XCIpO1xuICAgIGlmICghaXNWYWxpZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVGhlIG9yZyBldmVudCBoYXMgYW4gaW52YWxpZCBzaWduYXR1cmVcIik7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFBhcnNlIGFuIG9yZyBldmVudCBhbmQgY2hlY2sgaXRzIHNpZ25hdHVyZS4gVGhyb3dzIGFuIGVycm9yIGlmIHRoZVxuICAgKiBtZXNzYWdlIGlzIG5vdCBhIHZhbGlkIG9yZyBldmVudCBvciB0aGUgc2lnbmF0dXJlIGlzIGludmFsaWQuXG4gICAqXG4gICAqIEBwYXJhbSBtZXNzYWdlIFRoZSBvcmcgZXZlbnQgbWVzc2FnZSB0byBjaGVja1xuICAgKiBAcmV0dXJucyBUaGUgb3JnIGV2ZW50XG4gICAqL1xuICBhc3luYyBwYXJzZShtZXNzYWdlOiBPcmdFdmVudE1lc3NhZ2UpOiBQcm9taXNlPE9yZ0V2ZW50QmFzZT4ge1xuICAgIGF3YWl0IHRoaXMuY2hlY2tNZXNzYWdlKG1lc3NhZ2UpO1xuXG4gICAgLy8gQ2hlY2sgdGhhdCB0aGUgZXZlbnQgaXMgZm9yIHRoZSBleHBlY3RlZCBvcmdcbiAgICBjb25zdCBvcmdFdmVudDogT3JnRXZlbnRCYXNlID0gSlNPTi5wYXJzZShtZXNzYWdlLk1lc3NhZ2UpO1xuICAgIGlmIChvcmdFdmVudC5vcmcgIT09IHRoaXMuI29yZ0lkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYEV4cGVjdGVkIG9yZyB0byBiZSAnJHt0aGlzLiNvcmdJZH0nLCBmb3VuZCAnJHtvcmdFdmVudC5vcmd9J2ApO1xuICAgIH1cblxuICAgIHJldHVybiBvcmdFdmVudDtcbiAgfVxuXG4gIC8qKlxuICAgKiBGZXRjaGVzIGEgY2VydGlmaWNhdGUgZnJvbSBhIGdpdmVuIFVSTCBvciBmcm9tIHRoZSBjZXJ0aWZpY2F0ZSBjYWNoZS5cbiAgICogVGhyb3dzIGFuIGVycm9yIGlmIHRoZSBVUkwgZG9lcyBub3QgY29ycmVzcG9uZCB0byBhbiBTTlMgY2VydGlmaWNhdGUgVVJMLlxuICAgKlxuICAgKiBOb3RlOiBJZGVhbGx5LCB0aGlzIG1ldGhvZCB3b3VsZCB2ZXJpZnkgdGhlIGNlcnRpZmljYXRlIGNoYWluLCBidXQgdGhlcmVcbiAgICogaXMgbm8gb2J2aW91cyBjaGFpbi4gSW5zdGVhZCwgdGhpcyBtZXRob2Qgb25seSBmZXRjaGVzIGNlcnRpZmljYXRlcyBmcm9tXG4gICAqIGEgc21hbGwgc2V0IG9mIGFsbG93bGlzdGVkIFVSTHMuXG4gICAqXG4gICAqIEBwYXJhbSB1cmwgVGhlIFVSTCBvZiB0aGUgY2VydGlmaWNhdGVcbiAgICogQHJldHVybnMgVGhlIGNlcnRpZmljYXRlXG4gICAqL1xuICBhc3luYyAjZmV0Y2hBbmRWYWxpZGF0ZUNlcnRpZmljYXRlKHVybDogVVJMKTogUHJvbWlzZTxYNTA5Q2VydGlmaWNhdGU+IHtcbiAgICBjb25zdCBjdXJyVGltZSA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuICAgIGNvbnN0IGNhY2hlZENlcnRpZmljYXRlID0gdGhpcy4jY2FjaGVkQ2VydGlmaWNhdGVzLmdldCh1cmwpO1xuICAgIGlmIChjYWNoZWRDZXJ0aWZpY2F0ZSAmJiBjdXJyVGltZSA8IG5ldyBEYXRlKGNhY2hlZENlcnRpZmljYXRlLnZhbGlkVG8pLmdldFRpbWUoKSkge1xuICAgICAgcmV0dXJuIGNhY2hlZENlcnRpZmljYXRlO1xuICAgIH1cblxuICAgIC8vIE9ubHkgZmV0Y2ggY2VydGlmaWNhdGVzIGZyb20gSFRUUFMgVVJMc1xuICAgIGlmICh1cmwucHJvdG9jb2wgIT09IFwiaHR0cHM6XCIpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkV4cGVjdGVkIHNpZ25pbmcgY2VydGlmaWNhdGUgVVJMIHRvIHVzZSBIVFRQU1wiKTtcbiAgICB9XG5cbiAgICAvLyBPbmx5IGZldGNoIGNlcnRpZmljYXRlIFVSTHMgZm9yIFNOU1xuICAgIGlmIChTTlNfQ0VSVElGSUNBVEVfVVJMX0hPU1RTLmluZGV4T2YodXJsLmhvc3QpID09PSAtMSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRXhwZWN0ZWQgc2lnbmluZyBjZXJ0aWZpY2F0ZSBVUkwgZm9yIFNOUyBpbiB1cy1lYXN0LTFcIik7XG4gICAgfVxuXG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaCh1cmwpO1xuICAgIGlmICghcmVzcG9uc2Uub2spIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgVW5hYmxlIHRvIGRvd25sb2FkIGNlcnRpZmljYXRlLiBTdGF0dXM6ICR7cmVzcG9uc2Uuc3RhdHVzfWApO1xuICAgIH1cbiAgICBjb25zdCBibG9iID0gYXdhaXQgcmVzcG9uc2UuYmxvYigpO1xuICAgIGNvbnN0IGNlcnRpZmljYXRlID0gbmV3IFg1MDlDZXJ0aWZpY2F0ZShhd2FpdCBibG9iLnRleHQoKSk7XG4gICAgaWYgKCFjZXJ0aWZpY2F0ZS5jaGVja0hvc3QoU05TX0NFUlRJRklDQVRFX0hPU1QpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYEV4cGVjdGVkIGNlcnRpZmljYXRlIHRvIGJlIGZvciAnJHtTTlNfQ0VSVElGSUNBVEVfSE9TVH0nYCk7XG4gICAgfVxuXG4gICAgLy8gQ2hlY2sgdmFsaWRpdHkgdGltZXNcbiAgICBpZiAoY3VyclRpbWUgPCBuZXcgRGF0ZShjZXJ0aWZpY2F0ZS52YWxpZEZyb20pLmdldFRpbWUoKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ2VydGlmaWNhdGUgbm90IHZhbGlkIHlldFwiKTtcbiAgICB9XG4gICAgaWYgKG5ldyBEYXRlKGNlcnRpZmljYXRlLnZhbGlkVG8pLmdldFRpbWUoKSA8IGN1cnJUaW1lKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDZXJ0aWZpY2F0ZSBleHBpcmVkXCIpO1xuICAgIH1cblxuICAgIHRoaXMuI2NhY2hlZENlcnRpZmljYXRlcy5zZXQodXJsLCBjZXJ0aWZpY2F0ZSk7XG4gICAgcmV0dXJuIGNlcnRpZmljYXRlO1xuICB9XG59XG4iXX0=