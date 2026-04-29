import type { Ace, AceAttribute } from "./acl";
import type { BucketAction, schemas } from "./schema_types";

/** Access control entry for policy buckets */
export type BucketAce = Ace<
  BucketAction,
  {
    policy_ids?: AceAttribute<string>;
    bucket_keys?: AceAttribute<string>;
  }
>;

/** Policy bucket information (like the one from {@link schemas} but with more precise `acl`) */
export type BucketInfo = schemas["BucketInfo"] & {
  acl?: BucketAce[];
};

/**
 * Coerce the less accurate `BucketInfo` type from the OpenAPI schema to a more accurate {@link BucketInfo}.
 *
 * @param b The bucket info received on the wire.
 * @returns The exact same value coerced to the {@link BucketInfo} type.
 */
export function coerceBucketInfo(b: schemas["BucketInfo"]): BucketInfo {
  return {
    ...b,
    // TODO: parse once we add Zod
    acl: b.acl as BucketAce[],
  };
}
