import { z } from "zod/mini";
import type { components } from "./schema";

type OrgEventDiscriminants = components["schemas"]["OrgEventDiscriminants"];
type BillingEvent = components["schemas"]["BillingEvent"];
type MemberRole = components["schemas"]["MemberRole"];
type OperationKind = components["schemas"]["OperationKind"];
type KeyType = components["schemas"]["KeyType"];

const schemaString = <T extends string>() => z.custom<T>((val) => typeof val === "string");

const baseFields = {
  /** The type of org event. */
  event: z.string(),
  /** UUID uniquely identifying this event across all events. */
  event_id: z.string(),
  /** The org in which this event occurred. */
  org_id: z.string(),
  /** ID of the HTTP request that triggered this event (one request can trigger multiple events). */
  request_id: z.string(),
  /** Timestamp of when the event was logged, formatted like YYYY-MM-DD HH:MM:SS.NNNNNNNNN */
  time: z.string(),
  /** ID of the user or role that triggered the event; absent for unauthenticated endpoints. */
  triggered_by: z.nullable(z.string()),
};

export const auditLogEntrySchema = z.discriminatedUnion("event", [
  z.object({
    ...baseFields,
    event: z.literal("Billing"),
    kind: schemaString<BillingEvent>(),
    user_id: z.optional(z.string()),
    role_id: z.optional(z.string()),
    key_id: z.optional(z.string()),
  }),
  z.object({
    ...baseFields,
    event: z.literal("Response"),
    kind: schemaString<BillingEvent>(),
    status: z.coerce.number(),
    duration_ms: z.coerce.number(),
  }),
  z.object({
    ...baseFields,
    event: z.literal("OidcAuth"),
    issuer: z.string(),
    membership: schemaString<MemberRole>(),
    email: z.optional(z.string()),
    username: z.optional(z.string()),
    scopes: z.array(z.string()),
  }),
  z.object({
    ...baseFields,
    event: z.literal("Signed"),
    kind: schemaString<OperationKind>(),
    key_type: schemaString<KeyType>(),
    key_id: z.string(),
  }),
  z.object({
    ...baseFields,
    event: z.literal("BabylonEotsConcurrentSigning"),
    key_id: z.string(),
    chain_id: z.string(),
    prev_block_height: z.coerce.number(),
    prev_signing_hash: z.string(),
    req_block_height: z.coerce.number(),
    req_signing_hash: z.string(),
  }),
  z.object({
    ...baseFields,
    event: z.literal("Eth2ConcurrentAttestationSigning"),
    key_id: z.string(),
  }),
  z.object({
    ...baseFields,
    event: z.literal("Eth2ConcurrentBlockSigning"),
    key_id: z.string(),
  }),
  z.object({
    ...baseFields,
    event: z.literal("Eth2InvalidBlockProposerSlotTooLow"),
    slot: z.coerce.number(),
    signing_root: z.string(),
    last_slot: z.coerce.number(),
    last_signing_root: z.string(),
    enforced: z.coerce.boolean(),
  }),
  z.object({
    ...baseFields,
    event: z.literal("Eth2InvalidAttestationSourceEpochTooLow"),
    source_epoch: z.coerce.number(),
    signing_root: z.string(),
    last_target_epoch: z.coerce.number(),
    last_signing_root: z.string(),
    enforced: z.coerce.boolean(),
  }),
  z.object({
    ...baseFields,
    event: z.literal("Eth2InvalidAttestationTargetEpochTooLow"),
    target_epoch: z.coerce.number(),
    signing_root: z.string(),
    last_target_epoch: z.coerce.number(),
    last_signing_root: z.string(),
    enforced: z.coerce.boolean(),
  }),
  z.object({
    ...baseFields,
    event: z.literal("Eth2Unstake"),
    key_id: z.string(),
    validator_index: z.coerce.number(),
    daily_unstake_count: z.coerce.number(),
  }),
  z.object({
    ...baseFields,
    event: z.literal("Eth2ExceededMaxUnstake"),
    max: z.coerce.number(),
    date: z.string(),
  }),
  z.object({
    ...baseFields,
    event: z.literal("KeyCreated"),
    key_type: schemaString<KeyType>(),
    owner_id: z.string(),
    count: z.coerce.number(),
  }),
  z.object({
    ...baseFields,
    event: z.literal("MfaApproved"),
    mfa_id: z.string(),
    meets_approval_criteria: z.coerce.boolean(),
  }),
  z.object({
    ...baseFields,
    event: z.literal("MfaRejected"),
    mfa_id: z.string(),
  }),
  z.object({
    ...baseFields,
    event: z.literal("PolicyChanged"),
  }),
  z.object({
    ...baseFields,
    event: z.literal("TendermintConcurrentSigning"),
    key_id: z.string(),
    chain_id: z.string(),
    last_state: z.string(),
    current_state: z.string(),
  }),
  z.object({
    ...baseFields,
    event: z.literal("InvitationCreated"),
    email: z.string(),
    role: z.string(),
  }),
  z.object({
    ...baseFields,
    event: z.literal("InvitationCanceled"),
    email: z.string(),
  }),
  z.object({
    ...baseFields,
    event: z.literal("UserExportInit"),
    key_id: z.string(),
    valid_epoch: z.coerce.number(),
  }),
  z.object({
    ...baseFields,
    event: z.literal("UserExportComplete"),
    key_id: z.string(),
  }),
  z.object({
    ...baseFields,
    event: z.literal("WasmPolicyExecuted"),
    source: z.string(),
    key_id: z.optional(z.string()),
    policy: z.string(),
    policy_hash: z.string(),
    stdout: z.string(),
    stderr: z.string(),
    response: z.string(),
    reason: z.optional(z.string()),
    error: z.optional(z.string()),
  }),
]);

export type AuditLogEntry = z.infer<typeof auditLogEntrySchema>;

// Compile-time check: errors if a variant is added to OrgEventDiscriminants but not handled here.
type _AllVariantsCovered = [OrgEventDiscriminants] extends [AuditLogEntry["event"]]
  ? [AuditLogEntry["event"]] extends [OrgEventDiscriminants]
    ? true
    : never
  : never;
const _allVariantsCovered: _AllVariantsCovered = true;
void _allVariantsCovered;
