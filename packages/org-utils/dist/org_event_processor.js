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
        __classPrivateFieldSet(this, _OrgEventProcessor_topicArn, cubesigner_sdk_1.envs[options?.env ?? "prod"].OrgEventsTopicArn, "f");
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3JnX2V2ZW50X3Byb2Nlc3Nvci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9vcmdfZXZlbnRfcHJvY2Vzc29yLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7OztBQUFBLG1DQUF1RDtBQUV2RCxnRUFBbUQ7QUFFbkQsbURBQW1EO0FBQ25ELE1BQU0seUJBQXlCLEdBQUcsQ0FBQyw2QkFBNkIsQ0FBQyxDQUFDO0FBRWxFLE1BQU0sb0JBQW9CLEdBQUcsbUJBQW1CLENBQUM7QUFzQ2pELGtEQUFrRDtBQUNsRCxNQUFhLGlCQUFpQjtJQUs1Qjs7Ozs7T0FLRztJQUNILFlBQVksS0FBYSxFQUFFLE9BQWtDOztRQVZwRCw4Q0FBa0I7UUFDbEIsMkNBQWU7UUFDeEIsd0RBQStDO1FBUzdDLHVCQUFBLElBQUksK0JBQWEscUJBQUksQ0FBQyxPQUFPLEVBQUUsR0FBRyxJQUFJLE1BQU0sQ0FBQyxDQUFDLGlCQUFpQixNQUFBLENBQUM7UUFDaEUsdUJBQUEsSUFBSSw0QkFBVSxLQUFLLE1BQUEsQ0FBQztRQUNwQix1QkFBQSxJQUFJLHlDQUF1QixJQUFJLEdBQUcsRUFBRSxNQUFBLENBQUM7SUFDdkMsQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0gsS0FBSyxDQUFDLFlBQVksQ0FBQyxPQUFtQjtRQUNwQyxzQkFBc0I7UUFDdEIsSUFBSSxPQUFPLENBQUMsUUFBUSxLQUFLLHVCQUFBLElBQUksbUNBQVUsRUFBRSxDQUFDO1lBQ3hDLE1BQU0sSUFBSSxLQUFLLENBQUMsdUJBQXVCLHVCQUFBLElBQUksbUNBQVUsYUFBYSxPQUFPLENBQUMsUUFBUSxHQUFHLENBQUMsQ0FBQztRQUN6RixDQUFDO1FBRUQsZ0ZBQWdGO1FBQ2hGLElBQUksU0FBUyxJQUFJLE9BQU8sRUFBRSxDQUFDO1lBQ3pCLE1BQU0sSUFBSSxLQUFLLENBQUMsc0NBQXNDLENBQUMsQ0FBQztRQUMxRCxDQUFDO1FBRUQseURBQXlEO1FBQ3pELElBQUksT0FBTyxD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QixDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsV0FBVyxDQUFDLENBQUM7SUFDL0MsT0FBTyxXQUFXLENBQUM7QUFDckIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFg1MDlDZXJ0aWZpY2F0ZSwgY3JlYXRlVmVyaWZ5IH0gZnJvbSBcImNyeXB0b1wiO1xuaW1wb3J0IHR5cGUgeyBFbnZpcm9ubWVudCB9IGZyb20gXCJAY3ViaXN0LWxhYnMvY3ViZXNpZ25lci1zZGtcIjtcbmltcG9ydCB7IGVudnMgfSBmcm9tIFwiQGN1YmlzdC1sYWJzL2N1YmVzaWduZXItc2RrXCI7XG5cbi8vIFVSTHMgdGhhdCBhcmUgc2FmZSB0byByZXRyaWV2ZSBjZXJ0aWZpY2F0ZXMgZnJvbVxuY29uc3QgU05TX0NFUlRJRklDQVRFX1VSTF9IT1NUUyA9IFtcInNucy51cy1lYXN0LTEuYW1hem9uYXdzLmNvbVwiXTtcblxuY29uc3QgU05TX0NFUlRJRklDQVRFX0hPU1QgPSBcInNucy5hbWF6b25hd3MuY29tXCI7XG5cbi8qKiBUaGUgY29tbW9uIGZpZWxkcyBvZiBTTlMgbWVzc2FnZXMgKi9cbmV4cG9ydCBpbnRlcmZhY2UgU25zTWVzc2FnZSB7XG4gIFR5cGU6IHN0cmluZztcbiAgTWVzc2FnZUlkOiBzdHJpbmc7XG4gIFRvcGljQXJuOiBzdHJpbmc7XG4gIE1lc3NhZ2U6IHN0cmluZztcbiAgVGltZXN0YW1wOiBzdHJpbmc7XG4gIFNpZ25hdHVyZVZlcnNpb246IHN0cmluZztcbiAgU2lnbmF0dXJlOiBzdHJpbmc7XG4gIFNpZ25pbmdDZXJ0VVJMOiBzdHJpbmc7XG59XG5cbi8qKiBUaGUgZm9ybWF0IG9mIGEgc3Vic2NyaXB0aW9uIGNvbmZpcm1hdGlvbiBzZW50IGJ5IFNOUyAqL1xuZXhwb3J0IGludGVyZmFjZSBTdWJzY3JpcHRpb25Db25maXJtYXRpb25NZXNzYWdlIGV4dGVuZHMgU25zTWVzc2FnZSB7XG4gIFRva2VuOiBzdHJpbmc7XG4gIFN1YnNjcmliZVVSTDogc3RyaW5nO1xufVxuXG4vKiogQ29tbW9uIGZpZWxkcyBmb3IgYW4gb3JnIGV2ZW50ICovXG5leHBvcnQgaW50ZXJmYWNlIE9yZ0V2ZW50QmFzZSB7XG4gIG9yZzogc3RyaW5nO1xuICB1dGNfdGltZXN0YW1wOiBudW1iZXI7XG4gIG9yZ19ldmVudDogc3RyaW5nO1xufVxuXG4vKiogVGhlIGZvcm1hdCBvZiBhbiBldmVudCBtZXNzYWdlIHNlbnQgYnkgU05TICovXG5leHBvcnQgaW50ZXJmYWNlIE9yZ0V2ZW50TWVzc2FnZSBleHRlbmRzIFNuc01lc3NhZ2Uge1xuICBTdWJqZWN0Pzogc3RyaW5nO1xuICBVbnN1YnNjcmliZVVSTDogc3RyaW5nO1xufVxuXG4vKiogT3B0aW9ucyBmb3IgdGhlIHByb2Nlc3NvciAqL1xuZXhwb3J0IGludGVyZmFjZSBPcmdFdmVudFByb2Nlc3Nvck9wdGlvbnMge1xuICBlbnY6IEVudmlyb25tZW50O1xufVxuXG4vKiogQSB1dGlsaXR5IGZvciBwcm9jZXNzaW5nIG9yZyBldmVudCBtZXNzYWdlcyAqL1xuZXhwb3J0IGNsYXNzIE9yZ0V2ZW50UHJvY2Vzc29yIHtcbiAgcmVhZG9ubHkgI3RvcGljQXJuOiBzdHJpbmc7XG4gIHJlYWRvbmx5ICNvcmdJZDogc3RyaW5nO1xuICAjY2FjaGVkQ2VydGlmaWNhdGVzOiBNYXA8VVJMLCBYNTA5Q2VydGlmaWNhdGU+O1xuXG4gIC8qKlxuICAgKiBDb25zdHJ1Y3Rvci5cbiAgICpcbiAgICogQHBhcmFtIG9yZ0lkIFRoZSBvcmcgaWRcbiAgICogQHBhcmFtIG9wdGlvbnMgQWRkaXRpb25hbCBvcHRpb25zIGZvciB0aGUgcHJvY2Vzc29yXG4gICAqL1xuICBjb25zdHJ1Y3RvcihvcmdJZDogc3RyaW5nLCBvcHRpb25zPzogT3JnRXZlbnRQcm9jZXNzb3JPcHRpb25zKSB7XG4gICAgdGhpcy4jdG9waWNBcm4gPSBlbnZzW29wdGlvbnM/LmVudiA/PyBcInByb2RcIl0uT3JnRXZlbnRzVG9waWNBcm47XG4gICAgdGhpcy4jb3JnSWQgPSBvcmdJZDtcbiAgICB0aGlzLiNjYWNoZWRDZXJ0aWZpY2F0ZXMgPSBuZXcgTWFwKCk7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2tzIGFuIFNOUyBtZXNzYWdlIGFuZCBpdHMgc2lnbmF0dXJlLiBUaHJvd3MgYW4gZXJyb3IgaWYgdGhlIG1lc3NhZ2VcbiAgICogaW52YWxpZCBvciB0aGUgc2lnbmF0dXJlIGlzIGludmFsaWQuXG4gICAqXG4gICAqIEBwYXJhbSBtZXNzYWdlIFRoZSBTTlMgbWVzc2FnZSB0byBjaGVja1xuICAgKi9cbiAgYXN5bmMgY2hlY2tNZXNzYWdlKG1lc3NhZ2U6IFNuc01lc3NhZ2UpIHtcbiAgICAvLyBDaGVjayB0aGUgdG9waWMgQVJOXG4gICAgaWYgKG1lc3NhZ2UuVG9waWNBcm4gIT09IHRoaXMuI3RvcGljQXJuKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYEV4cGVjdGVkIHRvcGljIEFSTiAnJHt0aGlzLiN0b3BpY0Fybn0nLCBmb3VuZCAnJHttZXNzYWdlLlRvcGljQXJufSdgKTtcbiAgICB9XG5cbiAgICAvLyBCb3RoIHN1YnNjcmlwdGlvbiBjb25maXJtYXRpb25zIGFuZCBvcmcgZXZlbnQgbWVzc2FnZXMgc2hvdWxkIGhhdmUgbm8gc3ViamVjdFxuICAgIGlmIChcIlN1YmplY3RcIiBpbiBtZXNzYWdlKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJFeHBlY3RlZCBhIG1lc3NhZ2Ugd2l0aG91dCBhIHN1YmplY3RcIik7XG4gICAgfVxuXG4gICAgLy8gVGhlIG9yZyBldmVudHMgdG9waWMgdXNlcyBzaWduYXR1cmUgdmVyc2lvbiAyIChTSEEyNTYpXG4gICAgaWYgKG1lc3NhZ2UuU2lnbmF0dXJlVmVyc2lvbiAhPT0gXCIyXCIpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkV4cGVjdGVkIHNpZ25hdHVyZSB2ZXJzaW9uIDJcIik7XG4gICAgfVxuXG4gICAgLy8gUmV0cmlldmUgdGhlIGNlcnRpZmljYXRlIGFuZCBzYW5pdHkgY2hlY2sgaXRcbiAgICBjb25zdCBjZXJ0aWZpY2F0ZSA9IGF3YWl0IHRoaXMuI2ZldGNoQW5kVmFsaWRhdGVDZXJ0aWZpY2F0ZShuZXcgVVJMKG1lc3NhZ2UuU2lnbmluZ0NlcnRVUkwpKTtcblxuICAgIC8vIEV4dHJhY3QgZmllbGRzIHNwZWNpZmljIHRvIHN1YnNjcmlwdGlvbiBjb25maXJtYXRpb25zXG4gICAgY29uc3Qgc3Vic2NyaWJlVXJsID0gKG1lc3NhZ2UgYXMgU3Vic2NyaXB0aW9uQ29uZmlybWF0aW9uTWVzc2FnZSkuU3Vic2NyaWJlVVJMO1xuICAgIGNvbnN0IHRva2VuID0gKG1lc3NhZ2UgYXMgU3Vic2NyaXB0aW9uQ29uZmlybWF0aW9uTWVzc2FnZSkuVG9rZW47XG5cbiAgICAvLyBDaGVjayB0aGUgc2lnbmF0dXJlXG4gICAgY29uc3QgZmllbGRzID0gW1wiTWVzc2FnZVwiLCBtZXNzYWdlLk1lc3NhZ2UsIFwiTWVzc2FnZUlkXCIsIG1lc3NhZ2UuTWVzc2FnZUlkXVxuICAgICAgLmNvbmNhdChzdWJzY3JpYmVVcmwgIT09IHVuZGVmaW5lZCA/IFtcIlN1YnNjcmliZVVSTFwiLCBzdWJzY3JpYmVVcmxdIDogW10pXG4gICAgICAuY29uY2F0KFtcIlRpbWVzdGFtcFwiLCBtZXNzYWdlLlRpbWVzdGFtcF0pXG4gICAgICAuY29uY2F0KHRva2VuICE9PSB1bmRlZmluZWQgPyBbXCJUb2tlblwiLCB0b2tlbl0gOiBbXSlcbiAgICAgIC5jb25jYXQoW1wiVG9waWNBcm5cIiwgbWVzc2FnZS5Ub3BpY0FybiwgXCJUeXBlXCIsIG1lc3NhZ2UuVHlwZV0pO1xuICAgIGNvbnN0IHZlcmlmeSA9IGNyZWF0ZVZlcmlmeShcIlJTQS1TSEEyNTZcIik7XG4gICAgdmVyaWZ5LnVwZGF0ZShmaWVsZHMuam9pbihcIlxcblwiKSArIFwiXFxuXCIpO1xuICAgIGNvbnN0IGlzVmFsaWQgPSB2ZXJpZnkudmVyaWZ5KGNlcnRpZmljYXRlLnB1YmxpY0tleSwgbWVzc2FnZS5TaWduYXR1cmUsIFwiYmFzZTY0XCIpO1xuICAgIGlmICghaXNWYWxpZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVGhlIG9yZyBldmVudCBoYXMgYW4gaW52YWxpZCBzaWduYXR1cmVcIik7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFBhcnNlIGFuIG9yZyBldmVudCBhbmQgY2hlY2sgaXRzIHNpZ25hdHVyZS4gVGhyb3dzIGFuIGVycm9yIGlmIHRoZVxuICAgKiBtZXNzYWdlIGlzIG5vdCBhIHZhbGlkIG9yZyBldmVudCBvciB0aGUgc2lnbmF0dXJlIGlzIGludmFsaWQuXG4gICAqXG4gICAqIEBwYXJhbSBtZXNzYWdlIFRoZSBvcmcgZXZlbnQgbWVzc2FnZSB0byBjaGVja1xuICAgKiBAcmV0dXJucyBUaGUgb3JnIGV2ZW50XG4gICAqL1xuICBhc3luYyBwYXJzZShtZXNzYWdlOiBPcmdFdmVudE1lc3NhZ2UpOiBQcm9taXNlPE9yZ0V2ZW50QmFzZT4ge1xuICAgIGF3YWl0IHRoaXMuY2hlY2tNZXNzYWdlKG1lc3NhZ2UpO1xuXG4gICAgLy8gQ2hlY2sgdGhhdCB0aGUgZXZlbnQgaXMgZm9yIHRoZSBleHBlY3RlZCBvcmdcbiAgICBjb25zdCBvcmdFdmVudDogT3JnRXZlbnRCYXNlID0gSlNPTi5wYXJzZShtZXNzYWdlLk1lc3NhZ2UpO1xuICAgIGlmIChvcmdFdmVudC5vcmcgIT09IHRoaXMuI29yZ0lkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYEV4cGVjdGVkIG9yZyB0byBiZSAnJHt0aGlzLiNvcmdJZH0nLCBmb3VuZCAnJHtvcmdFdmVudC5vcmd9J2ApO1xuICAgIH1cblxuICAgIHJldHVybiBvcmdFdmVudDtcbiAgfVxuXG4gIC8qKlxuICAgKiBGZXRjaGVzIGEgY2VydGlmaWNhdGUgZnJvbSBhIGdpdmVuIFVSTCBvciBmcm9tIHRoZSBjZXJ0aWZpY2F0ZSBjYWNoZS5cbiAgICogVGhyb3dzIGFuIGVycm9yIGlmIHRoZSBVUkwgZG9lcyBub3QgY29ycmVzcG9uZCB0byBhbiBTTlMgY2VydGlmaWNhdGUgVVJMLlxuICAgKlxuICAgKiBOb3RlOiBJZGVhbGx5LCB0aGlzIG1ldGhvZCB3b3VsZCB2ZXJpZnkgdGhlIGNlcnRpZmljYXRlIGNoYWluLCBidXQgdGhlcmVcbiAgICogaXMgbm8gb2J2aW91cyBjaGFpbi4gSW5zdGVhZCwgdGhpcyBtZXRob2Qgb25seSBmZXRjaGVzIGNlcnRpZmljYXRlcyBmcm9tXG4gICAqIGEgc21hbGwgc2V0IG9mIGFsbG93bGlzdGVkIFVSTHMuXG4gICAqXG4gICAqIEBwYXJhbSB1cmwgVGhlIFVSTCBvZiB0aGUgY2VydGlmaWNhdGVcbiAgICogQHJldHVybnMgVGhlIGNlcnRpZmljYXRlXG4gICAqL1xuICBhc3luYyAjZmV0Y2hBbmRWYWxpZGF0ZUNlcnRpZmljYXRlKHVybDogVVJMKTogUHJvbWlzZTxYNTA5Q2VydGlmaWNhdGU+IHtcbiAgICBjb25zdCBjdXJyVGltZSA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuICAgIGNvbnN0IGNhY2hlZENlcnRpZmljYXRlID0gdGhpcy4jY2FjaGVkQ2VydGlmaWNhdGVzLmdldCh1cmwpO1xuICAgIGlmIChjYWNoZWRDZXJ0aWZpY2F0ZSAmJiBjdXJyVGltZSA8IG5ldyBEYXRlKGNhY2hlZENlcnRpZmljYXRlLnZhbGlkVG8pLmdldFRpbWUoKSkge1xuICAgICAgcmV0dXJuIGNhY2hlZENlcnRpZmljYXRlO1xuICAgIH1cblxuICAgIC8vIE9ubHkgZmV0Y2ggY2VydGlmaWNhdGVzIGZyb20gSFRUUFMgVVJMc1xuICAgIGlmICh1cmwucHJvdG9jb2wgIT09IFwiaHR0cHM6XCIpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkV4cGVjdGVkIHNpZ25pbmcgY2VydGlmaWNhdGUgVVJMIHRvIHVzZSBIVFRQU1wiKTtcbiAgICB9XG5cbiAgICAvLyBPbmx5IGZldGNoIGNlcnRpZmljYXRlIFVSTHMgZm9yIFNOU1xuICAgIGlmIChTTlNfQ0VSVElGSUNBVEVfVVJMX0hPU1RTLmluZGV4T2YodXJsLmhvc3QpID09PSAtMSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRXhwZWN0ZWQgc2lnbmluZyBjZXJ0aWZpY2F0ZSBVUkwgZm9yIFNOUyBpbiB1cy1lYXN0LTFcIik7XG4gICAgfVxuXG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaCh1cmwpO1xuICAgIGlmICghcmVzcG9uc2Uub2spIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgVW5hYmxlIHRvIGRvd25sb2FkIGNlcnRpZmljYXRlLiBTdGF0dXM6ICR7cmVzcG9uc2Uuc3RhdHVzfWApO1xuICAgIH1cbiAgICBjb25zdCBibG9iID0gYXdhaXQgcmVzcG9uc2UuYmxvYigpO1xuICAgIGNvbnN0IGNlcnRpZmljYXRlID0gbmV3IFg1MDlDZXJ0aWZpY2F0ZShhd2FpdCBibG9iLnRleHQoKSk7XG4gICAgaWYgKCFjZXJ0aWZpY2F0ZS5jaGVja0hvc3QoU05TX0NFUlRJRklDQVRFX0hPU1QpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYEV4cGVjdGVkIGNlcnRpZmljYXRlIHRvIGJlIGZvciAnJHtTTlNfQ0VSVElGSUNBVEVfSE9TVH0nYCk7XG4gICAgfVxuXG4gICAgLy8gQ2hlY2sgdmFsaWRpdHkgdGltZXNcbiAgICBpZiAoY3VyclRpbWUgPCBuZXcgRGF0ZShjZXJ0aWZpY2F0ZS52YWxpZEZyb20pLmdldFRpbWUoKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ2VydGlmaWNhdGUgbm90IHZhbGlkIHlldFwiKTtcbiAgICB9XG4gICAgaWYgKG5ldyBEYXRlKGNlcnRpZmljYXRlLnZhbGlkVG8pLmdldFRpbWUoKSA8IGN1cnJUaW1lKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDZXJ0aWZpY2F0ZSBleHBpcmVkXCIpO1xuICAgIH1cblxuICAgIHRoaXMuI2NhY2hlZENlcnRpZmljYXRlcy5zZXQodXJsLCBjZXJ0aWZpY2F0ZSk7XG4gICAgcmV0dXJuIGNlcnRpZmljYXRlO1xuICB9XG59XG4iXX0=