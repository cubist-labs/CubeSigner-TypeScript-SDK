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

  /**
   * Finds a scope item in the dictionary by its value.
   *
   * @param scopes The scopes to search.
   * @param value The value to search for.
   * @returns The scope item or undefined if not found.
   */
  function findScopeItem(scopes: ScopeItem[], value: ExplicitScope): ScopeItem | undefined {
    for (const scope of scopes) {
      if (scope.value === value) return scope;
      if (scope.children) {
        const found = findScopeItem(scope.children, value);
        if (found) return found;
      }
    }
    return undefined;
  }

  /**
   * Checks if a scope is a direct child of another scope.
   *
   * @param parent The parent scope.
   * @param childValue The value of the child scope.
   * @returns True if the scope is a direct child, false otherwise.
   */
  function isDirectChild(parent: ScopeItem, childValue: ExplicitScope): boolean {
    return parent.children?.some((child) => child.value === childValue) ?? false;
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

  it("wildcard scopes are properly nested under their parent wildcards", () => {
    const manageScopes = allScopesDictionary.manage.scopes;
    const manageStar = findScopeItem(manageScopes, "manage:*");

    expect(manageStar).to.not.be.undefined;
    expect(manageStar!.children).to.not.be.undefined;

    // Check that manage:mfa:* is a direct child of manage:*
    expect(isDirectChild(manageStar!, "manage:mfa:*")).to.be.true;

    // Check that manage:key:* is a direct child of manage:*
    expect(isDirectChild(manageStar!, "manage:key:*")).to.be.true;

    // Check that manage:policy:* is a direct child of manage:*
    expect(isDirectChild(manageStar!, "manage:policy:*")).to.be.true;
  });

  it("scopes use the longest matching parent (closest ancestor)", () => {
    const manageScopes = allScopesDictionary.manage.scopes;
    const manageStar = findScopeItem(manageScopes, "manage:*");
    const mfaStar = findScopeItem(manageScopes, "manage:mfa:*");
    const mfaVoteStar = findScopeItem(manageScopes, "manage:mfa:vote:*");

    expect(manageStar).to.not.be.undefined;
    expect(mfaStar).to.not.be.undefined;
    expect(mfaVoteStar).to.not.be.undefined;

    // manage:mfa:vote:cs should be under manage:mfa:vote:*, not manage:mfa:* or manage:*
    expect(isDirectChild(mfaVoteStar!, "manage:mfa:vote:cs")).to.be.true;
    expect(isDirectChild(mfaStar!, "manage:mfa:vote:cs")).to.be.false;
    expect(isDirectChild(manageStar!, "manage:mfa:vote:cs")).to.be.false;

    // But manage:mfa:vote:* should be under manage:mfa:*
    expect(isDirectChild(mfaStar!, "manage:mfa:vote:*")).to.be.true;

    // And manage:mfa:* should be under manage:*
    expect(isDirectChild(manageStar!, "manage:mfa:*")).to.be.true;
  });
});
