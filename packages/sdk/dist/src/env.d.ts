/**
 * Available CubeSigner deployment environments.
 */
export type Environment = 
/** Production environment */
"prod"
/** Gamma, staging environment */
 | "gamma"
/** Beta, development environment */
 | "beta";
/**
 * Environment parameters for a given region.
 */
export interface EnvInterface {
    Region?: string;
    SignerApiRoot: string;
    OrgEventsTopicArn: string;
}
export type Region = string;
export type StackName = string;
/**
 * Holds all available regional environment parameters for a given deployment {@link Environment}.
 */
export declare class MultiRegionEnv {
    #private;
    /**
     * @param spec Available regional environment parameters. This should be a map from stack name
     *  (e.g., "Dev-CubeSignerStack" or "Dev-CubeSignerStack-eu-west-1") to regional environment parameters.
     * @param primaryRegion The region to use by default (defaults to 'us-east-1'). Must be included in {@link spec}.
     */
    constructor(spec: Record<StackName, EnvInterface>, primaryRegion?: Region);
    /**
     * @returns The mapping from stack name to corresponding regional environment parameters.
     * @internal
     */
    get spec(): Record<StackName, EnvInterface>;
    /** @returns The environment parameters for the primary region. */
    get primary(): EnvInterface;
    /**
     * @param region The region of choice.
     * @returns The environment parameters for a given region, if any.
     */
    regional(region: Region): EnvInterface | undefined;
}
/**
 * All available regional environment parameters for all available {@link Environment}s.
 */
export declare const multiRegionEnvs: Record<Environment, MultiRegionEnv>;
/**
 * Primary environment parameters for all available {@link Environment}s.
 *
 * For regional parameters, use {@link multiRegionEnvs}.
 */
export declare const envs: Record<Environment, EnvInterface>;
//# sourceMappingURL=env.d.ts.map