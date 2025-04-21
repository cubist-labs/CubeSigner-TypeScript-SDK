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
     * @param {string} orgId The org id
     * @param {OrgEventProcessorOptions} options Additional options for the processor
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3JnX2V2ZW50X3Byb2Nlc3Nvci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9vcmdfZXZlbnRfcHJvY2Vzc29yLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7OztBQUFBLG1DQUF1RDtBQUV2RCwrREFBa0Q7QUFFbEQsbURBQW1EO0FBQ25ELE1BQU0seUJBQXlCLEdBQUcsQ0FBQyw2QkFBNkIsQ0FBQyxDQUFDO0FBRWxFLE1BQU0sb0JBQW9CLEdBQUcsbUJBQW1CLENBQUM7QUFzQ2pELGtEQUFrRDtBQUNsRCxNQUFhLGlCQUFpQjtJQUs1Qjs7OztPQUlHO0lBQ0gsWUFBWSxLQUFhLEVBQUUsT0FBa0M7O1FBVHBELDhDQUFrQjtRQUNsQiwyQ0FBZTtRQUN4Qix3REFBK0M7UUFRN0MsdUJBQUEsSUFBSSwrQkFBYSxxQkFBSSxDQUFDLE9BQU8sRUFBRSxHQUFHLElBQUksTUFBTSxDQUFDLENBQUMsaUJBQWlCLE1BQUEsQ0FBQztRQUNoRSx1QkFBQSxJQUFJLDRCQUFVLEtBQUssTUFBQSxDQUFDO1FBQ3BCLHVCQUFBLElBQUkseUNBQXVCLElBQUksR0FBRyxFQUFFLE1BQUEsQ0FBQztJQUN2QyxDQUFDO0lBRUQ7Ozs7O09BS0c7SUFDSCxLQUFLLENBQUMsWUFBWSxDQUFDLE9BQW1CO1FBQ3BDLHNCQUFzQjtRQUN0QixJQUFJLE9BQU8sQ0FBQyxRQUFRLEtBQUssdUJBQUEsSUFBSSxtQ0FBVSxFQUFFLENBQUM7WUFDeEMsTUFBTSxJQUFJLEtBQUssQ0FBQyx1QkFBdUIsdUJBQUEsSUFBSSxtQ0FBVSxhQUFhLE9BQU8sQ0FBQyxRQUFRLEdBQUcsQ0FBQyxDQUFDO1FBQ3pGLENBQUM7UUFFRCxnRkFBZ0Y7UUFDaEYsSUFBSSxTQUFTLElBQUksT0FBTyxFQUFFLENBQUM7WUFDekIsTUFBTSxJQUFJLEtBQUssQ0FBQyxzQ0FBc0MsQ0FBQyxDQUFDO1FBQzFELENBQUM7UUFFRCx5REFBeUQ7UUFDekQsSUFBSSxPQUFPLENB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LENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxXQUFXLENBQUMsQ0FBQztJQUMvQyxPQUFPLFdBQVcsQ0FBQztBQUNyQixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgWDUwOUNlcnRpZmljYXRlLCBjcmVhdGVWZXJpZnkgfSBmcm9tIFwiY3J5cHRvXCI7XG5pbXBvcnQgdHlwZSB7IEVudmlyb25tZW50IH0gZnJvbSBcIkBjdWJpc3QtZGV2L2N1YmVzaWduZXItc2RrXCI7XG5pbXBvcnQgeyBlbnZzIH0gZnJvbSBcIkBjdWJpc3QtZGV2L2N1YmVzaWduZXItc2RrXCI7XG5cbi8vIFVSTHMgdGhhdCBhcmUgc2FmZSB0byByZXRyaWV2ZSBjZXJ0aWZpY2F0ZXMgZnJvbVxuY29uc3QgU05TX0NFUlRJRklDQVRFX1VSTF9IT1NUUyA9IFtcInNucy51cy1lYXN0LTEuYW1hem9uYXdzLmNvbVwiXTtcblxuY29uc3QgU05TX0NFUlRJRklDQVRFX0hPU1QgPSBcInNucy5hbWF6b25hd3MuY29tXCI7XG5cbi8qKiBUaGUgY29tbW9uIGZpZWxkcyBvZiBTTlMgbWVzc2FnZXMgKi9cbmV4cG9ydCBpbnRlcmZhY2UgU25zTWVzc2FnZSB7XG4gIFR5cGU6IHN0cmluZztcbiAgTWVzc2FnZUlkOiBzdHJpbmc7XG4gIFRvcGljQXJuOiBzdHJpbmc7XG4gIE1lc3NhZ2U6IHN0cmluZztcbiAgVGltZXN0YW1wOiBzdHJpbmc7XG4gIFNpZ25hdHVyZVZlcnNpb246IHN0cmluZztcbiAgU2lnbmF0dXJlOiBzdHJpbmc7XG4gIFNpZ25pbmdDZXJ0VVJMOiBzdHJpbmc7XG59XG5cbi8qKiBUaGUgZm9ybWF0IG9mIGEgc3Vic2NyaXB0aW9uIGNvbmZpcm1hdGlvbiBzZW50IGJ5IFNOUyAqL1xuZXhwb3J0IGludGVyZmFjZSBTdWJzY3JpcHRpb25Db25maXJtYXRpb25NZXNzYWdlIGV4dGVuZHMgU25zTWVzc2FnZSB7XG4gIFRva2VuOiBzdHJpbmc7XG4gIFN1YnNjcmliZVVSTDogc3RyaW5nO1xufVxuXG4vKiogQ29tbW9uIGZpZWxkcyBmb3IgYW4gb3JnIGV2ZW50ICovXG5leHBvcnQgaW50ZXJmYWNlIE9yZ0V2ZW50QmFzZSB7XG4gIG9yZzogc3RyaW5nO1xuICB1dGNfdGltZXN0YW1wOiBudW1iZXI7XG4gIG9yZ19ldmVudDogc3RyaW5nO1xufVxuXG4vKiogVGhlIGZvcm1hdCBvZiBhbiBldmVudCBtZXNzYWdlIHNlbnQgYnkgU05TICovXG5leHBvcnQgaW50ZXJmYWNlIE9yZ0V2ZW50TWVzc2FnZSBleHRlbmRzIFNuc01lc3NhZ2Uge1xuICBTdWJqZWN0Pzogc3RyaW5nO1xuICBVbnN1YnNjcmliZVVSTDogc3RyaW5nO1xufVxuXG4vKiogT3B0aW9ucyBmb3IgdGhlIHByb2Nlc3NvciAqL1xuZXhwb3J0IGludGVyZmFjZSBPcmdFdmVudFByb2Nlc3Nvck9wdGlvbnMge1xuICBlbnY6IEVudmlyb25tZW50O1xufVxuXG4vKiogQSB1dGlsaXR5IGZvciBwcm9jZXNzaW5nIG9yZyBldmVudCBtZXNzYWdlcyAqL1xuZXhwb3J0IGNsYXNzIE9yZ0V2ZW50UHJvY2Vzc29yIHtcbiAgcmVhZG9ubHkgI3RvcGljQXJuOiBzdHJpbmc7XG4gIHJlYWRvbmx5ICNvcmdJZDogc3RyaW5nO1xuICAjY2FjaGVkQ2VydGlmaWNhdGVzOiBNYXA8VVJMLCBYNTA5Q2VydGlmaWNhdGU+O1xuXG4gIC8qKlxuICAgKiBDb25zdHJ1Y3Rvci5cbiAgICogQHBhcmFtIHtzdHJpbmd9IG9yZ0lkIFRoZSBvcmcgaWRcbiAgICogQHBhcmFtIHtPcmdFdmVudFByb2Nlc3Nvck9wdGlvbnN9IG9wdGlvbnMgQWRkaXRpb25hbCBvcHRpb25zIGZvciB0aGUgcHJvY2Vzc29yXG4gICAqL1xuICBjb25zdHJ1Y3RvcihvcmdJZDogc3RyaW5nLCBvcHRpb25zPzogT3JnRXZlbnRQcm9jZXNzb3JPcHRpb25zKSB7XG4gICAgdGhpcy4jdG9waWNBcm4gPSBlbnZzW29wdGlvbnM/LmVudiA/PyBcInByb2RcIl0uT3JnRXZlbnRzVG9waWNBcm47XG4gICAgdGhpcy4jb3JnSWQgPSBvcmdJZDtcbiAgICB0aGlzLiNjYWNoZWRDZXJ0aWZpY2F0ZXMgPSBuZXcgTWFwKCk7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2tzIGFuIFNOUyBtZXNzYWdlIGFuZCBpdHMgc2lnbmF0dXJlLiBUaHJvd3MgYW4gZXJyb3IgaWYgdGhlIG1lc3NhZ2VcbiAgICogaW52YWxpZCBvciB0aGUgc2lnbmF0dXJlIGlzIGludmFsaWQuXG4gICAqXG4gICAqIEBwYXJhbSB7U25zTWVzc2FnZX0gbWVzc2FnZSBUaGUgU05TIG1lc3NhZ2UgdG8gY2hlY2tcbiAgICovXG4gIGFzeW5jIGNoZWNrTWVzc2FnZShtZXNzYWdlOiBTbnNNZXNzYWdlKSB7XG4gICAgLy8gQ2hlY2sgdGhlIHRvcGljIEFSTlxuICAgIGlmIChtZXNzYWdlLlRvcGljQXJuICE9PSB0aGlzLiN0b3BpY0Fybikge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBFeHBlY3RlZCB0b3BpYyBBUk4gJyR7dGhpcy4jdG9waWNBcm59JywgZm91bmQgJyR7bWVzc2FnZS5Ub3BpY0Fybn0nYCk7XG4gICAgfVxuXG4gICAgLy8gQm90aCBzdWJzY3JpcHRpb24gY29uZmlybWF0aW9ucyBhbmQgb3JnIGV2ZW50IG1lc3NhZ2VzIHNob3VsZCBoYXZlIG5vIHN1YmplY3RcbiAgICBpZiAoXCJTdWJqZWN0XCIgaW4gbWVzc2FnZSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRXhwZWN0ZWQgYSBtZXNzYWdlIHdpdGhvdXQgYSBzdWJqZWN0XCIpO1xuICAgIH1cblxuICAgIC8vIFRoZSBvcmcgZXZlbnRzIHRvcGljIHVzZXMgc2lnbmF0dXJlIHZlcnNpb24gMiAoU0hBMjU2KVxuICAgIGlmIChtZXNzYWdlLlNpZ25hdHVyZVZlcnNpb24gIT09IFwiMlwiKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJFeHBlY3RlZCBzaWduYXR1cmUgdmVyc2lvbiAyXCIpO1xuICAgIH1cblxuICAgIC8vIFJldHJpZXZlIHRoZSBjZXJ0aWZpY2F0ZSBhbmQgc2FuaXR5IGNoZWNrIGl0XG4gICAgY29uc3QgY2VydGlmaWNhdGUgPSBhd2FpdCB0aGlzLiNmZXRjaEFuZFZhbGlkYXRlQ2VydGlmaWNhdGUobmV3IFVSTChtZXNzYWdlLlNpZ25pbmdDZXJ0VVJMKSk7XG5cbiAgICAvLyBFeHRyYWN0IGZpZWxkcyBzcGVjaWZpYyB0byBzdWJzY3JpcHRpb24gY29uZmlybWF0aW9uc1xuICAgIGNvbnN0IHN1YnNjcmliZVVybCA9IChtZXNzYWdlIGFzIFN1YnNjcmlwdGlvbkNvbmZpcm1hdGlvbk1lc3NhZ2UpLlN1YnNjcmliZVVSTDtcbiAgICBjb25zdCB0b2tlbiA9IChtZXNzYWdlIGFzIFN1YnNjcmlwdGlvbkNvbmZpcm1hdGlvbk1lc3NhZ2UpLlRva2VuO1xuXG4gICAgLy8gQ2hlY2sgdGhlIHNpZ25hdHVyZVxuICAgIGNvbnN0IGZpZWxkcyA9IFtcIk1lc3NhZ2VcIiwgbWVzc2FnZS5NZXNzYWdlLCBcIk1lc3NhZ2VJZFwiLCBtZXNzYWdlLk1lc3NhZ2VJZF1cbiAgICAgIC5jb25jYXQoc3Vic2NyaWJlVXJsICE9PSB1bmRlZmluZWQgPyBbXCJTdWJzY3JpYmVVUkxcIiwgc3Vic2NyaWJlVXJsXSA6IFtdKVxuICAgICAgLmNvbmNhdChbXCJUaW1lc3RhbXBcIiwgbWVzc2FnZS5UaW1lc3RhbXBdKVxuICAgICAgLmNvbmNhdCh0b2tlbiAhPT0gdW5kZWZpbmVkID8gW1wiVG9rZW5cIiwgdG9rZW5dIDogW10pXG4gICAgICAuY29uY2F0KFtcIlRvcGljQXJuXCIsIG1lc3NhZ2UuVG9waWNBcm4sIFwiVHlwZVwiLCBtZXNzYWdlLlR5cGVdKTtcbiAgICBjb25zdCB2ZXJpZnkgPSBjcmVhdGVWZXJpZnkoXCJSU0EtU0hBMjU2XCIpO1xuICAgIHZlcmlmeS51cGRhdGUoZmllbGRzLmpvaW4oXCJcXG5cIikgKyBcIlxcblwiKTtcbiAgICBjb25zdCBpc1ZhbGlkID0gdmVyaWZ5LnZlcmlmeShjZXJ0aWZpY2F0ZS5wdWJsaWNLZXksIG1lc3NhZ2UuU2lnbmF0dXJlLCBcImJhc2U2NFwiKTtcbiAgICBpZiAoIWlzVmFsaWQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIlRoZSBvcmcgZXZlbnQgaGFzIGFuIGludmFsaWQgc2lnbmF0dXJlXCIpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBQYXJzZSBhbiBvcmcgZXZlbnQgYW5kIGNoZWNrIGl0cyBzaWduYXR1cmUuIFRocm93cyBhbiBlcnJvciBpZiB0aGVcbiAgICogbWVzc2FnZSBpcyBub3QgYSB2YWxpZCBvcmcgZXZlbnQgb3IgdGhlIHNpZ25hdHVyZSBpcyBpbnZhbGlkLlxuICAgKlxuICAgKiBAcGFyYW0ge09yZ0V2ZW50TWVzc2FnZX0gbWVzc2FnZSBUaGUgb3JnIGV2ZW50IG1lc3NhZ2UgdG8gY2hlY2tcbiAgICogQHJldHVybiB7T3JnRXZlbnRCYXNlfSBUaGUgb3JnIGV2ZW50XG4gICAqL1xuICBhc3luYyBwYXJzZShtZXNzYWdlOiBPcmdFdmVudE1lc3NhZ2UpOiBQcm9taXNlPE9yZ0V2ZW50QmFzZT4ge1xuICAgIGF3YWl0IHRoaXMuY2hlY2tNZXNzYWdlKG1lc3NhZ2UpO1xuXG4gICAgLy8gQ2hlY2sgdGhhdCB0aGUgZXZlbnQgaXMgZm9yIHRoZSBleHBlY3RlZCBvcmdcbiAgICBjb25zdCBvcmdFdmVudDogT3JnRXZlbnRCYXNlID0gSlNPTi5wYXJzZShtZXNzYWdlLk1lc3NhZ2UpO1xuICAgIGlmIChvcmdFdmVudC5vcmcgIT09IHRoaXMuI29yZ0lkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYEV4cGVjdGVkIG9yZyB0byBiZSAnJHt0aGlzLiNvcmdJZH0nLCBmb3VuZCAnJHtvcmdFdmVudC5vcmd9J2ApO1xuICAgIH1cblxuICAgIHJldHVybiBvcmdFdmVudDtcbiAgfVxuXG4gIC8qKlxuICAgKiBGZXRjaGVzIGEgY2VydGlmaWNhdGUgZnJvbSBhIGdpdmVuIFVSTCBvciBmcm9tIHRoZSBjZXJ0aWZpY2F0ZSBjYWNoZS5cbiAgICogVGhyb3dzIGFuIGVycm9yIGlmIHRoZSBVUkwgZG9lcyBub3QgY29ycmVzcG9uZCB0byBhbiBTTlMgY2VydGlmaWNhdGUgVVJMLlxuICAgKlxuICAgKiBOb3RlOiBJZGVhbGx5LCB0aGlzIG1ldGhvZCB3b3VsZCB2ZXJpZnkgdGhlIGNlcnRpZmljYXRlIGNoYWluLCBidXQgdGhlcmVcbiAgICogaXMgbm8gb2J2aW91cyBjaGFpbi4gSW5zdGVhZCwgdGhpcyBtZXRob2Qgb25seSBmZXRjaGVzIGNlcnRpZmljYXRlcyBmcm9tXG4gICAqIGEgc21hbGwgc2V0IG9mIGFsbG93bGlzdGVkIFVSTHMuXG4gICAqXG4gICAqIEBwYXJhbSB7VVJMfSB1cmwgVGhlIFVSTCBvZiB0aGUgY2VydGlmaWNhdGVcbiAgICogQHJldHVybiB7WDUwOUNlcnRpZmljYXRlfSBUaGUgY2VydGlmaWNhdGVcbiAgICovXG4gIGFzeW5jICNmZXRjaEFuZFZhbGlkYXRlQ2VydGlmaWNhdGUodXJsOiBVUkwpOiBQcm9taXNlPFg1MDlDZXJ0aWZpY2F0ZT4ge1xuICAgIGNvbnN0IGN1cnJUaW1lID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gICAgY29uc3QgY2FjaGVkQ2VydGlmaWNhdGUgPSB0aGlzLiNjYWNoZWRDZXJ0aWZpY2F0ZXMuZ2V0KHVybCk7XG4gICAgaWYgKGNhY2hlZENlcnRpZmljYXRlICYmIGN1cnJUaW1lIDwgbmV3IERhdGUoY2FjaGVkQ2VydGlmaWNhdGUudmFsaWRUbykuZ2V0VGltZSgpKSB7XG4gICAgICByZXR1cm4gY2FjaGVkQ2VydGlmaWNhdGU7XG4gICAgfVxuXG4gICAgLy8gT25seSBmZXRjaCBjZXJ0aWZpY2F0ZXMgZnJvbSBIVFRQUyBVUkxzXG4gICAgaWYgKHVybC5wcm90b2NvbCAhPT0gXCJodHRwczpcIikge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRXhwZWN0ZWQgc2lnbmluZyBjZXJ0aWZpY2F0ZSBVUkwgdG8gdXNlIEhUVFBTXCIpO1xuICAgIH1cblxuICAgIC8vIE9ubHkgZmV0Y2ggY2VydGlmaWNhdGUgVVJMcyBmb3IgU05TXG4gICAgaWYgKFNOU19DRVJUSUZJQ0FURV9VUkxfSE9TVFMuaW5kZXhPZih1cmwuaG9zdCkgPT09IC0xKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJFeHBlY3RlZCBzaWduaW5nIGNlcnRpZmljYXRlIFVSTCBmb3IgU05TIGluIHVzLWVhc3QtMVwiKTtcbiAgICB9XG5cbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoKHVybCk7XG4gICAgaWYgKCFyZXNwb25zZS5vaykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBVbmFibGUgdG8gZG93bmxvYWQgY2VydGlmaWNhdGUuIFN0YXR1czogJHtyZXNwb25zZS5zdGF0dXN9YCk7XG4gICAgfVxuICAgIGNvbnN0IGJsb2IgPSBhd2FpdCByZXNwb25zZS5ibG9iKCk7XG4gICAgY29uc3QgY2VydGlmaWNhdGUgPSBuZXcgWDUwOUNlcnRpZmljYXRlKGF3YWl0IGJsb2IudGV4dCgpKTtcbiAgICBpZiAoIWNlcnRpZmljYXRlLmNoZWNrSG9zdChTTlNfQ0VSVElGSUNBVEVfSE9TVCkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgRXhwZWN0ZWQgY2VydGlmaWNhdGUgdG8gYmUgZm9yICcke1NOU19DRVJUSUZJQ0FURV9IT1NUfSdgKTtcbiAgICB9XG5cbiAgICAvLyBDaGVjayB2YWxpZGl0eSB0aW1lc1xuICAgIGlmIChjdXJyVGltZSA8IG5ldyBEYXRlKGNlcnRpZmljYXRlLnZhbGlkRnJvbSkuZ2V0VGltZSgpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDZXJ0aWZpY2F0ZSBub3QgdmFsaWQgeWV0XCIpO1xuICAgIH1cbiAgICBpZiAobmV3IERhdGUoY2VydGlmaWNhdGUudmFsaWRUbykuZ2V0VGltZSgpIDwgY3VyclRpbWUpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkNlcnRpZmljYXRlIGV4cGlyZWRcIik7XG4gICAgfVxuXG4gICAgdGhpcy4jY2FjaGVkQ2VydGlmaWNhdGVzLnNldCh1cmwsIGNlcnRpZmljYXRlKTtcbiAgICByZXR1cm4gY2VydGlmaWNhdGU7XG4gIH1cbn1cbiJdfQ==