/**
 * This module simply exports the project's env vars.
 * This is specific to your bundler (in this case, vite),
 * so we've isolated it to this module
 */

import { envs, type EnvInterface } from "@cubist-labs/cubesigner-sdk";

export const ORG_ID: string = import.meta.env.VITE_ORG_ID;
export const ISSUER_URL: string = import.meta.env.VITE_ISSUER_URL;
export const CLIENT_ID: string = import.meta.env.VITE_CLIENT_ID;
export const CUBESIGNER_ENV: EnvInterface = ((e) => envs[e] ?? Object.values(JSON.parse(e))[0])(
  import.meta.env.VITE_CUBESIGNER_ENV,
);
