import prodSpec from "../spec/env/prod.json";
import gammaSpec from "../spec/env/gamma.json";
import betaSpec from "../spec/env/beta.json";

/**
 * Available CubeSigner deployment environments.
 */
export type Environment =
  /** Production environment */
  | "prod"
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
export class MultiRegionEnv {
  /** A map from stack name to environment parameters. This is how {beta,gamma,prod}.json files are formatted. */
  readonly #spec: Record<StackName, EnvInterface>;

  /** A map from region name to environment parameters. */
  readonly #perRegionMap: Map<Region, EnvInterface>;

  /** Environment parameters for the primary region. */
  readonly #primary: EnvInterface;

  /**
   * @param spec Available regional environment parameters. This should be a map from stack name
   *  (e.g., "Dev-CubeSignerStack" or "Dev-CubeSignerStack-eu-west-1") to regional environment parameters.
   * @param primaryRegion The region to use by default (defaults to 'us-east-1'). Must be included in {@link spec}.
   */
  constructor(spec: Record<StackName, EnvInterface>, primaryRegion: Region = "us-east-1") {
    this.#spec = spec;
    this.#perRegionMap = new Map();
    for (const [, env] of Object.entries(spec)) {
      this.#perRegionMap.set(env.Region ?? primaryRegion, env);
    }

    this.#primary = this.#perRegionMap.get(primaryRegion)!;
    if (!this.#primary) {
      throw new Error(`No environment found for region '${primaryRegion}'`);
    }
  }

  /**
   * @returns The mapping from stack name to corresponding regional environment parameters.
   * @internal
   */
  get spec(): Record<StackName, EnvInterface> {
    return this.#spec;
  }

  /** @returns The environment parameters for the primary region. */
  get primary(): EnvInterface {
    return this.#primary;
  }

  /**
   * @param region The region of choice.
   * @returns The environment parameters for a given region, if any.
   */
  regional(region: Region): EnvInterface | undefined {
    return this.#perRegionMap.get(region);
  }
}

/**
 * All available regional environment parameters for all available {@link Environment}s.
 */
export const multiRegionEnvs: Record<Environment, MultiRegionEnv> = {
  prod: new MultiRegionEnv(prodSpec),
  gamma: new MultiRegionEnv(gammaSpec),
  beta: new MultiRegionEnv(betaSpec),
};

/**
 * Primary environment parameters for all available {@link Environment}s.
 *
 * For regional parameters, use {@link multiRegionEnvs}.
 */
export const envs: Record<Environment, EnvInterface> = {
  prod: multiRegionEnvs.prod.primary,
  gamma: multiRegionEnvs.gamma.primary,
  beta: multiRegionEnvs.beta.primary,
};
