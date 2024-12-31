import prodSpec from "../spec/env/prod.json";
import gammaSpec from "../spec/env/gamma.json";
import betaSpec from "../spec/env/beta.json";

export type Environment =
  /** Production environment */
  | "prod"
  /** Gamma, staging environment */
  | "gamma"
  /** Beta, development environment */
  | "beta";

export interface EnvInterface {
  ClientId: string;
  LongLivedClientId: string;
  Region: string;
  UserPoolId: string;
  SignerApiRoot: string;
  OrgEventsTopicArn: string;
}

export const envs: Record<Environment, EnvInterface> = {
  prod: prodSpec["Dev-CubeSignerStack"],
  gamma: gammaSpec["Dev-CubeSignerStack"],
  beta: betaSpec["Dev-CubeSignerStack"],
};
