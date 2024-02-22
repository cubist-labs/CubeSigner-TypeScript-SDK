"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.envs = void 0;
const prodSpec = __importStar(require("../spec/env/prod.json"));
const gammaSpec = __importStar(require("../spec/env/gamma.json"));
const betaSpec = __importStar(require("../spec/env/beta.json"));
exports.envs = {
    prod: prodSpec["Dev-CubeSignerStack"],
    gamma: gammaSpec["Dev-CubeSignerStack"],
    beta: betaSpec["Dev-CubeSignerStack"],
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW52LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2Vudi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLGdFQUFrRDtBQUNsRCxrRUFBb0Q7QUFDcEQsZ0VBQWtEO0FBbUJyQyxRQUFBLElBQUksR0FBc0M7SUFDckQsSUFBSSxFQUFFLFFBQVEsQ0FBQyxxQkFBcUIsQ0FBQztJQUNyQyxLQUFLLEVBQUUsU0FBUyxDQUFDLHFCQUFxQixDQUFDO0lBQ3ZDLElBQUksRUFBRSxRQUFRLENBQUMscUJBQXFCLENBQUM7Q0FDdEMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIHByb2RTcGVjIGZyb20gXCIuLi9zcGVjL2Vudi9wcm9kLmpzb25cIjtcbmltcG9ydCAqIGFzIGdhbW1hU3BlYyBmcm9tIFwiLi4vc3BlYy9lbnYvZ2FtbWEuanNvblwiO1xuaW1wb3J0ICogYXMgYmV0YVNwZWMgZnJvbSBcIi4uL3NwZWMvZW52L2JldGEuanNvblwiO1xuXG5leHBvcnQgdHlwZSBFbnZpcm9ubWVudCA9XG4gIC8qKiBQcm9kdWN0aW9uIGVudmlyb25tZW50ICovXG4gIHwgXCJwcm9kXCJcbiAgLyoqIEdhbW1hLCBzdGFnaW5nIGVudmlyb25tZW50ICovXG4gIHwgXCJnYW1tYVwiXG4gIC8qKiBCZXRhLCBkZXZlbG9wbWVudCBlbnZpcm9ubWVudCAqL1xuICB8IFwiYmV0YVwiO1xuXG5leHBvcnQgaW50ZXJmYWNlIEVudkludGVyZmFjZSB7XG4gIENsaWVudElkOiBzdHJpbmc7XG4gIExvbmdMaXZlZENsaWVudElkOiBzdHJpbmc7XG4gIFJlZ2lvbjogc3RyaW5nO1xuICBVc2VyUG9vbElkOiBzdHJpbmc7XG4gIFNpZ25lckFwaVJvb3Q6IHN0cmluZztcbiAgT3JnRXZlbnRzVG9waWNBcm46IHN0cmluZztcbn1cblxuZXhwb3J0IGNvbnN0IGVudnM6IFJlY29yZDxFbnZpcm9ubWVudCwgRW52SW50ZXJmYWNlPiA9IHtcbiAgcHJvZDogcHJvZFNwZWNbXCJEZXYtQ3ViZVNpZ25lclN0YWNrXCJdLFxuICBnYW1tYTogZ2FtbWFTcGVjW1wiRGV2LUN1YmVTaWduZXJTdGFja1wiXSxcbiAgYmV0YTogYmV0YVNwZWNbXCJEZXYtQ3ViZVNpZ25lclN0YWNrXCJdLFxufTtcbiJdfQ==