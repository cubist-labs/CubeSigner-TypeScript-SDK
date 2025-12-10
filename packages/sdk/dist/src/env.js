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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW52LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2Vudi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxzRUFBNkM7QUFDN0Msd0VBQStDO0FBQy9DLHNFQUE2QztBQXlCN0M7O0dBRUc7QUFDSCxNQUFhLGNBQWM7SUFVekI7Ozs7T0FJRztJQUNILFlBQVksSUFBcUMsRUFBRSxnQkFBd0IsV0FBVztRQWR0RiwrR0FBK0c7UUFDdEcsdUNBQXVDO1FBRWhELHdEQUF3RDtRQUMvQywrQ0FBeUM7UUFFbEQscURBQXFEO1FBQzVDLDBDQUF1QjtRQVE5Qix1QkFBQSxJQUFJLHdCQUFTLElBQUksTUFBQSxDQUFDO1FBQ2xCLHVCQUFBLElBQUksZ0NBQWlCLElBQUksR0FBRyxFQUFFLE1BQUEsQ0FBQztRQUMvQixLQUFLLE1BQU0sQ0FBQyxFQUFFLEdBQUcsQ0FBQyxJQUFJLE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztZQUMzQyx1QkFBQSxJQUFJLG9DQUFjLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxNQUFNLElBQUksYUFBYSxFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQzNELENBQUM7UUFFRCx1QkFBQSxJQUFJLDJCQUFZLHVCQUFBLElBQUksb0NBQWMsQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUFFLE1BQUEsQ0FBQztRQUN2RCxJQUFJLENBQUMsdUJBQUEsSUFBSSwrQkFBUyxFQUFFLENBQUM7WUFDbkIsTUFBTSxJQUFJLEtBQUssQ0FBQyxvQ0FBb0MsYUFBYSxHQUFHLENBQUMsQ0FBQztRQUN4RSxDQUFDO0lBQ0gsQ0FBQztJQUVEOzs7T0FHRztJQUNILElBQUksSUFBSTtRQUNOLE9BQU8sdUJBQUEsSUFBSSw0QkFBTSxDQUFDO0lBQ3BCLENBQUM7SUFFRCxrRUFBa0U7SUFDbEUsSUFBSSxPQUFPO1FBQ1QsT0FBTyx1QkFBQSxJQUFJLCtCQUFTLENBQUM7SUFDdkIsQ0FBQztJQUVEOzs7T0FHRztJQUNILFFBQVEsQ0FBQyxNQUFjO1FBQ3JCLE9BQU8sdUJBQUEsSUFBSSxvQ0FBYyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUN4QyxDQUFDO0NBQ0Y7QUFoREQsd0NBZ0RDOztBQUVEOztHQUVHO0FBQ1UsUUFBQSxlQUFlLEdBQXdDO0lBQ2xFLElBQUksRUFBRSxJQUFJLGNBQWMsQ0FBQyxtQkFBUSxDQUFDO0lBQ2xDLEtBQUssRUFBRSxJQUFJLGNBQWMsQ0FBQyxvQkFBUyxDQUFDO0lBQ3BDLElBQUksRUFBRSxJQUFJLGNBQWMsQ0FBQyxtQkFBUSxDQUFDO0NBQ25DLENBQUM7QUFFRjs7OztHQUlHO0FBQ1UsUUFBQSxJQUFJLEdBQXNDO0lBQ3JELElBQUksRUFBRSx1QkFBZSxDQUFDLElBQUksQ0FBQyxPQUFPO0lBQ2xDLEtBQUssRUFBRSx1QkFBZSxDQUFDLEtBQUssQ0FBQyxPQUFPO0lBQ3BDLElBQUksRUFBRSx1QkFBZSxDQUFDLElBQUksQ0FBQyxPQUFPO0NBQ25DLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgcHJvZFNwZWMgZnJvbSBcIi4uL3NwZWMvZW52L3Byb2QuanNvblwiO1xuaW1wb3J0IGdhbW1hU3BlYyBmcm9tIFwiLi4vc3BlYy9lbnYvZ2FtbWEuanNvblwiO1xuaW1wb3J0IGJldGFTcGVjIGZyb20gXCIuLi9zcGVjL2Vudi9iZXRhLmpzb25cIjtcblxuLyoqXG4gKiBBdmFpbGFibGUgQ3ViZVNpZ25lciBkZXBsb3ltZW50IGVudmlyb25tZW50cy5cbiAqL1xuZXhwb3J0IHR5cGUgRW52aXJvbm1lbnQgPVxuICAvKiogUHJvZHVjdGlvbiBlbnZpcm9ubWVudCAqL1xuICB8IFwicHJvZFwiXG4gIC8qKiBHYW1tYSwgc3RhZ2luZyBlbnZpcm9ubWVudCAqL1xuICB8IFwiZ2FtbWFcIlxuICAvKiogQmV0YSwgZGV2ZWxvcG1lbnQgZW52aXJvbm1lbnQgKi9cbiAgfCBcImJldGFcIjtcblxuLyoqXG4gKiBFbnZpcm9ubWVudCBwYXJhbWV0ZXJzIGZvciBhIGdpdmVuIHJlZ2lvbi5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBFbnZJbnRlcmZhY2Uge1xuICBSZWdpb24/OiBzdHJpbmc7XG4gIFNpZ25lckFwaVJvb3Q6IHN0cmluZztcbiAgT3JnRXZlbnRzVG9waWNBcm46IHN0cmluZztcbn1cblxuZXhwb3J0IHR5cGUgUmVnaW9uID0gc3RyaW5nO1xuZXhwb3J0IHR5cGUgU3RhY2tOYW1lID0gc3RyaW5nO1xuXG4vKipcbiAqIEhvbGRzIGFsbCBhdmFpbGFibGUgcmVnaW9uYWwgZW52aXJvbm1lbnQgcGFyYW1ldGVycyBmb3IgYSBnaXZlbiBkZXBsb3ltZW50IHtAbGluayBFbnZpcm9ubWVudH0uXG4gKi9cbmV4cG9ydCBjbGFzcyBNdWx0aVJlZ2lvbkVudiB7XG4gIC8qKiBBIG1hcCBmcm9tIHN0YWNrIG5hbWUgdG8gZW52aXJvbm1lbnQgcGFyYW1ldGVycy4gVGhpcyBpcyBob3cge2JldGEsZ2FtbWEscHJvZH0uanNvbiBmaWxlcyBhcmUgZm9ybWF0dGVkLiAqL1xuICByZWFkb25seSAjc3BlYzogUmVjb3JkPFN0YWNrTmFtZSwgRW52SW50ZXJmYWNlPjtcblxuICAvKiogQSBtYXAgZnJvbSByZWdpb24gbmFtZSB0byBlbnZpcm9ubWVudCBwYXJhbWV0ZXJzLiAqL1xuICByZWFkb25seSAjcGVyUmVnaW9uTWFwOiBNYXA8UmVnaW9uLCBFbnZJbnRlcmZhY2U+O1xuXG4gIC8qKiBFbnZpcm9ubWVudCBwYXJhbWV0ZXJzIGZvciB0aGUgcHJpbWFyeSByZWdpb24uICovXG4gIHJlYWRvbmx5ICNwcmltYXJ5OiBFbnZJbnRlcmZhY2U7XG5cbiAgLyoqXG4gICAqIEBwYXJhbSBzcGVjIEF2YWlsYWJsZSByZWdpb25hbCBlbnZpcm9ubWVudCBwYXJhbWV0ZXJzLiBUaGlzIHNob3VsZCBiZSBhIG1hcCBmcm9tIHN0YWNrIG5hbWVcbiAgICogIChlLmcuLCBcIkRldi1DdWJlU2lnbmVyU3RhY2tcIiBvciBcIkRldi1DdWJlU2lnbmVyU3RhY2stZXUtd2VzdC0xXCIpIHRvIHJlZ2lvbmFsIGVudmlyb25tZW50IHBhcmFtZXRlcnMuXG4gICAqIEBwYXJhbSBwcmltYXJ5UmVnaW9uIFRoZSByZWdpb24gdG8gdXNlIGJ5IGRlZmF1bHQgKGRlZmF1bHRzIHRvICd1cy1lYXN0LTEnKS4gTXVzdCBiZSBpbmNsdWRlZCBpbiB7QGxpbmsgc3BlY30uXG4gICAqL1xuICBjb25zdHJ1Y3RvcihzcGVjOiBSZWNvcmQ8U3RhY2tOYW1lLCBFbnZJbnRlcmZhY2U+LCBwcmltYXJ5UmVnaW9uOiBSZWdpb24gPSBcInVzLWVhc3QtMVwiKSB7XG4gICAgdGhpcy4jc3BlYyA9IHNwZWM7XG4gICAgdGhpcy4jcGVyUmVnaW9uTWFwID0gbmV3IE1hcCgpO1xuICAgIGZvciAoY29uc3QgWywgZW52XSBvZiBPYmplY3QuZW50cmllcyhzcGVjKSkge1xuICAgICAgdGhpcy4jcGVyUmVnaW9uTWFwLnNldChlbnYuUmVnaW9uID8/IHByaW1hcnlSZWdpb24sIGVudik7XG4gICAgfVxuXG4gICAgdGhpcy4jcHJpbWFyeSA9IHRoaXMuI3BlclJlZ2lvbk1hcC5nZXQocHJpbWFyeVJlZ2lvbikhO1xuICAgIGlmICghdGhpcy4jcHJpbWFyeSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBObyBlbnZpcm9ubWVudCBmb3VuZCBmb3IgcmVnaW9uICcke3ByaW1hcnlSZWdpb259J2ApO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBAcmV0dXJucyBUaGUgbWFwcGluZyBmcm9tIHN0YWNrIG5hbWUgdG8gY29ycmVzcG9uZGluZyByZWdpb25hbCBlbnZpcm9ubWVudCBwYXJhbWV0ZXJzLlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIGdldCBzcGVjKCk6IFJlY29yZDxTdGFja05hbWUsIEVudkludGVyZmFjZT4ge1xuICAgIHJldHVybiB0aGlzLiNzcGVjO1xuICB9XG5cbiAgLyoqIEByZXR1cm5zIFRoZSBlbnZpcm9ubWVudCBwYXJhbWV0ZXJzIGZvciB0aGUgcHJpbWFyeSByZWdpb24uICovXG4gIGdldCBwcmltYXJ5KCk6IEVudkludGVyZmFjZSB7XG4gICAgcmV0dXJuIHRoaXMuI3ByaW1hcnk7XG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHJlZ2lvbiBUaGUgcmVnaW9uIG9mIGNob2ljZS5cbiAgICogQHJldHVybnMgVGhlIGVudmlyb25tZW50IHBhcmFtZXRlcnMgZm9yIGEgZ2l2ZW4gcmVnaW9uLCBpZiBhbnkuXG4gICAqL1xuICByZWdpb25hbChyZWdpb246IFJlZ2lvbik6IEVudkludGVyZmFjZSB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMuI3BlclJlZ2lvbk1hcC5nZXQocmVnaW9uKTtcbiAgfVxufVxuXG4vKipcbiAqIEFsbCBhdmFpbGFibGUgcmVnaW9uYWwgZW52aXJvbm1lbnQgcGFyYW1ldGVycyBmb3IgYWxsIGF2YWlsYWJsZSB7QGxpbmsgRW52aXJvbm1lbnR9cy5cbiAqL1xuZXhwb3J0IGNvbnN0IG11bHRpUmVnaW9uRW52czogUmVjb3JkPEVudmlyb25tZW50LCBNdWx0aVJlZ2lvbkVudj4gPSB7XG4gIHByb2Q6IG5ldyBNdWx0aVJlZ2lvbkVudihwcm9kU3BlYyksXG4gIGdhbW1hOiBuZXcgTXVsdGlSZWdpb25FbnYoZ2FtbWFTcGVjKSxcbiAgYmV0YTogbmV3IE11bHRpUmVnaW9uRW52KGJldGFTcGVjKSxcbn07XG5cbi8qKlxuICogUHJpbWFyeSBlbnZpcm9ubWVudCBwYXJhbWV0ZXJzIGZvciBhbGwgYXZhaWxhYmxlIHtAbGluayBFbnZpcm9ubWVudH1zLlxuICpcbiAqIEZvciByZWdpb25hbCBwYXJhbWV0ZXJzLCB1c2Uge0BsaW5rIG11bHRpUmVnaW9uRW52c30uXG4gKi9cbmV4cG9ydCBjb25zdCBlbnZzOiBSZWNvcmQ8RW52aXJvbm1lbnQsIEVudkludGVyZmFjZT4gPSB7XG4gIHByb2Q6IG11bHRpUmVnaW9uRW52cy5wcm9kLnByaW1hcnksXG4gIGdhbW1hOiBtdWx0aVJlZ2lvbkVudnMuZ2FtbWEucHJpbWFyeSxcbiAgYmV0YTogbXVsdGlSZWdpb25FbnZzLmJldGEucHJpbWFyeSxcbn07XG4iXX0=