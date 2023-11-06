import { Sign, SignResponse, Role } from ".";
/**
 * Wrapper around @type {Sign} and @type {Role} that adds a **single-approval**
 * multi-factor authorization on top of all sign operations.
 */
export declare class Mfa {
    #private;
    /**
     * Auto approve a sign operation that requires MFA.
     *
     * @param signFn The sign operation to call
     * @param {T} args Arguments to the sign operation
     * @return {Promise<U>} The result of the sign operation.
     */
    autoApprove<T extends Array<any>, U>(// eslint-disable-line @typescript-eslint/no-explicit-any
    signFn: (...args: T) => Promise<SignResponse<U>>, ...args: T): Promise<U>;
    /**
     * Constructor.
     * @param {Sign} sign Sign instance to use for signing
     * @param {Role} role Role instance to use for MFA approval
     */
    constructor(sign: Sign, role: Role);
}
