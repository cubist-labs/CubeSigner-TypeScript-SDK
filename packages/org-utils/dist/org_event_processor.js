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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3JnX2V2ZW50X3Byb2Nlc3Nvci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9vcmdfZXZlbnRfcHJvY2Vzc29yLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7OztBQUFBLG1DQUF1RDtBQUV2RCxnRUFBbUQ7QUFFbkQsbURBQW1EO0FBQ25ELE1BQU0seUJBQXlCLEdBQUcsQ0FBQyw2QkFBNkIsQ0FBQyxDQUFDO0FBRWxFLE1BQU0sb0JBQW9CLEdBQUcsbUJBQW1CLENBQUM7QUFzQ2pELGtEQUFrRDtBQUNsRCxNQUFhLGlCQUFpQjtJQUs1Qjs7Ozs7T0FLRztJQUNILFlBQVksS0FBYSxFQUFFLE9BQWtDOztRQVZwRCw4Q0FBa0I7UUFDbEIsMkNBQWU7UUFDeEIsd0RBQStDO1FBUzdDLE1BQU0sR0FBRyxHQUFHLE9BQU8sRUFBRSxHQUFHLElBQUksTUFBTSxDQUFDO1FBQ25DLElBQUksT0FBTyxHQUFHLEtBQUssUUFBUSxFQUFFLENBQUM7WUFDNUIsdUJBQUEsSUFBSSwrQkFBYSxxQkFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLGlCQUFpQixNQUFBLENBQUM7UUFDL0MsQ0FBQzthQUFNLENBQUM7WUFDTix1QkFBQSxJQUFJLCtCQUFhLEdBQUcsQ0FBQyxpQkFBaUIsTUFBQSxDQUFDO1FBQ3pDLENBQUM7UUFDRCx1QkFBQSxJQUFJLDRCQUFVLEtBQUssTUFBQSxDQUFDO1FBQ3BCLHVCQUFBLElBQUkseUNBQXVCLElBQUksR0FBRyxFQUFFLE1BQUEsQ0FBQztJQUN2QyxDQUFDO0lBRUQ7Ozs7O09BS0c7SUFDSCxLQUFLLENBQUMsWUFBWSxDQUFDLE9BQW1CO1FBQ3BDLHNCQUFzQjtRQUN0QixJQUFJLE9BQU8sQ0FBQyxRQUFRLEtBQUssdUJBQUEsSUFBSSxtQ0FBVSxFQUFFLENBQUM7WUFDeEMsTUFBTSxJQUFJLEtBQUssQ0FBQyx1QkFBdUIsdUJBQUEsSUFBSSxtQ0FBVSxhQUFhLE9BQU8sQ0FBQyxRQUFRLEdBQUcs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RCxJQUFJLElBQUksSUFBSSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQyxPQUFPLEVBQUUsR0FBRyxRQUFRLEVBQUUsQ0FBQztRQUN2RCxNQUFNLElBQUksS0FBSyxDQUFDLHFCQUFxQixDQUFDLENBQUM7SUFDekMsQ0FBQztJQUVELHVCQUFBLElBQUksNkNBQW9CLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxXQUFXLENBQUMsQ0FBQztJQUMvQyxPQUFPLFdBQVcsQ0FBQztBQUNyQixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgWDUwOUNlcnRpZmljYXRlLCBjcmVhdGVWZXJpZnkgfSBmcm9tIFwiY3J5cHRvXCI7XG5pbXBvcnQgdHlwZSB7IEVudkludGVyZmFjZSwgRW52aXJvbm1lbnQgfSBmcm9tIFwiQGN1YmlzdC1sYWJzL2N1YmVzaWduZXItc2RrXCI7XG5pbXBvcnQgeyBlbnZzIH0gZnJvbSBcIkBjdWJpc3QtbGFicy9jdWJlc2lnbmVyLXNka1wiO1xuXG4vLyBVUkxzIHRoYXQgYXJlIHNhZmUgdG8gcmV0cmlldmUgY2VydGlmaWNhdGVzIGZyb21cbmNvbnN0IFNOU19DRVJUSUZJQ0FURV9VUkxfSE9TVFMgPSBbXCJzbnMudXMtZWFzdC0xLmFtYXpvbmF3cy5jb21cIl07XG5cbmNvbnN0IFNOU19DRVJUSUZJQ0FURV9IT1NUID0gXCJzbnMuYW1hem9uYXdzLmNvbVwiO1xuXG4vKiogVGhlIGNvbW1vbiBmaWVsZHMgb2YgU05TIG1lc3NhZ2VzICovXG5leHBvcnQgaW50ZXJmYWNlIFNuc01lc3NhZ2Uge1xuICBUeXBlOiBzdHJpbmc7XG4gIE1lc3NhZ2VJZDogc3RyaW5nO1xuICBUb3BpY0Fybjogc3RyaW5nO1xuICBNZXNzYWdlOiBzdHJpbmc7XG4gIFRpbWVzdGFtcDogc3RyaW5nO1xuICBTaWduYXR1cmVWZXJzaW9uOiBzdHJpbmc7XG4gIFNpZ25hdHVyZTogc3RyaW5nO1xuICBTaWduaW5nQ2VydFVSTDogc3RyaW5nO1xufVxuXG4vKiogVGhlIGZvcm1hdCBvZiBhIHN1YnNjcmlwdGlvbiBjb25maXJtYXRpb24gc2VudCBieSBTTlMgKi9cbmV4cG9ydCBpbnRlcmZhY2UgU3Vic2NyaXB0aW9uQ29uZmlybWF0aW9uTWVzc2FnZSBleHRlbmRzIFNuc01lc3NhZ2Uge1xuICBUb2tlbjogc3RyaW5nO1xuICBTdWJzY3JpYmVVUkw6IHN0cmluZztcbn1cblxuLyoqIENvbW1vbiBmaWVsZHMgZm9yIGFuIG9yZyBldmVudCAqL1xuZXhwb3J0IGludGVyZmFjZSBPcmdFdmVudEJhc2Uge1xuICBvcmc6IHN0cmluZztcbiAgdXRjX3RpbWVzdGFtcDogbnVtYmVyO1xuICBvcmdfZXZlbnQ6IHN0cmluZztcbn1cblxuLyoqIFRoZSBmb3JtYXQgb2YgYW4gZXZlbnQgbWVzc2FnZSBzZW50IGJ5IFNOUyAqL1xuZXhwb3J0IGludGVyZmFjZSBPcmdFdmVudE1lc3NhZ2UgZXh0ZW5kcyBTbnNNZXNzYWdlIHtcbiAgU3ViamVjdD86IHN0cmluZztcbiAgVW5zdWJzY3JpYmVVUkw6IHN0cmluZztcbn1cblxuLyoqIE9wdGlvbnMgZm9yIHRoZSBwcm9jZXNzb3IgKi9cbmV4cG9ydCBpbnRlcmZhY2UgT3JnRXZlbnRQcm9jZXNzb3JPcHRpb25zIHtcbiAgZW52OiBFbnZpcm9ubWVudCB8IEVudkludGVyZmFjZTtcbn1cblxuLyoqIEEgdXRpbGl0eSBmb3IgcHJvY2Vzc2luZyBvcmcgZXZlbnQgbWVzc2FnZXMgKi9cbmV4cG9ydCBjbGFzcyBPcmdFdmVudFByb2Nlc3NvciB7XG4gIHJlYWRvbmx5ICN0b3BpY0Fybjogc3RyaW5nO1xuICByZWFkb25seSAjb3JnSWQ6IHN0cmluZztcbiAgI2NhY2hlZENlcnRpZmljYXRlczogTWFwPFVSTCwgWDUwOUNlcnRpZmljYXRlPjtcblxuICAvKipcbiAgICogQ29uc3RydWN0b3IuXG4gICAqXG4gICAqIEBwYXJhbSBvcmdJZCBUaGUgb3JnIGlkXG4gICAqIEBwYXJhbSBvcHRpb25zIEFkZGl0aW9uYWwgb3B0aW9ucyBmb3IgdGhlIHByb2Nlc3NvclxuICAgKi9cbiAgY29uc3RydWN0b3Iob3JnSWQ6IHN0cmluZywgb3B0aW9ucz86IE9yZ0V2ZW50UHJvY2Vzc29yT3B0aW9ucykge1xuICAgIGNvbnN0IGVudiA9IG9wdGlvbnM/LmVudiA/PyBcInByb2RcIjtcbiAgICBpZiAodHlwZW9mIGVudiA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgdGhpcy4jdG9waWNBcm4gPSBlbnZzW2Vudl0uT3JnRXZlbnRzVG9waWNBcm47XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuI3RvcGljQXJuID0gZW52Lk9yZ0V2ZW50c1RvcGljQXJuO1xuICAgIH1cbiAgICB0aGlzLiNvcmdJZCA9IG9yZ0lkO1xuICAgIHRoaXMuI2NhY2hlZENlcnRpZmljYXRlcyA9IG5ldyBNYXAoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVja3MgYW4gU05TIG1lc3NhZ2UgYW5kIGl0cyBzaWduYXR1cmUuIFRocm93cyBhbiBlcnJvciBpZiB0aGUgbWVzc2FnZVxuICAgKiBpbnZhbGlkIG9yIHRoZSBzaWduYXR1cmUgaXMgaW52YWxpZC5cbiAgICpcbiAgICogQHBhcmFtIG1lc3NhZ2UgVGhlIFNOUyBtZXNzYWdlIHRvIGNoZWNrXG4gICAqL1xuICBhc3luYyBjaGVja01lc3NhZ2UobWVzc2FnZTogU25zTWVzc2FnZSkge1xuICAgIC8vIENoZWNrIHRoZSB0b3BpYyBBUk5cbiAgICBpZiAobWVzc2FnZS5Ub3BpY0FybiAhPT0gdGhpcy4jdG9waWNBcm4pIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgRXhwZWN0ZWQgdG9waWMgQVJOICcke3RoaXMuI3RvcGljQXJufScsIGZvdW5kICcke21lc3NhZ2UuVG9waWNBcm59J2ApO1xuICAgIH1cblxuICAgIC8vIEJvdGggc3Vic2NyaXB0aW9uIGNvbmZpcm1hdGlvbnMgYW5kIG9yZyBldmVudCBtZXNzYWdlcyBzaG91bGQgaGF2ZSBubyBzdWJqZWN0XG4gICAgaWYgKFwiU3ViamVjdFwiIGluIG1lc3NhZ2UpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkV4cGVjdGVkIGEgbWVzc2FnZSB3aXRob3V0IGEgc3ViamVjdFwiKTtcbiAgICB9XG5cbiAgICAvLyBUaGUgb3JnIGV2ZW50cyB0b3BpYyB1c2VzIHNpZ25hdHVyZSB2ZXJzaW9uIDIgKFNIQTI1NilcbiAgICBpZiAobWVzc2FnZS5TaWduYXR1cmVWZXJzaW9uICE9PSBcIjJcIikge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRXhwZWN0ZWQgc2lnbmF0dXJlIHZlcnNpb24gMlwiKTtcbiAgICB9XG5cbiAgICAvLyBSZXRyaWV2ZSB0aGUgY2VydGlmaWNhdGUgYW5kIHNhbml0eSBjaGVjayBpdFxuICAgIGNvbnN0IGNlcnRpZmljYXRlID0gYXdhaXQgdGhpcy4jZmV0Y2hBbmRWYWxpZGF0ZUNlcnRpZmljYXRlKG5ldyBVUkwobWVzc2FnZS5TaWduaW5nQ2VydFVSTCkpO1xuXG4gICAgLy8gRXh0cmFjdCBmaWVsZHMgc3BlY2lmaWMgdG8gc3Vic2NyaXB0aW9uIGNvbmZpcm1hdGlvbnNcbiAgICBjb25zdCBzdWJzY3JpYmVVcmwgPSAobWVzc2FnZSBhcyBTdWJzY3JpcHRpb25Db25maXJtYXRpb25NZXNzYWdlKS5TdWJzY3JpYmVVUkw7XG4gICAgY29uc3QgdG9rZW4gPSAobWVzc2FnZSBhcyBTdWJzY3JpcHRpb25Db25maXJtYXRpb25NZXNzYWdlKS5Ub2tlbjtcblxuICAgIC8vIENoZWNrIHRoZSBzaWduYXR1cmVcbiAgICBjb25zdCBmaWVsZHMgPSBbXCJNZXNzYWdlXCIsIG1lc3NhZ2UuTWVzc2FnZSwgXCJNZXNzYWdlSWRcIiwgbWVzc2FnZS5NZXNzYWdlSWRdXG4gICAgICAuY29uY2F0KHN1YnNjcmliZVVybCAhPT0gdW5kZWZpbmVkID8gW1wiU3Vic2NyaWJlVVJMXCIsIHN1YnNjcmliZVVybF0gOiBbXSlcbiAgICAgIC5jb25jYXQoW1wiVGltZXN0YW1wXCIsIG1lc3NhZ2UuVGltZXN0YW1wXSlcbiAgICAgIC5jb25jYXQodG9rZW4gIT09IHVuZGVmaW5lZCA/IFtcIlRva2VuXCIsIHRva2VuXSA6IFtdKVxuICAgICAgLmNvbmNhdChbXCJUb3BpY0FyblwiLCBtZXNzYWdlLlRvcGljQXJuLCBcIlR5cGVcIiwgbWVzc2FnZS5UeXBlXSk7XG4gICAgY29uc3QgdmVyaWZ5ID0gY3JlYXRlVmVyaWZ5KFwiUlNBLVNIQTI1NlwiKTtcbiAgICB2ZXJpZnkudXBkYXRlKGZpZWxkcy5qb2luKFwiXFxuXCIpICsgXCJcXG5cIik7XG4gICAgY29uc3QgaXNWYWxpZCA9IHZlcmlmeS52ZXJpZnkoY2VydGlmaWNhdGUucHVibGljS2V5LCBtZXNzYWdlLlNpZ25hdHVyZSwgXCJiYXNlNjRcIik7XG4gICAgaWYgKCFpc1ZhbGlkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJUaGUgb3JnIGV2ZW50IGhhcyBhbiBpbnZhbGlkIHNpZ25hdHVyZVwiKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogUGFyc2UgYW4gb3JnIGV2ZW50IGFuZCBjaGVjayBpdHMgc2lnbmF0dXJlLiBUaHJvd3MgYW4gZXJyb3IgaWYgdGhlXG4gICAqIG1lc3NhZ2UgaXMgbm90IGEgdmFsaWQgb3JnIGV2ZW50IG9yIHRoZSBzaWduYXR1cmUgaXMgaW52YWxpZC5cbiAgICpcbiAgICogQHBhcmFtIG1lc3NhZ2UgVGhlIG9yZyBldmVudCBtZXNzYWdlIHRvIGNoZWNrXG4gICAqIEByZXR1cm5zIFRoZSBvcmcgZXZlbnRcbiAgICovXG4gIGFzeW5jIHBhcnNlKG1lc3NhZ2U6IE9yZ0V2ZW50TWVzc2FnZSk6IFByb21pc2U8T3JnRXZlbnRCYXNlPiB7XG4gICAgYXdhaXQgdGhpcy5jaGVja01lc3NhZ2UobWVzc2FnZSk7XG5cbiAgICAvLyBDaGVjayB0aGF0IHRoZSBldmVudCBpcyBmb3IgdGhlIGV4cGVjdGVkIG9yZ1xuICAgIGNvbnN0IG9yZ0V2ZW50OiBPcmdFdmVudEJhc2UgPSBKU09OLnBhcnNlKG1lc3NhZ2UuTWVzc2FnZSk7XG4gICAgaWYgKG9yZ0V2ZW50Lm9yZyAhPT0gdGhpcy4jb3JnSWQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgRXhwZWN0ZWQgb3JnIHRvIGJlICcke3RoaXMuI29yZ0lkfScsIGZvdW5kICcke29yZ0V2ZW50Lm9yZ30nYCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG9yZ0V2ZW50O1xuICB9XG5cbiAgLyoqXG4gICAqIEZldGNoZXMgYSBjZXJ0aWZpY2F0ZSBmcm9tIGEgZ2l2ZW4gVVJMIG9yIGZyb20gdGhlIGNlcnRpZmljYXRlIGNhY2hlLlxuICAgKiBUaHJvd3MgYW4gZXJyb3IgaWYgdGhlIFVSTCBkb2VzIG5vdCBjb3JyZXNwb25kIHRvIGFuIFNOUyBjZXJ0aWZpY2F0ZSBVUkwuXG4gICAqXG4gICAqIE5vdGU6IElkZWFsbHksIHRoaXMgbWV0aG9kIHdvdWxkIHZlcmlmeSB0aGUgY2VydGlmaWNhdGUgY2hhaW4sIGJ1dCB0aGVyZVxuICAgKiBpcyBubyBvYnZpb3VzIGNoYWluLiBJbnN0ZWFkLCB0aGlzIG1ldGhvZCBvbmx5IGZldGNoZXMgY2VydGlmaWNhdGVzIGZyb21cbiAgICogYSBzbWFsbCBzZXQgb2YgYWxsb3dsaXN0ZWQgVVJMcy5cbiAgICpcbiAgICogQHBhcmFtIHVybCBUaGUgVVJMIG9mIHRoZSBjZXJ0aWZpY2F0ZVxuICAgKiBAcmV0dXJucyBUaGUgY2VydGlmaWNhdGVcbiAgICovXG4gIGFzeW5jICNmZXRjaEFuZFZhbGlkYXRlQ2VydGlmaWNhdGUodXJsOiBVUkwpOiBQcm9taXNlPFg1MDlDZXJ0aWZpY2F0ZT4ge1xuICAgIGNvbnN0IGN1cnJUaW1lID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gICAgY29uc3QgY2FjaGVkQ2VydGlmaWNhdGUgPSB0aGlzLiNjYWNoZWRDZXJ0aWZpY2F0ZXMuZ2V0KHVybCk7XG4gICAgaWYgKGNhY2hlZENlcnRpZmljYXRlICYmIGN1cnJUaW1lIDwgbmV3IERhdGUoY2FjaGVkQ2VydGlmaWNhdGUudmFsaWRUbykuZ2V0VGltZSgpKSB7XG4gICAgICByZXR1cm4gY2FjaGVkQ2VydGlmaWNhdGU7XG4gICAgfVxuXG4gICAgLy8gT25seSBmZXRjaCBjZXJ0aWZpY2F0ZXMgZnJvbSBIVFRQUyBVUkxzXG4gICAgaWYgKHVybC5wcm90b2NvbCAhPT0gXCJodHRwczpcIikge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRXhwZWN0ZWQgc2lnbmluZyBjZXJ0aWZpY2F0ZSBVUkwgdG8gdXNlIEhUVFBTXCIpO1xuICAgIH1cblxuICAgIC8vIE9ubHkgZmV0Y2ggY2VydGlmaWNhdGUgVVJMcyBmb3IgU05TXG4gICAgaWYgKFNOU19DRVJUSUZJQ0FURV9VUkxfSE9TVFMuaW5kZXhPZih1cmwuaG9zdCkgPT09IC0xKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJFeHBlY3RlZCBzaWduaW5nIGNlcnRpZmljYXRlIFVSTCBmb3IgU05TIGluIHVzLWVhc3QtMVwiKTtcbiAgICB9XG5cbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoKHVybCk7XG4gICAgaWYgKCFyZXNwb25zZS5vaykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBVbmFibGUgdG8gZG93bmxvYWQgY2VydGlmaWNhdGUuIFN0YXR1czogJHtyZXNwb25zZS5zdGF0dXN9YCk7XG4gICAgfVxuICAgIGNvbnN0IGJsb2IgPSBhd2FpdCByZXNwb25zZS5ibG9iKCk7XG4gICAgY29uc3QgY2VydGlmaWNhdGUgPSBuZXcgWDUwOUNlcnRpZmljYXRlKGF3YWl0IGJsb2IudGV4dCgpKTtcbiAgICBpZiAoIWNlcnRpZmljYXRlLmNoZWNrSG9zdChTTlNfQ0VSVElGSUNBVEVfSE9TVCkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgRXhwZWN0ZWQgY2VydGlmaWNhdGUgdG8gYmUgZm9yICcke1NOU19DRVJUSUZJQ0FURV9IT1NUfSdgKTtcbiAgICB9XG5cbiAgICAvLyBDaGVjayB2YWxpZGl0eSB0aW1lc1xuICAgIGlmIChjdXJyVGltZSA8IG5ldyBEYXRlKGNlcnRpZmljYXRlLnZhbGlkRnJvbSkuZ2V0VGltZSgpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDZXJ0aWZpY2F0ZSBub3QgdmFsaWQgeWV0XCIpO1xuICAgIH1cbiAgICBpZiAobmV3IERhdGUoY2VydGlmaWNhdGUudmFsaWRUbykuZ2V0VGltZSgpIDwgY3VyclRpbWUpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkNlcnRpZmljYXRlIGV4cGlyZWRcIik7XG4gICAgfVxuXG4gICAgdGhpcy4jY2FjaGVkQ2VydGlmaWNhdGVzLnNldCh1cmwsIGNlcnRpZmljYXRlKTtcbiAgICByZXR1cm4gY2VydGlmaWNhdGU7XG4gIH1cbn1cbiJdfQ==