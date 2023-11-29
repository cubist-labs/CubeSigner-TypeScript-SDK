import { assert, expect } from "chai";
import { authenticator } from "otplib";
import { Org, Mnemonic, Key, SignerSession, userExportDecrypt, userExportKeygen } from "../src";
import { loadCognitoOidcToken, newCubeSigner } from "./setup";
import { deleteKeys } from "./helpers";

describe("User Export", () => {
  let mnemonic: Key;
  let org: Org;
  let totpSecret: string;
  let userExportSession: SignerSession;

  beforeAll(async () => {
    org = new Org(await newCubeSigner());
    const aboutMe = await org.aboutMe();
    expect(aboutMe.org_ids.length).to.eq(1);

    // TOTP and session
    const totpSecretFromEnv = process.env["CS_USER_TOTP_SECRET"];
    assert(
      totpSecretFromEnv,
      "The CubeSigner user must have TOTP configured and 'CS_USER_TOTP_SECRET' env var must be set to that TOTP secret",
    );
    totpSecret = totpSecretFromEnv!;
    const oidcToken = await loadCognitoOidcToken();
    // need manage:userExport for export endpoints, manage:mfa for MFA approval
    const sessionMgr = await org.oidcAuth(oidcToken, ["manage:userExport:*", "manage:mfa"]);
    userExportSession = new SignerSession(sessionMgr);

    // create a mnemonic to export later
    mnemonic = await org.createKey(Mnemonic);

    // list and delete any existing exports
    const prior_exports = await org.userExportList().fetch();
    for (const xp of prior_exports) {
      await org.userExportDelete(xp.key_id);
    }
  });

  afterAll(async () => {
    await deleteKeys([mnemonic]);
  });

  it("adjusts user export timers", async () => {
    let org_update_resp = await org.orgUpdate({
      user_export_delay: 2 * 86400,
      user_export_window: 3 * 86400,
    });
    expect(org_update_resp.user_export_delay).to.equal(2 * 86400);
    expect(org_update_resp.user_export_window).to.equal(3 * 86400);

    org_update_resp = await org.orgUpdate({
      user_export_delay: 0, // this can only be done in a test environment!
      user_export_window: 86400,
    });
    expect(org_update_resp.user_export_delay).to.equal(0);
    expect(org_update_resp.user_export_window).to.equal(86400);
  });

  it("initiates, lists, and deletes an export", async () => {
    // initiate an export
    let mne_init_resp = await org.userExportInit(mnemonic.id);
    assert(mne_init_resp.requiresMfa(), "initiating export always requires MFA");
    mne_init_resp = await mne_init_resp.approveTotp(
      userExportSession,
      authenticator.generate(totpSecret),
    );
    assert(!mne_init_resp.requiresMfa());
    const mne_init_result = mne_init_resp.data();
    expect(mne_init_result.key_id).to.equal(mnemonic.id);

    // now list it
    let mne_list_resp = await org.userExportList().fetch();
    expect(mne_list_resp.length).to.equal(1);
    expect(mne_list_resp[0].key_id).to.equal(mnemonic.id);
    // list again, this time specifying key-id
    mne_list_resp = await org.userExportList(mnemonic.id).fetch();
    expect(mne_list_resp.length).to.equal(1);
    // list for a nonexistent request
    mne_list_resp = await org
      .userExportList("Key#0x0000000000000000000000000000000000000001")
      .fetch();
    expect(mne_list_resp.length).to.equal(0);

    // finally delete it
    await org.userExportDelete(mnemonic.id);
    mne_list_resp = await org.userExportList(mnemonic.id).fetch();
    expect(mne_list_resp.length).to.equal(0);
  });

  it("initiate, complete, and decrypt an export", async () => {
    // initiate an export
    let mne_init_resp = await org.userExportInit(mnemonic.id);
    assert(mne_init_resp.requiresMfa(), "initiating export always requires MFA");
    mne_init_resp = await mne_init_resp.approveTotp(
      userExportSession,
      authenticator.generate(totpSecret),
    );
    assert(!mne_init_resp.requiresMfa());
    const mne_init_result = mne_init_resp.data();
    expect(mne_init_result.key_id).to.equal(mnemonic.id);

    // generate a key
    const export_key = await userExportKeygen();

    // complete an export
    let mne_complete_resp = await org.userExportComplete(mnemonic.id, export_key.publicKey);
    assert(mne_complete_resp.requiresMfa(), "completing export always requires MFA");
    mne_complete_resp = await mne_complete_resp.approveTotp(
      userExportSession,
      authenticator.generate(totpSecret),
    );
    assert(!mne_complete_resp.requiresMfa());
    const mne_complete_result = mne_complete_resp.data();

    // decrypt the key
    const mne_decrypted = await userExportDecrypt(export_key.privateKey, mne_complete_result);
    console.log(mne_decrypted);

    expect(mne_decrypted.key_type).to.equal("cubist-signer::mnemonic");
    expect(mne_decrypted.material_type).to.equal("english_mnemonic");
  });
});
