import type { C2FConfiguration, C2FFunction, Org } from "@cubist-labs/cubesigner-sdk";
import { describe, it } from "@jest/globals";
import { expect } from "chai";
import { newCubeSigner } from "./setup";
import { deleteC2FFunctions, randomInt } from "./helpers";
import { readFile } from "node:fs/promises";

describe("Confidential Cloud Functions (C2F)", () => {
  let createdFunctions: C2FFunction[];
  let org: Org;
  let originalC2FConfiguration: C2FConfiguration | undefined;

  beforeAll(async () => {
    createdFunctions = [];

    const client = await newCubeSigner();
    org = client.org();

    originalC2FConfiguration = await org.c2fConfiguration();
  });

  afterAll(async () => {
    if (originalC2FConfiguration !== undefined) {
      await org.setC2FConfiguration(originalC2FConfiguration);
    }

    await deleteC2FFunctions(createdFunctions);
  });

  it("invoke C2F function", async () => {
    console.log("Create a C2F function that always allows, then update it to deny.");
    const allow = await readFile("./test/fixtures/always_allow.wasm");
    const deny = await readFile("./test/fixtures/always_deny.wasm");
    const c2fFunction = await createWasmFunction(allow);
    await c2fFunction.setWasmPolicy(deny);

    console.log("Invoking it without any parameters should invoke the latest version");
    let resp = await c2fFunction.invoke();
    expect(resp.response.response).to.eql("Deny");

    console.log("Invoke version 0");
    resp = await c2fFunction.invoke(undefined, "v0");
    expect(resp.response.response).to.eql("Allow");
  });

  it("reads C2F functions", async () => {
    const allow = await readFile("./test/fixtures/always_allow.wasm");
    const allowFunction = await createWasmFunction(allow);

    const retrievedFunction = await org.getFunction(allowFunction.id);
    expect(retrievedFunction).to.deep.equal(allowFunction);

    const allC2FFunctions = await org.functions();
    expect(allC2FFunctions).to.deep.include(allowFunction);
  });

  it("captures C2F function output", async () => {
    const alwaysAllow = await readFile("./test/fixtures/always_allow.wasm");
    const printRequest = await readFile("./test/fixtures/print_sign_request.wasm");

    const c2fFunction = await createWasmFunction(alwaysAllow);

    console.log(`Update ${c2fFunction.id} to print requests`);
    await c2fFunction.setWasmFunction(printRequest);

    const body = "test request body";
    const printResp = await c2fFunction.invoke(undefined, "latest", body);
    expect(printResp.response).to.eql({ response: "Allow" });
    expect(printResp.stderr.toString("utf-8")).to.be.empty;
    expect(printResp.stdout.toString("utf-8")).to.eql(
      `Parsed JSON sign request: String("${body}")\n`,
    );

    // Invoke the first version of the function, which doesn't print requests
    const allowResp = await c2fFunction.invoke(undefined, "v0", body);
    expect(allowResp.response).to.eql({ response: "Allow" });
    expect(allowResp.stderr.toString("utf-8")).to.be.empty;
    expect(allowResp.stdout.toString("utf-8")).to.be.empty;
  });

  it("C2F authorities", async () => {
    const postmanGet = await readFile("./test/fixtures/postman_get.wasm");
    const c2fFunction = await createWasmFunction(postmanGet);

    console.log("Clear the Org's allowed authorities to make the policy fail.");
    await org.setC2FConfiguration({ allowed_http_authorities: [] });

    console.log(`Check that C2F function ${c2fFunction.id} fails...`);
    const errorResp = await c2fFunction.invoke(undefined);
    expect(errorResp.response.response).to.eql("Error");
    const resp = errorResp.response as { response: "Error"; error: string };
    expect(resp.error).to.contain("DestinationIpProhibited");

    console.log("Set the http authorities to ['postman-echo.com']");
    await org.setC2FConfiguration({ allowed_http_authorities: ["postman-echo.com"] });

    console.log(`Check that C2F function ${c2fFunction.id} succeeds...`);
    const allowResp = await c2fFunction.invoke(undefined);
    expect(allowResp.response.response).to.eql("Allow");
    expect(allowResp.stderr).to.be.empty;
  });

  /**
   * Helper function for creating a wasm function.
   *
   * @param wasmFunction The wasm function to create the function from.
   * @returns the created function.
   */
  const createWasmFunction = async (wasmFunction: Uint8Array) => {
    const functionName = `wasm_function_${randomInt(10000000)}`;
    console.log(`Create C2F function ${functionName}`);
    const c2fFunction = await org.createWasmFunction(functionName, wasmFunction);

    console.log(`Created ${c2fFunction.id}`);
    createdFunctions.push(c2fFunction);

    expect(await c2fFunction.name()).to.eq(functionName);
    expect(c2fFunction.policyType).to.eq("Wasm");

    return c2fFunction;
  };
});
