"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _MultiRegionEnv_spec, _MultiRegionEnv_perRegionMap, _MultiRegionEnv_primary;
Object.defineProperty(exports, "__esModule", { value: true });
exports.envs = exports.multiRegionEnvs = exports.MultiRegionEnv = void 0;
const prod_json_1 = __importDefault(require("../spec/env/prod.json"));
const gamma_json_1 = __importDefault(require("../spec/env/gamma.json"));
const beta_json_1 = __importDefault(require("../spec/env/beta.json"));
/**
 * Holds all available regional environment parameters for a given deployment {@link Environment}.
 */
class MultiRegionEnv {
    /**
     * @param spec Available regional environment parameters. This should be a map from stack name
     *  (e.g., "Dev-CubeSignerStack" or "Dev-CubeSignerStack-eu-west-1") to regional environment parameters.
     * @param primaryRegion The region to use by default (defaults to 'us-east-1'). Must be included in {@link spec}.
     */
    constructor(spec, primaryRegion = "us-east-1") {
        /** A map from stack name to environment parameters. This is how {beta,gamma,prod}.json files are formatted. */
        _MultiRegionEnv_spec.set(this, void 0);
        /** A map from region name to environment parameters. */
        _MultiRegionEnv_perRegionMap.set(this, void 0);
        /** Environment parameters for the primary region. */
        _MultiRegionEnv_primary.set(this, void 0);
        __classPrivateFieldSet(this, _MultiRegionEnv_spec, spec, "f");
        __classPrivateFieldSet(this, _MultiRegionEnv_perRegionMap, new Map(), "f");
        for (const [, env] of Object.entries(spec)) {
            __classPrivateFieldGet(this, _MultiRegionEnv_perRegionMap, "f").set(env.Region ?? primaryRegion, env);
        }
        __classPrivateFieldSet(this, _MultiRegionEnv_primary, __classPrivateFieldGet(this, _MultiRegionEnv_perRegionMap, "f").get(primaryRegion), "f");
        if (!__classPrivateFieldGet(this, _MultiRegionEnv_primary, "f")) {
            throw new Error(`No environment found for region '${primaryRegion}'`);
        }
    }
    /**
     * Convert either a single or multi-region environment to {@link MultiRegionEnv}.
     *
     * @param env Either a single or multi-region environment.
     * @returns The resulting {@link MultiRegionEnv}
     */
    static create(env) {
        return env instanceof MultiRegionEnv
            ? env
            : new MultiRegionEnv({
                ["Dev-CubeSignerStack"]: env,
            }, env.Region);
    }
    /**
     * @returns The mapping from stack name to corresponding regional environment parameters.
     * @internal
     */
    get spec() {
        return __classPrivateFieldGet(this, _MultiRegionEnv_spec, "f");
    }
    /** @returns The environment parameters for the primary region. */
    get primary() {
        return __classPrivateFieldGet(this, _MultiRegionEnv_primary, "f");
    }
    /**
     * @param region The region of choice.
     * @returns The environment parameters for a given region, if any.
     */
    regional(region) {
        return __classPrivateFieldGet(this, _MultiRegionEnv_perRegionMap, "f").get(region);
    }
}
exports.MultiRegionEnv = MultiRegionEnv;
_MultiRegionEnv_spec = new WeakMap(), _MultiRegionEnv_perRegionMap = new WeakMap(), _MultiRegionEnv_primary = new WeakMap();
/**
 * All available regional environment parameters for all available {@link Environment}s.
 */
exports.multiRegionEnvs = {
    prod: new MultiRegionEnv(prod_json_1.default),
    gamma: new MultiRegionEnv(gamma_json_1.default),
    beta: new MultiRegionEnv(beta_json_1.default),
};
/**
 * Primary environment parameters for all available {@link Environment}s.
 *
 * For regional parameters, use {@link multiRegionEnvs}.
 */
exports.envs = {
    prod: exports.multiRegionEnvs.prod.primary,
    gamma: exports.multiRegionEnvs.gamma.primary,
    beta: exports.multiRegionEnvs.beta.primary,
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW52LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2Vudi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxzRUFBNkM7QUFDN0Msd0VBQStDO0FBQy9DLHNFQUE2QztBQTBCN0M7O0dBRUc7QUFDSCxNQUFhLGNBQWM7SUFVekI7Ozs7T0FJRztJQUNILFlBQVksSUFBcUMsRUFBRSxnQkFBd0IsV0FBVztRQWR0RiwrR0FBK0c7UUFDdEcsdUNBQXVDO1FBRWhELHdEQUF3RDtRQUMvQywrQ0FBeUM7UUFFbEQscURBQXFEO1FBQzVDLDBDQUF1QjtRQVE5Qix1QkFBQSxJQUFJLHdCQUFTLElBQUksTUFBQSxDQUFDO1FBQ2xCLHVCQUFBLElBQUksZ0NBQWlCLElBQUksR0FBRyxFQUFFLE1BQUEsQ0FBQztRQUMvQixLQUFLLE1BQU0sQ0FBQyxFQUFFLEdBQUcsQ0FBQyxJQUFJLE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztZQUMzQyx1QkFBQSxJQUFJLG9DQUFjLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxNQUFNLElBQUksYUFBYSxFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQzNELENBQUM7UUFFRCx1QkFBQSxJQUFJLDJCQUFZLHVCQUFBLElBQUksb0NBQWMsQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUFFLE1BQUEsQ0FBQztRQUN2RCxJQUFJLENBQUMsdUJBQUEsSUFBSSwrQkFBUyxFQUFFLENBQUM7WUFDbkIsTUFBTSxJQUFJLEtBQUssQ0FBQyxvQ0FBb0MsYUFBYSxHQUFHLENBQUMsQ0FBQztRQUN4RSxDQUFDO0lBQ0gsQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0gsTUFBTSxDQUFDLE1BQU0sQ0FBQyxHQUFrQztRQUM5QyxPQUFPLEdBQUcsWUFBWSxjQUFjO1lBQ2xDLENBQUMsQ0FBQyxHQUFHO1lBQ0wsQ0FBQyxDQUFDLElBQUksY0FBYyxDQUNoQjtnQkFDRSxDQUFDLHFCQUFxQixDQUFDLEVBQUUsR0FBRzthQUM3QixFQUNELEdBQUcsQ0FBQyxNQUFNLENBQ1gsQ0FBQztJQUNSLENBQUM7SUFFRDs7O09BR0c7SUFDSCxJQUFJLElBQUk7UUFDTixPQUFPLHVCQUFBLElBQUksNEJBQU0sQ0FBQztJQUNwQixDQUFDO0lBRUQsa0VBQWtFO0lBQ2xFLElBQUksT0FBTztRQUNULE9BQU8sdUJBQUEsSUFBSSwrQkFBUyxDQUFDO0lBQ3ZCLENBQUM7SUFFRDs7O09BR0c7SUFDSCxRQUFRLENBQUMsTUFBYztRQUNyQixPQUFPLHVCQUFBLElBQUksb0NBQWMsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDeEMsQ0FBQztDQUNGO0FBakVELHdDQWlFQzs7QUFFRDs7R0FFRztBQUNVLFFBQUEsZUFBZSxHQUF3QztJQUNsRSxJQUFJLEVBQUUsSUFBSSxjQUFjLENBQUMsbUJBQVEsQ0FBQztJQUNsQyxLQUFLLEVBQUUsSUFBSSxjQUFjLENBQUMsb0JBQVMsQ0FBQztJQUNwQyxJQUFJLEVBQUUsSUFBSSxjQUFjLENBQUMsbUJBQVEsQ0FBQztDQUNuQyxDQUFDO0FBRUY7Ozs7R0FJRztBQUNVLFFBQUEsSUFBSSxHQUFzQztJQUNyRCxJQUFJLEVBQUUsdUJBQWUsQ0FBQyxJQUFJLENBQUMsT0FBTztJQUNsQyxLQUFLLEVBQUUsdUJBQWUsQ0FBQyxLQUFLLENBQUMsT0FBTztJQUNwQyxJQUFJLEVBQUUsdUJBQWUsQ0FBQyxJQUFJLENBQUMsT0FBTztDQUNuQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHByb2RTcGVjIGZyb20gXCIuLi9zcGVjL2Vudi9wcm9kLmpzb25cIjtcbmltcG9ydCBnYW1tYVNwZWMgZnJvbSBcIi4uL3NwZWMvZW52L2dhbW1hLmpzb25cIjtcbmltcG9ydCBiZXRhU3BlYyBmcm9tIFwiLi4vc3BlYy9lbnYvYmV0YS5qc29uXCI7XG5cbi8qKlxuICogQXZhaWxhYmxlIEN1YmVTaWduZXIgZGVwbG95bWVudCBlbnZpcm9ubWVudHMuXG4gKi9cbmV4cG9ydCB0eXBlIEVudmlyb25tZW50ID1cbiAgLyoqIFByb2R1Y3Rpb24gZW52aXJvbm1lbnQgKi9cbiAgfCBcInByb2RcIlxuICAvKiogR2FtbWEsIHN0YWdpbmcgZW52aXJvbm1lbnQgKi9cbiAgfCBcImdhbW1hXCJcbiAgLyoqIEJldGEsIGRldmVsb3BtZW50IGVudmlyb25tZW50ICovXG4gIHwgXCJiZXRhXCI7XG5cbi8qKlxuICogRW52aXJvbm1lbnQgcGFyYW1ldGVycyBmb3IgYSBnaXZlbiByZWdpb24uXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgRW52SW50ZXJmYWNlIHtcbiAgUmVnaW9uPzogc3RyaW5nO1xuICBTaWduZXJBcGlSb290OiBzdHJpbmc7XG4gIE9yZ0V2ZW50c1RvcGljQXJuOiBzdHJpbmc7XG4gIFVwbG9hZEJ1Y2tldD86IHN0cmluZztcbn1cblxuZXhwb3J0IHR5cGUgUmVnaW9uID0gc3RyaW5nO1xuZXhwb3J0IHR5cGUgU3RhY2tOYW1lID0gc3RyaW5nO1xuXG4vKipcbiAqIEhvbGRzIGFsbCBhdmFpbGFibGUgcmVnaW9uYWwgZW52aXJvbm1lbnQgcGFyYW1ldGVycyBmb3IgYSBnaXZlbiBkZXBsb3ltZW50IHtAbGluayBFbnZpcm9ubWVudH0uXG4gKi9cbmV4cG9ydCBjbGFzcyBNdWx0aVJlZ2lvbkVudiB7XG4gIC8qKiBBIG1hcCBmcm9tIHN0YWNrIG5hbWUgdG8gZW52aXJvbm1lbnQgcGFyYW1ldGVycy4gVGhpcyBpcyBob3cge2JldGEsZ2FtbWEscHJvZH0uanNvbiBmaWxlcyBhcmUgZm9ybWF0dGVkLiAqL1xuICByZWFkb25seSAjc3BlYzogUmVjb3JkPFN0YWNrTmFtZSwgRW52SW50ZXJmYWNlPjtcblxuICAvKiogQSBtYXAgZnJvbSByZWdpb24gbmFtZSB0byBlbnZpcm9ubWVudCBwYXJhbWV0ZXJzLiAqL1xuICByZWFkb25seSAjcGVyUmVnaW9uTWFwOiBNYXA8UmVnaW9uLCBFbnZJbnRlcmZhY2U+O1xuXG4gIC8qKiBFbnZpcm9ubWVudCBwYXJhbWV0ZXJzIGZvciB0aGUgcHJpbWFyeSByZWdpb24uICovXG4gIHJlYWRvbmx5ICNwcmltYXJ5OiBFbnZJbnRlcmZhY2U7XG5cbiAgLyoqXG4gICAqIEBwYXJhbSBzcGVjIEF2YWlsYWJsZSByZWdpb25hbCBlbnZpcm9ubWVudCBwYXJhbWV0ZXJzLiBUaGlzIHNob3VsZCBiZSBhIG1hcCBmcm9tIHN0YWNrIG5hbWVcbiAgICogIChlLmcuLCBcIkRldi1DdWJlU2lnbmVyU3RhY2tcIiBvciBcIkRldi1DdWJlU2lnbmVyU3RhY2stZXUtd2VzdC0xXCIpIHRvIHJlZ2lvbmFsIGVudmlyb25tZW50IHBhcmFtZXRlcnMuXG4gICAqIEBwYXJhbSBwcmltYXJ5UmVnaW9uIFRoZSByZWdpb24gdG8gdXNlIGJ5IGRlZmF1bHQgKGRlZmF1bHRzIHRvICd1cy1lYXN0LTEnKS4gTXVzdCBiZSBpbmNsdWRlZCBpbiB7QGxpbmsgc3BlY30uXG4gICAqL1xuICBjb25zdHJ1Y3RvcihzcGVjOiBSZWNvcmQ8U3RhY2tOYW1lLCBFbnZJbnRlcmZhY2U+LCBwcmltYXJ5UmVnaW9uOiBSZWdpb24gPSBcInVzLWVhc3QtMVwiKSB7XG4gICAgdGhpcy4jc3BlYyA9IHNwZWM7XG4gICAgdGhpcy4jcGVyUmVnaW9uTWFwID0gbmV3IE1hcCgpO1xuICAgIGZvciAoY29uc3QgWywgZW52XSBvZiBPYmplY3QuZW50cmllcyhzcGVjKSkge1xuICAgICAgdGhpcy4jcGVyUmVnaW9uTWFwLnNldChlbnYuUmVnaW9uID8/IHByaW1hcnlSZWdpb24sIGVudik7XG4gICAgfVxuXG4gICAgdGhpcy4jcHJpbWFyeSA9IHRoaXMuI3BlclJlZ2lvbk1hcC5nZXQocHJpbWFyeVJlZ2lvbikhO1xuICAgIGlmICghdGhpcy4jcHJpbWFyeSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBObyBlbnZpcm9ubWVudCBmb3VuZCBmb3IgcmVnaW9uICcke3ByaW1hcnlSZWdpb259J2ApO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBDb252ZXJ0IGVpdGhlciBhIHNpbmdsZSBvciBtdWx0aS1yZWdpb24gZW52aXJvbm1lbnQgdG8ge0BsaW5rIE11bHRpUmVnaW9uRW52fS5cbiAgICpcbiAgICogQHBhcmFtIGVudiBFaXRoZXIgYSBzaW5nbGUgb3IgbXVsdGktcmVnaW9uIGVudmlyb25tZW50LlxuICAgKiBAcmV0dXJucyBUaGUgcmVzdWx0aW5nIHtAbGluayBNdWx0aVJlZ2lvbkVudn1cbiAgICovXG4gIHN0YXRpYyBjcmVhdGUoZW52OiBFbnZJbnRlcmZhY2UgfCBNdWx0aVJlZ2lvbkVudik6IE11bHRpUmVnaW9uRW52IHtcbiAgICByZXR1cm4gZW52IGluc3RhbmNlb2YgTXVsdGlSZWdpb25FbnZcbiAgICAgID8gZW52XG4gICAgICA6IG5ldyBNdWx0aVJlZ2lvbkVudihcbiAgICAgICAgICB7XG4gICAgICAgICAgICBbXCJEZXYtQ3ViZVNpZ25lclN0YWNrXCJdOiBlbnYsXG4gICAgICAgICAgfSxcbiAgICAgICAgICBlbnYuUmVnaW9uLFxuICAgICAgICApO1xuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm5zIFRoZSBtYXBwaW5nIGZyb20gc3RhY2sgbmFtZSB0byBjb3JyZXNwb25kaW5nIHJlZ2lvbmFsIGVudmlyb25tZW50IHBhcmFtZXRlcnMuXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgZ2V0IHNwZWMoKTogUmVjb3JkPFN0YWNrTmFtZSwgRW52SW50ZXJmYWNlPiB7XG4gICAgcmV0dXJuIHRoaXMuI3NwZWM7XG4gIH1cblxuICAvKiogQHJldHVybnMgVGhlIGVudmlyb25tZW50IHBhcmFtZXRlcnMgZm9yIHRoZSBwcmltYXJ5IHJlZ2lvbi4gKi9cbiAgZ2V0IHByaW1hcnkoKTogRW52SW50ZXJmYWNlIHtcbiAgICByZXR1cm4gdGhpcy4jcHJpbWFyeTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0gcmVnaW9uIFRoZSByZWdpb24gb2YgY2hvaWNlLlxuICAgKiBAcmV0dXJucyBUaGUgZW52aXJvbm1lbnQgcGFyYW1ldGVycyBmb3IgYSBnaXZlbiByZWdpb24sIGlmIGFueS5cbiAgICovXG4gIHJlZ2lvbmFsKHJlZ2lvbjogUmVnaW9uKTogRW52SW50ZXJmYWNlIHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdGhpcy4jcGVyUmVnaW9uTWFwLmdldChyZWdpb24pO1xuICB9XG59XG5cbi8qKlxuICogQWxsIGF2YWlsYWJsZSByZWdpb25hbCBlbnZpcm9ubWVudCBwYXJhbWV0ZXJzIGZvciBhbGwgYXZhaWxhYmxlIHtAbGluayBFbnZpcm9ubWVudH1zLlxuICovXG5leHBvcnQgY29uc3QgbXVsdGlSZWdpb25FbnZzOiBSZWNvcmQ8RW52aXJvbm1lbnQsIE11bHRpUmVnaW9uRW52PiA9IHtcbiAgcHJvZDogbmV3IE11bHRpUmVnaW9uRW52KHByb2RTcGVjKSxcbiAgZ2FtbWE6IG5ldyBNdWx0aVJlZ2lvbkVudihnYW1tYVNwZWMpLFxuICBiZXRhOiBuZXcgTXVsdGlSZWdpb25FbnYoYmV0YVNwZWMpLFxufTtcblxuLyoqXG4gKiBQcmltYXJ5IGVudmlyb25tZW50IHBhcmFtZXRlcnMgZm9yIGFsbCBhdmFpbGFibGUge0BsaW5rIEVudmlyb25tZW50fXMuXG4gKlxuICogRm9yIHJlZ2lvbmFsIHBhcmFtZXRlcnMsIHVzZSB7QGxpbmsgbXVsdGlSZWdpb25FbnZzfS5cbiAqL1xuZXhwb3J0IGNvbnN0IGVudnM6IFJlY29yZDxFbnZpcm9ubWVudCwgRW52SW50ZXJmYWNlPiA9IHtcbiAgcHJvZDogbXVsdGlSZWdpb25FbnZzLnByb2QucHJpbWFyeSxcbiAgZ2FtbWE6IG11bHRpUmVnaW9uRW52cy5nYW1tYS5wcmltYXJ5LFxuICBiZXRhOiBtdWx0aVJlZ2lvbkVudnMuYmV0YS5wcmltYXJ5LFxufTtcbiJdfQ==