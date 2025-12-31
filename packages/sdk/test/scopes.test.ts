import { expect } from "chai";
import { AllScopes, allScopesDictionary, type ScopeItem } from "../src/scopes";
import { type ExplicitScope } from "../src";

describe("Scope dictionaries", () => {
  /**
   * Recursively collect all scope values and descriptions from ScopeItem array
   *
   * @param scopes The scopes to collect.
   * @returns A map of scope values to descriptions.
   */
  function collectAllScopes(scopes: ScopeItem[]): Map<string, string> {
    const result = new Map<string, string>();
    for (const scope of scopes) {
      result.set(scope.value, scope.description);
      if (scope.children) {
        const childScopes = collectAllScopes(scope.children);
        childScopes.forEach((desc, value) => result.set(value, desc));
      }
    }
    return result;
  }

  it("all AllScopes keys and descriptions exist in allScopesDictionary", () => {
    // Collect all scopes from dictionary
    const dictionaryScopes = new Map<string, string>();
    for (const category of Object.values(allScopesDictionary)) {
      for (const scope of category.scopes) {
        const scopes = collectAllScopes([scope]);
        scopes.forEach((desc, value) => dictionaryScopes.set(value, desc));
      }
    }

    // Check all AllScopes keys exist in dictionary with matching descriptions
    const allScopeKeys = Object.keys(AllScopes) as ExplicitScope[];
    const missing: string[] = [];
    const mismatched: Array<{ scope: string; expected: string; actual: string }> = [];

    for (const scope of allScopeKeys) {
      const expectedDescription = AllScopes[scope];
      const actualDescription = dictionaryScopes.get(scope);

      if (!actualDescription) {
        missing.push(scope);
      } else if (actualDescription !== expectedDescription) {
        mismatched.push({
          scope,
          expected: expectedDescription,
          actual: actualDescription,
        });
      }
    }

    if (missing.length > 0) {
      console.error("Scopes missing from allScopesDictionary:", missing);
    }

    if (mismatched.length > 0) {
      console.error("Description mismatches:");
      for (const { scope, expected, actual } of mismatched) {
        console.error(`  ${scope}:`);
        console.error(`    Expected: ${expected}`);
        console.error(`    Actual:   ${actual}`);
      }
    }

    expect(missing.length).to.eq(
      0,
      `Found ${missing.length} scope(s) missing from allScopesDictionary`,
    );
    expect(mismatched.length).to.eq(0, `Found ${mismatched.length} description mismatch(es)`);
  });
});
