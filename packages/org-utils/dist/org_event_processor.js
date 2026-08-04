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
import { X509Certificate, createVerify } from "crypto";
import { envs } from "@cubist-labs/cubesigner-sdk";
// URLs that are safe to retrieve certificates from
const SNS_CERTIFICATE_URL_HOSTS = ["sns.us-east-1.amazonaws.com"];
const SNS_CERTIFICATE_HOST = "sns.amazonaws.com";
/** A utility for processing org event messages */
export class OrgEventProcessor {
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
            __classPrivateFieldSet(this, _OrgEventProcessor_topicArn, envs[env].OrgEventsTopicArn, "f");
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
    __classPrivateFieldGet(this, _OrgEventProcessor_cachedCertificates, "f").set(url, certificate);
    return certificate;
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3JnX2V2ZW50X3Byb2Nlc3Nvci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9vcmdfZXZlbnRfcHJvY2Vzc29yLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQUFBLE9BQU8sRUFBRSxlQUFlLEVBQUUsWUFBWSxFQUFFLE1BQU0sUUFBUSxDQUFDO0FBRXZELE9BQU8sRUFBRSxJQUFJLEVBQUUsTUFBTSw0QkFBNEIsQ0FBQztBQUVsRCxtREFBbUQ7QUFDbkQsTUFBTSx5QkFBeUIsR0FBRyxDQUFDLDZCQUE2QixDQUFDLENBQUM7QUFFbEUsTUFBTSxvQkFBb0IsR0FBRyxtQkFBbUIsQ0FBQztBQXNDakQsa0RBQWtEO0FBQ2xELE1BQU0sT0FBTyxpQkFBaUI7SUFLNUI7Ozs7O09BS0c7SUFDSCxZQUFZLEtBQWEsRUFBRSxPQUFrQzs7UUFWcEQsOENBQWtCO1FBQ2xCLDJDQUFlO1FBQ3hCLHdEQUErQztRQVM3QyxNQUFNLEdBQUcsR0FBRyxPQUFPLEVBQUUsR0FBRyxJQUFJLE1BQU0sQ0FBQztRQUNuQyxJQUFJLE9BQU8sR0FBRyxLQUFLLFFBQVEsRUFBRSxDQUFDO1lBQzVCLHVCQUFBLElBQUksK0JBQWEsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLGlCQUFpQixNQUFBLENBQUM7UUFDL0MsQ0FBQzthQUFNLENBQUM7WUFDTix1QkFBQSxJQUFJLCtCQUFhLEdBQUcsQ0FBQyxpQkFBaUIsTUFBQSxDQUFDO1FBQ3pDLENBQUM7UUFDRCx1QkFBQSxJQUFJLDRCQUFVLEtBQUssTUFBQSxDQUFDO1FBQ3BCLHVCQUFBLElBQUkseUNBQXVCLElBQUksR0FBRyxFQUFFLE1BQUEsQ0FBQztJQUN2QyxDQUFDO0lBRUQ7Ozs7O09BS0c7SUFDSCxLQUFLLENBQUMsWUFBWSxDQUFDLE9BQW1CO1FBQ3BDLHNCQUFzQjtRQUN0QixJQUFJLE9BQU8sQ0FBQyxRQUFRLEtBQUssdUJBQUEsSUFBSSxtQ0FBVSxFQUFFLENBQUM7WUFDeEMs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QU0sSUFBSSxLQUFLLENBQUMsMkJBQTJCLENBQUMsQ0FBQztJQUMvQyxDQUFDO0lBQ0QsSUFBSSxJQUFJLElBQUksQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLENBQUMsT0FBTyxFQUFFLEdBQUcsUUFBUSxFQUFFLENBQUM7UUFDdkQsTUFBTSxJQUFJLEtBQUssQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO0lBQ3pDLENBQUM7SUFFRCx1QkFBQSxJQUFJLDZDQUFvQixDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsV0FBVyxDQUFDLENBQUM7SUFDL0MsT0FBTyxXQUFXLENBQUM7QUFDckIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFg1MDlDZXJ0aWZpY2F0ZSwgY3JlYXRlVmVyaWZ5IH0gZnJvbSBcImNyeXB0b1wiO1xuaW1wb3J0IHR5cGUgeyBFbnZJbnRlcmZhY2UsIEVudmlyb25tZW50IH0gZnJvbSBcIkBjdWJpc3QtZGV2L2N1YmVzaWduZXItc2RrXCI7XG5pbXBvcnQgeyBlbnZzIH0gZnJvbSBcIkBjdWJpc3QtZGV2L2N1YmVzaWduZXItc2RrXCI7XG5cbi8vIFVSTHMgdGhhdCBhcmUgc2FmZSB0byByZXRyaWV2ZSBjZXJ0aWZpY2F0ZXMgZnJvbVxuY29uc3QgU05TX0NFUlRJRklDQVRFX1VSTF9IT1NUUyA9IFtcInNucy51cy1lYXN0LTEuYW1hem9uYXdzLmNvbVwiXTtcblxuY29uc3QgU05TX0NFUlRJRklDQVRFX0hPU1QgPSBcInNucy5hbWF6b25hd3MuY29tXCI7XG5cbi8qKiBUaGUgY29tbW9uIGZpZWxkcyBvZiBTTlMgbWVzc2FnZXMgKi9cbmV4cG9ydCBpbnRlcmZhY2UgU25zTWVzc2FnZSB7XG4gIFR5cGU6IHN0cmluZztcbiAgTWVzc2FnZUlkOiBzdHJpbmc7XG4gIFRvcGljQXJuOiBzdHJpbmc7XG4gIE1lc3NhZ2U6IHN0cmluZztcbiAgVGltZXN0YW1wOiBzdHJpbmc7XG4gIFNpZ25hdHVyZVZlcnNpb246IHN0cmluZztcbiAgU2lnbmF0dXJlOiBzdHJpbmc7XG4gIFNpZ25pbmdDZXJ0VVJMOiBzdHJpbmc7XG59XG5cbi8qKiBUaGUgZm9ybWF0IG9mIGEgc3Vic2NyaXB0aW9uIGNvbmZpcm1hdGlvbiBzZW50IGJ5IFNOUyAqL1xuZXhwb3J0IGludGVyZmFjZSBTdWJzY3JpcHRpb25Db25maXJtYXRpb25NZXNzYWdlIGV4dGVuZHMgU25zTWVzc2FnZSB7XG4gIFRva2VuOiBzdHJpbmc7XG4gIFN1YnNjcmliZVVSTDogc3RyaW5nO1xufVxuXG4vKiogQ29tbW9uIGZpZWxkcyBmb3IgYW4gb3JnIGV2ZW50ICovXG5leHBvcnQgaW50ZXJmYWNlIE9yZ0V2ZW50QmFzZSB7XG4gIG9yZzogc3RyaW5nO1xuICB1dGNfdGltZXN0YW1wOiBudW1iZXI7XG4gIG9yZ19ldmVudDogc3RyaW5nO1xufVxuXG4vKiogVGhlIGZvcm1hdCBvZiBhbiBldmVudCBtZXNzYWdlIHNlbnQgYnkgU05TICovXG5leHBvcnQgaW50ZXJmYWNlIE9yZ0V2ZW50TWVzc2FnZSBleHRlbmRzIFNuc01lc3NhZ2Uge1xuICBTdWJqZWN0Pzogc3RyaW5nO1xuICBVbnN1YnNjcmliZVVSTDogc3RyaW5nO1xufVxuXG4vKiogT3B0aW9ucyBmb3IgdGhlIHByb2Nlc3NvciAqL1xuZXhwb3J0IGludGVyZmFjZSBPcmdFdmVudFByb2Nlc3Nvck9wdGlvbnMge1xuICBlbnY6IEVudmlyb25tZW50IHwgRW52SW50ZXJmYWNlO1xufVxuXG4vKiogQSB1dGlsaXR5IGZvciBwcm9jZXNzaW5nIG9yZyBldmVudCBtZXNzYWdlcyAqL1xuZXhwb3J0IGNsYXNzIE9yZ0V2ZW50UHJvY2Vzc29yIHtcbiAgcmVhZG9ubHkgI3RvcGljQXJuOiBzdHJpbmc7XG4gIHJlYWRvbmx5ICNvcmdJZDogc3RyaW5nO1xuICAjY2FjaGVkQ2VydGlmaWNhdGVzOiBNYXA8VVJMLCBYNTA5Q2VydGlmaWNhdGU+O1xuXG4gIC8qKlxuICAgKiBDb25zdHJ1Y3Rvci5cbiAgICpcbiAgICogQHBhcmFtIG9yZ0lkIFRoZSBvcmcgaWRcbiAgICogQHBhcmFtIG9wdGlvbnMgQWRkaXRpb25hbCBvcHRpb25zIGZvciB0aGUgcHJvY2Vzc29yXG4gICAqL1xuICBjb25zdHJ1Y3RvcihvcmdJZDogc3RyaW5nLCBvcHRpb25zPzogT3JnRXZlbnRQcm9jZXNzb3JPcHRpb25zKSB7XG4gICAgY29uc3QgZW52ID0gb3B0aW9ucz8uZW52ID8/IFwicHJvZFwiO1xuICAgIGlmICh0eXBlb2YgZW52ID09PSBcInN0cmluZ1wiKSB7XG4gICAgICB0aGlzLiN0b3BpY0FybiA9IGVudnNbZW52XS5PcmdFdmVudHNUb3BpY0FybjtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy4jdG9waWNBcm4gPSBlbnYuT3JnRXZlbnRzVG9waWNBcm47XG4gICAgfVxuICAgIHRoaXMuI29yZ0lkID0gb3JnSWQ7XG4gICAgdGhpcy4jY2FjaGVkQ2VydGlmaWNhdGVzID0gbmV3IE1hcCgpO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrcyBhbiBTTlMgbWVzc2FnZSBhbmQgaXRzIHNpZ25hdHVyZS4gVGhyb3dzIGFuIGVycm9yIGlmIHRoZSBtZXNzYWdlXG4gICAqIGludmFsaWQgb3IgdGhlIHNpZ25hdHVyZSBpcyBpbnZhbGlkLlxuICAgKlxuICAgKiBAcGFyYW0gbWVzc2FnZSBUaGUgU05TIG1lc3NhZ2UgdG8gY2hlY2tcbiAgICovXG4gIGFzeW5jIGNoZWNrTWVzc2FnZShtZXNzYWdlOiBTbnNNZXNzYWdlKSB7XG4gICAgLy8gQ2hlY2sgdGhlIHRvcGljIEFSTlxuICAgIGlmIChtZXNzYWdlLlRvcGljQXJuICE9PSB0aGlzLiN0b3BpY0Fybikge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBFeHBlY3RlZCB0b3BpYyBBUk4gJyR7dGhpcy4jdG9waWNBcm59JywgZm91bmQgJyR7bWVzc2FnZS5Ub3BpY0Fybn0nYCk7XG4gICAgfVxuXG4gICAgLy8gQm90aCBzdWJzY3JpcHRpb24gY29uZmlybWF0aW9ucyBhbmQgb3JnIGV2ZW50IG1lc3NhZ2VzIHNob3VsZCBoYXZlIG5vIHN1YmplY3RcbiAgICBpZiAoXCJTdWJqZWN0XCIgaW4gbWVzc2FnZSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRXhwZWN0ZWQgYSBtZXNzYWdlIHdpdGhvdXQgYSBzdWJqZWN0XCIpO1xuICAgIH1cblxuICAgIC8vIFRoZSBvcmcgZXZlbnRzIHRvcGljIHVzZXMgc2lnbmF0dXJlIHZlcnNpb24gMiAoU0hBMjU2KVxuICAgIGlmIChtZXNzYWdlLlNpZ25hdHVyZVZlcnNpb24gIT09IFwiMlwiKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJFeHBlY3RlZCBzaWduYXR1cmUgdmVyc2lvbiAyXCIpO1xuICAgIH1cblxuICAgIC8vIFJldHJpZXZlIHRoZSBjZXJ0aWZpY2F0ZSBhbmQgc2FuaXR5IGNoZWNrIGl0XG4gICAgY29uc3QgY2VydGlmaWNhdGUgPSBhd2FpdCB0aGlzLiNmZXRjaEFuZFZhbGlkYXRlQ2VydGlmaWNhdGUobmV3IFVSTChtZXNzYWdlLlNpZ25pbmdDZXJ0VVJMKSk7XG5cbiAgICAvLyBFeHRyYWN0IGZpZWxkcyBzcGVjaWZpYyB0byBzdWJzY3JpcHRpb24gY29uZmlybWF0aW9uc1xuICAgIGNvbnN0IHN1YnNjcmliZVVybCA9IChtZXNzYWdlIGFzIFN1YnNjcmlwdGlvbkNvbmZpcm1hdGlvbk1lc3NhZ2UpLlN1YnNjcmliZVVSTDtcbiAgICBjb25zdCB0b2tlbiA9IChtZXNzYWdlIGFzIFN1YnNjcmlwdGlvbkNvbmZpcm1hdGlvbk1lc3NhZ2UpLlRva2VuO1xuXG4gICAgLy8gQ2hlY2sgdGhlIHNpZ25hdHVyZVxuICAgIGNvbnN0IGZpZWxkcyA9IFtcIk1lc3NhZ2VcIiwgbWVzc2FnZS5NZXNzYWdlLCBcIk1lc3NhZ2VJZFwiLCBtZXNzYWdlLk1lc3NhZ2VJZF1cbiAgICAgIC5jb25jYXQoc3Vic2NyaWJlVXJsICE9PSB1bmRlZmluZWQgPyBbXCJTdWJzY3JpYmVVUkxcIiwgc3Vic2NyaWJlVXJsXSA6IFtdKVxuICAgICAgLmNvbmNhdChbXCJUaW1lc3RhbXBcIiwgbWVzc2FnZS5UaW1lc3RhbXBdKVxuICAgICAgLmNvbmNhdCh0b2tlbiAhPT0gdW5kZWZpbmVkID8gW1wiVG9rZW5cIiwgdG9rZW5dIDogW10pXG4gICAgICAuY29uY2F0KFtcIlRvcGljQXJuXCIsIG1lc3NhZ2UuVG9waWNBcm4sIFwiVHlwZVwiLCBtZXNzYWdlLlR5cGVdKTtcbiAgICBjb25zdCB2ZXJpZnkgPSBjcmVhdGVWZXJpZnkoXCJSU0EtU0hBMjU2XCIpO1xuICAgIHZlcmlmeS51cGRhdGUoZmllbGRzLmpvaW4oXCJcXG5cIikgKyBcIlxcblwiKTtcbiAgICBjb25zdCBpc1ZhbGlkID0gdmVyaWZ5LnZlcmlmeShjZXJ0aWZpY2F0ZS5wdWJsaWNLZXksIG1lc3NhZ2UuU2lnbmF0dXJlLCBcImJhc2U2NFwiKTtcbiAgICBpZiAoIWlzVmFsaWQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIlRoZSBvcmcgZXZlbnQgaGFzIGFuIGludmFsaWQgc2lnbmF0dXJlXCIpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBQYXJzZSBhbiBvcmcgZXZlbnQgYW5kIGNoZWNrIGl0cyBzaWduYXR1cmUuIFRocm93cyBhbiBlcnJvciBpZiB0aGVcbiAgICogbWVzc2FnZSBpcyBub3QgYSB2YWxpZCBvcmcgZXZlbnQgb3IgdGhlIHNpZ25hdHVyZSBpcyBpbnZhbGlkLlxuICAgKlxuICAgKiBAcGFyYW0gbWVzc2FnZSBUaGUgb3JnIGV2ZW50IG1lc3NhZ2UgdG8gY2hlY2tcbiAgICogQHJldHVybnMgVGhlIG9yZyBldmVudFxuICAgKi9cbiAgYXN5bmMgcGFyc2UobWVzc2FnZTogT3JnRXZlbnRNZXNzYWdlKTogUHJvbWlzZTxPcmdFdmVudEJhc2U+IHtcbiAgICBhd2FpdCB0aGlzLmNoZWNrTWVzc2FnZShtZXNzYWdlKTtcblxuICAgIC8vIENoZWNrIHRoYXQgdGhlIGV2ZW50IGlzIGZvciB0aGUgZXhwZWN0ZWQgb3JnXG4gICAgY29uc3Qgb3JnRXZlbnQ6IE9yZ0V2ZW50QmFzZSA9IEpTT04ucGFyc2UobWVzc2FnZS5NZXNzYWdlKTtcbiAgICBpZiAob3JnRXZlbnQub3JnICE9PSB0aGlzLiNvcmdJZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBFeHBlY3RlZCBvcmcgdG8gYmUgJyR7dGhpcy4jb3JnSWR9JywgZm91bmQgJyR7b3JnRXZlbnQub3JnfSdgKTtcbiAgICB9XG5cbiAgICByZXR1cm4gb3JnRXZlbnQ7XG4gIH1cblxuICAvKipcbiAgICogRmV0Y2hlcyBhIGNlcnRpZmljYXRlIGZyb20gYSBnaXZlbiBVUkwgb3IgZnJvbSB0aGUgY2VydGlmaWNhdGUgY2FjaGUuXG4gICAqIFRocm93cyBhbiBlcnJvciBpZiB0aGUgVVJMIGRvZXMgbm90IGNvcnJlc3BvbmQgdG8gYW4gU05TIGNlcnRpZmljYXRlIFVSTC5cbiAgICpcbiAgICogTm90ZTogSWRlYWxseSwgdGhpcyBtZXRob2Qgd291bGQgdmVyaWZ5IHRoZSBjZXJ0aWZpY2F0ZSBjaGFpbiwgYnV0IHRoZXJlXG4gICAqIGlzIG5vIG9idmlvdXMgY2hhaW4uIEluc3RlYWQsIHRoaXMgbWV0aG9kIG9ubHkgZmV0Y2hlcyBjZXJ0aWZpY2F0ZXMgZnJvbVxuICAgKiBhIHNtYWxsIHNldCBvZiBhbGxvd2xpc3RlZCBVUkxzLlxuICAgKlxuICAgKiBAcGFyYW0gdXJsIFRoZSBVUkwgb2YgdGhlIGNlcnRpZmljYXRlXG4gICAqIEByZXR1cm5zIFRoZSBjZXJ0aWZpY2F0ZVxuICAgKi9cbiAgYXN5bmMgI2ZldGNoQW5kVmFsaWRhdGVDZXJ0aWZpY2F0ZSh1cmw6IFVSTCk6IFByb21pc2U8WDUwOUNlcnRpZmljYXRlPiB7XG4gICAgY29uc3QgY3VyclRpbWUgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgICBjb25zdCBjYWNoZWRDZXJ0aWZpY2F0ZSA9IHRoaXMuI2NhY2hlZENlcnRpZmljYXRlcy5nZXQodXJsKTtcbiAgICBpZiAoY2FjaGVkQ2VydGlmaWNhdGUgJiYgY3VyclRpbWUgPCBuZXcgRGF0ZShjYWNoZWRDZXJ0aWZpY2F0ZS52YWxpZFRvKS5nZXRUaW1lKCkpIHtcbiAgICAgIHJldHVybiBjYWNoZWRDZXJ0aWZpY2F0ZTtcbiAgICB9XG5cbiAgICAvLyBPbmx5IGZldGNoIGNlcnRpZmljYXRlcyBmcm9tIEhUVFBTIFVSTHNcbiAgICBpZiAodXJsLnByb3RvY29sICE9PSBcImh0dHBzOlwiKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJFeHBlY3RlZCBzaWduaW5nIGNlcnRpZmljYXRlIFVSTCB0byB1c2UgSFRUUFNcIik7XG4gICAgfVxuXG4gICAgLy8gT25seSBmZXRjaCBjZXJ0aWZpY2F0ZSBVUkxzIGZvciBTTlNcbiAgICBpZiAoU05TX0NFUlRJRklDQVRFX1VSTF9IT1NUUy5pbmRleE9mKHVybC5ob3N0KSA9PT0gLTEpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkV4cGVjdGVkIHNpZ25pbmcgY2VydGlmaWNhdGUgVVJMIGZvciBTTlMgaW4gdXMtZWFzdC0xXCIpO1xuICAgIH1cblxuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2godXJsKTtcbiAgICBpZiAoIXJlc3BvbnNlLm9rKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYFVuYWJsZSB0byBkb3dubG9hZCBjZXJ0aWZpY2F0ZS4gU3RhdHVzOiAke3Jlc3BvbnNlLnN0YXR1c31gKTtcbiAgICB9XG4gICAgY29uc3QgYmxvYiA9IGF3YWl0IHJlc3BvbnNlLmJsb2IoKTtcbiAgICBjb25zdCBjZXJ0aWZpY2F0ZSA9IG5ldyBYNTA5Q2VydGlmaWNhdGUoYXdhaXQgYmxvYi50ZXh0KCkpO1xuICAgIGlmICghY2VydGlmaWNhdGUuY2hlY2tIb3N0KFNOU19DRVJUSUZJQ0FURV9IT1NUKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBFeHBlY3RlZCBjZXJ0aWZpY2F0ZSB0byBiZSBmb3IgJyR7U05TX0NFUlRJRklDQVRFX0hPU1R9J2ApO1xuICAgIH1cblxuICAgIC8vIENoZWNrIHZhbGlkaXR5IHRpbWVzXG4gICAgaWYgKGN1cnJUaW1lIDwgbmV3IERhdGUoY2VydGlmaWNhdGUudmFsaWRGcm9tKS5nZXRUaW1lKCkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkNlcnRpZmljYXRlIG5vdCB2YWxpZCB5ZXRcIik7XG4gICAgfVxuICAgIGlmIChuZXcgRGF0ZShjZXJ0aWZpY2F0ZS52YWxpZFRvKS5nZXRUaW1lKCkgPCBjdXJyVGltZSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ2VydGlmaWNhdGUgZXhwaXJlZFwiKTtcbiAgICB9XG5cbiAgICB0aGlzLiNjYWNoZWRDZXJ0aWZpY2F0ZXMuc2V0KHVybCwgY2VydGlmaWNhdGUpO1xuICAgIHJldHVybiBjZXJ0aWZpY2F0ZTtcbiAgfVxufVxuIl19