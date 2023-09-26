import createClient from "openapi-fetch";
import { paths } from "./schema";

/** Type of http client.
 * @internal
 * */
export type Client = ReturnType<typeof createClient<paths>>;

/** Re-export schema.
 * @internal
 * */
export * from "./schema";
