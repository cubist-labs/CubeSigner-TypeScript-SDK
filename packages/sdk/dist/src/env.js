"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.envs = void 0;
const prod_json_1 = __importDefault(require("../spec/env/prod.json"));
const gamma_json_1 = __importDefault(require("../spec/env/gamma.json"));
const beta_json_1 = __importDefault(require("../spec/env/beta.json"));
exports.envs = {
    prod: prod_json_1.default["Dev-CubeSignerStack"],
    gamma: gamma_json_1.default["Dev-CubeSignerStack"],
    beta: beta_json_1.default["Dev-CubeSignerStack"],
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW52LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2Vudi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSxzRUFBNkM7QUFDN0Msd0VBQStDO0FBQy9DLHNFQUE2QztBQWVoQyxRQUFBLElBQUksR0FBc0M7SUFDckQsSUFBSSxFQUFFLG1CQUFRLENBQUMscUJBQXFCLENBQUM7SUFDckMsS0FBSyxFQUFFLG9CQUFTLENBQUMscUJBQXFCLENBQUM7SUFDdkMsSUFBSSxFQUFFLG1CQUFRLENBQUMscUJBQXFCLENBQUM7Q0FDdEMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBwcm9kU3BlYyBmcm9tIFwiLi4vc3BlYy9lbnYvcHJvZC5qc29uXCI7XG5pbXBvcnQgZ2FtbWFTcGVjIGZyb20gXCIuLi9zcGVjL2Vudi9nYW1tYS5qc29uXCI7XG5pbXBvcnQgYmV0YVNwZWMgZnJvbSBcIi4uL3NwZWMvZW52L2JldGEuanNvblwiO1xuXG5leHBvcnQgdHlwZSBFbnZpcm9ubWVudCA9XG4gIC8qKiBQcm9kdWN0aW9uIGVudmlyb25tZW50ICovXG4gIHwgXCJwcm9kXCJcbiAgLyoqIEdhbW1hLCBzdGFnaW5nIGVudmlyb25tZW50ICovXG4gIHwgXCJnYW1tYVwiXG4gIC8qKiBCZXRhLCBkZXZlbG9wbWVudCBlbnZpcm9ubWVudCAqL1xuICB8IFwiYmV0YVwiO1xuXG5leHBvcnQgaW50ZXJmYWNlIEVudkludGVyZmFjZSB7XG4gIFNpZ25lckFwaVJvb3Q6IHN0cmluZztcbiAgT3JnRXZlbnRzVG9waWNBcm46IHN0cmluZztcbn1cblxuZXhwb3J0IGNvbnN0IGVudnM6IFJlY29yZDxFbnZpcm9ubWVudCwgRW52SW50ZXJmYWNlPiA9IHtcbiAgcHJvZDogcHJvZFNwZWNbXCJEZXYtQ3ViZVNpZ25lclN0YWNrXCJdLFxuICBnYW1tYTogZ2FtbWFTcGVjW1wiRGV2LUN1YmVTaWduZXJTdGFja1wiXSxcbiAgYmV0YTogYmV0YVNwZWNbXCJEZXYtQ3ViZVNpZ25lclN0YWNrXCJdLFxufTtcbiJdfQ==