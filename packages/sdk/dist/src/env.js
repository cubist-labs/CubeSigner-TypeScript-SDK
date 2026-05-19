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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW52LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2Vudi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxzRUFBNkM7QUFDN0Msd0VBQStDO0FBQy9DLHNFQUE2QztBQXlCN0M7O0dBRUc7QUFDSCxNQUFhLGNBQWM7SUFVekI7Ozs7T0FJRztJQUNILFlBQVksSUFBcUMsRUFBRSxnQkFBd0IsV0FBVztRQWR0RiwrR0FBK0c7UUFDdEcsdUNBQXVDO1FBRWhELHdEQUF3RDtRQUMvQywrQ0FBeUM7UUFFbEQscURBQXFEO1FBQzVDLDBDQUF1QjtRQVE5Qix1QkFBQSxJQUFJLHdCQUFTLElBQUksTUFBQSxDQUFDO1FBQ2xCLHVCQUFBLElBQUksZ0NBQWlCLElBQUksR0FBRyxFQUFFLE1BQUEsQ0FBQztRQUMvQixLQUFLLE1BQU0sQ0FBQyxFQUFFLEdBQUcsQ0FBQyxJQUFJLE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztZQUMzQyx1QkFBQSxJQUFJLG9DQUFjLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxNQUFNLElBQUksYUFBYSxFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQzNELENBQUM7UUFFRCx1QkFBQSxJQUFJLDJCQUFZLHVCQUFBLElBQUksb0NBQWMsQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUFFLE1BQUEsQ0FBQztRQUN2RCxJQUFJLENBQUMsdUJBQUEsSUFBSSwrQkFBUyxFQUFFLENBQUM7WUFDbkIsTUFBTSxJQUFJLEtBQUssQ0FBQyxvQ0FBb0MsYUFBYSxHQUFHLENBQUMsQ0FBQztRQUN4RSxDQUFDO0lBQ0gsQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0gsTUFBTSxDQUFDLE1BQU0sQ0FBQyxHQUFrQztRQUM5QyxPQUFPLEdBQUcsWUFBWSxjQUFjO1lBQ2xDLENBQUMsQ0FBQyxHQUFHO1lBQ0wsQ0FBQyxDQUFDLElBQUksY0FBYyxDQUNoQjtnQkFDRSxDQUFDLHFCQUFxQixDQUFDLEVBQUUsR0FBRzthQUM3QixFQUNELEdBQUcsQ0FBQyxNQUFNLENBQ1gsQ0FBQztJQUNSLENBQUM7SUFFRDs7O09BR0c7SUFDSCxJQUFJLElBQUk7UUFDTixPQUFPLHVCQUFBLElBQUksNEJBQU0sQ0FBQztJQUNwQixDQUFDO0lBRUQsa0VBQWtFO0lBQ2xFLElBQUksT0FBTztRQUNULE9BQU8sdUJBQUEsSUFBSSwrQkFBUyxDQUFDO0lBQ3ZCLENBQUM7SUFFRDs7O09BR0c7SUFDSCxRQUFRLENBQUMsTUFBYztRQUNyQixPQUFPLHVCQUFBLElBQUksb0NBQWMsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDeEMsQ0FBQztDQUNGO0FBakVELHdDQWlFQzs7QUFFRDs7R0FFRztBQUNVLFFBQUEsZUFBZSxHQUF3QztJQUNsRSxJQUFJLEVBQUUsSUFBSSxjQUFjLENBQUMsbUJBQVEsQ0FBQztJQUNsQyxLQUFLLEVBQUUsSUFBSSxjQUFjLENBQUMsb0JBQVMsQ0FBQztJQUNwQyxJQUFJLEVBQUUsSUFBSSxjQUFjLENBQUMsbUJBQVEsQ0FBQztDQUNuQyxDQUFDO0FBRUY7Ozs7R0FJRztBQUNVLFFBQUEsSUFBSSxHQUFzQztJQUNyRCxJQUFJLEVBQUUsdUJBQWUsQ0FBQyxJQUFJLENBQUMsT0FBTztJQUNsQyxLQUFLLEVBQUUsdUJBQWUsQ0FBQyxLQUFLLENBQUMsT0FBTztJQUNwQyxJQUFJLEVBQUUsdUJBQWUsQ0FBQyxJQUFJLENBQUMsT0FBTztDQUNuQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHByb2RTcGVjIGZyb20gXCIuLi9zcGVjL2Vudi9wcm9kLmpzb25cIjtcbmltcG9ydCBnYW1tYVNwZWMgZnJvbSBcIi4uL3NwZWMvZW52L2dhbW1hLmpzb25cIjtcbmltcG9ydCBiZXRhU3BlYyBmcm9tIFwiLi4vc3BlYy9lbnYvYmV0YS5qc29uXCI7XG5cbi8qKlxuICogQXZhaWxhYmxlIEN1YmVTaWduZXIgZGVwbG95bWVudCBlbnZpcm9ubWVudHMuXG4gKi9cbmV4cG9ydCB0eXBlIEVudmlyb25tZW50ID1cbiAgLyoqIFByb2R1Y3Rpb24gZW52aXJvbm1lbnQgKi9cbiAgfCBcInByb2RcIlxuICAvKiogR2FtbWEsIHN0YWdpbmcgZW52aXJvbm1lbnQgKi9cbiAgfCBcImdhbW1hXCJcbiAgLyoqIEJldGEsIGRldmVsb3BtZW50IGVudmlyb25tZW50ICovXG4gIHwgXCJiZXRhXCI7XG5cbi8qKlxuICogRW52aXJvbm1lbnQgcGFyYW1ldGVycyBmb3IgYSBnaXZlbiByZWdpb24uXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgRW52SW50ZXJmYWNlIHtcbiAgUmVnaW9uPzogc3RyaW5nO1xuICBTaWduZXJBcGlSb290OiBzdHJpbmc7XG4gIE9yZ0V2ZW50c1RvcGljQXJuOiBzdHJpbmc7XG59XG5cbmV4cG9ydCB0eXBlIFJlZ2lvbiA9IHN0cmluZztcbmV4cG9ydCB0eXBlIFN0YWNrTmFtZSA9IHN0cmluZztcblxuLyoqXG4gKiBIb2xkcyBhbGwgYXZhaWxhYmxlIHJlZ2lvbmFsIGVudmlyb25tZW50IHBhcmFtZXRlcnMgZm9yIGEgZ2l2ZW4gZGVwbG95bWVudCB7QGxpbmsgRW52aXJvbm1lbnR9LlxuICovXG5leHBvcnQgY2xhc3MgTXVsdGlSZWdpb25FbnYge1xuICAvKiogQSBtYXAgZnJvbSBzdGFjayBuYW1lIHRvIGVudmlyb25tZW50IHBhcmFtZXRlcnMuIFRoaXMgaXMgaG93IHtiZXRhLGdhbW1hLHByb2R9Lmpzb24gZmlsZXMgYXJlIGZvcm1hdHRlZC4gKi9cbiAgcmVhZG9ubHkgI3NwZWM6IFJlY29yZDxTdGFja05hbWUsIEVudkludGVyZmFjZT47XG5cbiAgLyoqIEEgbWFwIGZyb20gcmVnaW9uIG5hbWUgdG8gZW52aXJvbm1lbnQgcGFyYW1ldGVycy4gKi9cbiAgcmVhZG9ubHkgI3BlclJlZ2lvbk1hcDogTWFwPFJlZ2lvbiwgRW52SW50ZXJmYWNlPjtcblxuICAvKiogRW52aXJvbm1lbnQgcGFyYW1ldGVycyBmb3IgdGhlIHByaW1hcnkgcmVnaW9uLiAqL1xuICByZWFkb25seSAjcHJpbWFyeTogRW52SW50ZXJmYWNlO1xuXG4gIC8qKlxuICAgKiBAcGFyYW0gc3BlYyBBdmFpbGFibGUgcmVnaW9uYWwgZW52aXJvbm1lbnQgcGFyYW1ldGVycy4gVGhpcyBzaG91bGQgYmUgYSBtYXAgZnJvbSBzdGFjayBuYW1lXG4gICAqICAoZS5nLiwgXCJEZXYtQ3ViZVNpZ25lclN0YWNrXCIgb3IgXCJEZXYtQ3ViZVNpZ25lclN0YWNrLWV1LXdlc3QtMVwiKSB0byByZWdpb25hbCBlbnZpcm9ubWVudCBwYXJhbWV0ZXJzLlxuICAgKiBAcGFyYW0gcHJpbWFyeVJlZ2lvbiBUaGUgcmVnaW9uIHRvIHVzZSBieSBkZWZhdWx0IChkZWZhdWx0cyB0byAndXMtZWFzdC0xJykuIE11c3QgYmUgaW5jbHVkZWQgaW4ge0BsaW5rIHNwZWN9LlxuICAgKi9cbiAgY29uc3RydWN0b3Ioc3BlYzogUmVjb3JkPFN0YWNrTmFtZSwgRW52SW50ZXJmYWNlPiwgcHJpbWFyeVJlZ2lvbjogUmVnaW9uID0gXCJ1cy1lYXN0LTFcIikge1xuICAgIHRoaXMuI3NwZWMgPSBzcGVjO1xuICAgIHRoaXMuI3BlclJlZ2lvbk1hcCA9IG5ldyBNYXAoKTtcbiAgICBmb3IgKGNvbnN0IFssIGVudl0gb2YgT2JqZWN0LmVudHJpZXMoc3BlYykpIHtcbiAgICAgIHRoaXMuI3BlclJlZ2lvbk1hcC5zZXQoZW52LlJlZ2lvbiA/PyBwcmltYXJ5UmVnaW9uLCBlbnYpO1xuICAgIH1cblxuICAgIHRoaXMuI3ByaW1hcnkgPSB0aGlzLiNwZXJSZWdpb25NYXAuZ2V0KHByaW1hcnlSZWdpb24pITtcbiAgICBpZiAoIXRoaXMuI3ByaW1hcnkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgTm8gZW52aXJvbm1lbnQgZm91bmQgZm9yIHJlZ2lvbiAnJHtwcmltYXJ5UmVnaW9ufSdgKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQ29udmVydCBlaXRoZXIgYSBzaW5nbGUgb3IgbXVsdGktcmVnaW9uIGVudmlyb25tZW50IHRvIHtAbGluayBNdWx0aVJlZ2lvbkVudn0uXG4gICAqXG4gICAqIEBwYXJhbSBlbnYgRWl0aGVyIGEgc2luZ2xlIG9yIG11bHRpLXJlZ2lvbiBlbnZpcm9ubWVudC5cbiAgICogQHJldHVybnMgVGhlIHJlc3VsdGluZyB7QGxpbmsgTXVsdGlSZWdpb25FbnZ9XG4gICAqL1xuICBzdGF0aWMgY3JlYXRlKGVudjogRW52SW50ZXJmYWNlIHwgTXVsdGlSZWdpb25FbnYpOiBNdWx0aVJlZ2lvbkVudiB7XG4gICAgcmV0dXJuIGVudiBpbnN0YW5jZW9mIE11bHRpUmVnaW9uRW52XG4gICAgICA/IGVudlxuICAgICAgOiBuZXcgTXVsdGlSZWdpb25FbnYoXG4gICAgICAgICAge1xuICAgICAgICAgICAgW1wiRGV2LUN1YmVTaWduZXJTdGFja1wiXTogZW52LFxuICAgICAgICAgIH0sXG4gICAgICAgICAgZW52LlJlZ2lvbixcbiAgICAgICAgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAcmV0dXJucyBUaGUgbWFwcGluZyBmcm9tIHN0YWNrIG5hbWUgdG8gY29ycmVzcG9uZGluZyByZWdpb25hbCBlbnZpcm9ubWVudCBwYXJhbWV0ZXJzLlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIGdldCBzcGVjKCk6IFJlY29yZDxTdGFja05hbWUsIEVudkludGVyZmFjZT4ge1xuICAgIHJldHVybiB0aGlzLiNzcGVjO1xuICB9XG5cbiAgLyoqIEByZXR1cm5zIFRoZSBlbnZpcm9ubWVudCBwYXJhbWV0ZXJzIGZvciB0aGUgcHJpbWFyeSByZWdpb24uICovXG4gIGdldCBwcmltYXJ5KCk6IEVudkludGVyZmFjZSB7XG4gICAgcmV0dXJuIHRoaXMuI3ByaW1hcnk7XG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHJlZ2lvbiBUaGUgcmVnaW9uIG9mIGNob2ljZS5cbiAgICogQHJldHVybnMgVGhlIGVudmlyb25tZW50IHBhcmFtZXRlcnMgZm9yIGEgZ2l2ZW4gcmVnaW9uLCBpZiBhbnkuXG4gICAqL1xuICByZWdpb25hbChyZWdpb246IFJlZ2lvbik6IEVudkludGVyZmFjZSB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMuI3BlclJlZ2lvbk1hcC5nZXQocmVnaW9uKTtcbiAgfVxufVxuXG4vKipcbiAqIEFsbCBhdmFpbGFibGUgcmVnaW9uYWwgZW52aXJvbm1lbnQgcGFyYW1ldGVycyBmb3IgYWxsIGF2YWlsYWJsZSB7QGxpbmsgRW52aXJvbm1lbnR9cy5cbiAqL1xuZXhwb3J0IGNvbnN0IG11bHRpUmVnaW9uRW52czogUmVjb3JkPEVudmlyb25tZW50LCBNdWx0aVJlZ2lvbkVudj4gPSB7XG4gIHByb2Q6IG5ldyBNdWx0aVJlZ2lvbkVudihwcm9kU3BlYyksXG4gIGdhbW1hOiBuZXcgTXVsdGlSZWdpb25FbnYoZ2FtbWFTcGVjKSxcbiAgYmV0YTogbmV3IE11bHRpUmVnaW9uRW52KGJldGFTcGVjKSxcbn07XG5cbi8qKlxuICogUHJpbWFyeSBlbnZpcm9ubWVudCBwYXJhbWV0ZXJzIGZvciBhbGwgYXZhaWxhYmxlIHtAbGluayBFbnZpcm9ubWVudH1zLlxuICpcbiAqIEZvciByZWdpb25hbCBwYXJhbWV0ZXJzLCB1c2Uge0BsaW5rIG11bHRpUmVnaW9uRW52c30uXG4gKi9cbmV4cG9ydCBjb25zdCBlbnZzOiBSZWNvcmQ8RW52aXJvbm1lbnQsIEVudkludGVyZmFjZT4gPSB7XG4gIHByb2Q6IG11bHRpUmVnaW9uRW52cy5wcm9kLnByaW1hcnksXG4gIGdhbW1hOiBtdWx0aVJlZ2lvbkVudnMuZ2FtbWEucHJpbWFyeSxcbiAgYmV0YTogbXVsdGlSZWdpb25FbnZzLmJldGEucHJpbWFyeSxcbn07XG4iXX0=