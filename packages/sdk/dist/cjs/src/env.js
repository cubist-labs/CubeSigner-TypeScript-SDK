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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW52LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2Vudi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSxzRUFBNkM7QUFDN0Msd0VBQStDO0FBQy9DLHNFQUE2QztBQW1CaEMsUUFBQSxJQUFJLEdBQXNDO0lBQ3JELElBQUksRUFBRSxtQkFBUSxDQUFDLHFCQUFxQixDQUFDO0lBQ3JDLEtBQUssRUFBRSxvQkFBUyxDQUFDLHFCQUFxQixDQUFDO0lBQ3ZDLElBQUksRUFBRSxtQkFBUSxDQUFDLHFCQUFxQixDQUFDO0NBQ3RDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgcHJvZFNwZWMgZnJvbSBcIi4uL3NwZWMvZW52L3Byb2QuanNvblwiO1xuaW1wb3J0IGdhbW1hU3BlYyBmcm9tIFwiLi4vc3BlYy9lbnYvZ2FtbWEuanNvblwiO1xuaW1wb3J0IGJldGFTcGVjIGZyb20gXCIuLi9zcGVjL2Vudi9iZXRhLmpzb25cIjtcblxuZXhwb3J0IHR5cGUgRW52aXJvbm1lbnQgPVxuICAvKiogUHJvZHVjdGlvbiBlbnZpcm9ubWVudCAqL1xuICB8IFwicHJvZFwiXG4gIC8qKiBHYW1tYSwgc3RhZ2luZyBlbnZpcm9ubWVudCAqL1xuICB8IFwiZ2FtbWFcIlxuICAvKiogQmV0YSwgZGV2ZWxvcG1lbnQgZW52aXJvbm1lbnQgKi9cbiAgfCBcImJldGFcIjtcblxuZXhwb3J0IGludGVyZmFjZSBFbnZJbnRlcmZhY2Uge1xuICBDbGllbnRJZDogc3RyaW5nO1xuICBMb25nTGl2ZWRDbGllbnRJZDogc3RyaW5nO1xuICBSZWdpb246IHN0cmluZztcbiAgVXNlclBvb2xJZDogc3RyaW5nO1xuICBTaWduZXJBcGlSb290OiBzdHJpbmc7XG4gIE9yZ0V2ZW50c1RvcGljQXJuOiBzdHJpbmc7XG59XG5cbmV4cG9ydCBjb25zdCBlbnZzOiBSZWNvcmQ8RW52aXJvbm1lbnQsIEVudkludGVyZmFjZT4gPSB7XG4gIHByb2Q6IHByb2RTcGVjW1wiRGV2LUN1YmVTaWduZXJTdGFja1wiXSxcbiAgZ2FtbWE6IGdhbW1hU3BlY1tcIkRldi1DdWJlU2lnbmVyU3RhY2tcIl0sXG4gIGJldGE6IGJldGFTcGVjW1wiRGV2LUN1YmVTaWduZXJTdGFja1wiXSxcbn07XG4iXX0=