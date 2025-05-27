export type Environment = 
/** Production environment */
"prod"
/** Gamma, staging environment */
 | "gamma"
/** Beta, development environment */
 | "beta";
export interface EnvInterface {
    SignerApiRoot: string;
    OrgEventsTopicArn: string;
}
export declare const envs: Record<Environment, EnvInterface>;
//# sourceMappingURL=env.d.ts.map