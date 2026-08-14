import { z } from "zod/mini";
export declare const auditLogEntrySchema: z.ZodMiniDiscriminatedUnion<[z.ZodMiniObject<{
    event: z.ZodMiniLiteral<"Billing">;
    kind: z.ZodMiniCustom<"attestationJwkSet" | "email_my_orgs" | "sentryApiCallPublic" | "mmiJwkSet" | "mmi" | "oauth2TokenRefresh" | "getOrg" | "updateOrg" | "queryAuditLog" | "authMigrationIdentityAdd" | "authMigrationIdentityRemove" | "authMigrationUserUpdate" | "avaSerializedTxSign" | "avaSign" | "babylonCovSign" | "createEotsNonces" | "eotsSign" | "babylonRegistration" | "babylonStaking" | "btcMessageSign" | "psbtSign" | "btcSign" | "btcTaprootSign" | "listContacts" | "createContact" | "lookupContactsByAddress" | "getContact" | "deleteContact" | "updateContact" | "counts" | "deriveKey" | "diffieHellmanExchange" | "getEmailConfig" | "configureEmail" | "deleteEmailConfig" | "eip191Sign" | "eip712Sign" | "eip7702Sign" | "getOrgExport" | "listOidcIdentities" | "addOidcIdentity" | "removeOidcIdentity" | "createProofCubeSigner" | "createProofOidc" | "verifyProof" | "idpAuthenticate" | "idpPasswordResetRequest" | "idpPasswordResetConfirm" | "createKeyImportKey" | "importKey" | "public_org_info" | "customChainRpcCall" | "esploraApiCall" | "sentryApiCall" | "invitationAccept" | "listInvitations" | "cancelInvitation" | "invite" | "listKeysInOrg" | "createKey" | "getKeyInOrg" | "deleteKey" | "updateKey" | "attestKey" | "listKeyRoles" | "listHistoricalKeyTx" | "getKeyByMaterialId" | "queryMetrics" | "mfaList" | "mfaGet" | "mfaEmailInit" | "mfaFidoInit" | "mmiMessageList" | "mmiMessageGet" | "mmiMessageDelete" | "mmiMessageReject" | "mmiMessageSign" | "oauth2Twitter" | "oidcAuth" | "emailOtpAuth" | "siweInit" | "siweComplete" | "siwsInit" | "siwsComplete" | "telegramAuth" | "createOrg" | "listPolicies" | "createPolicy" | "deletePolicy" | "updatePolicy" | "getPolicyLogs" | "getPolicy" | "invokePolicy" | "listPolicyBuckets" | "getPolicyBucket" | "updatePolicyBucket" | "createPolicyImportKey" | "getPolicySecrets" | "updatePolicySecrets" | "setPolicySecret" | "deletePolicySecret" | "uploadWasmPolicy" | "listRoles" | "createRole" | "getRole" | "deleteRole" | "updateRole" | "addKeysToRole" | "addUserToRole" | "attestRole" | "listRoleKeys" | "getRoleKey" | "removeKeyFromRole" | "createRoleToken" | "listHistoricalRoleTx" | "listRoleUsers" | "removeUserFromRole" | "rpcApi" | "listSessions" | "createSession" | "revokeSessions" | "revokeCurrentSession" | "getSession" | "revokeSession" | "solanaSign" | "suiSign" | "tendermintSign" | "listTokenKeys" | "aboutMe" | "userResetEmailInit" | "userResetEmailComplete" | "userExportList" | "userExportInit" | "userExportDelete" | "userExportComplete" | "userRegisterFidoInit" | "userRegisterFidoComplete" | "userDeleteFido" | "userResetTotpInit" | "userDeleteTotp" | "userResetTotpComplete" | "userVerifyTotp" | "listUsersInOrg" | "createOidcUser" | "getUserInOrgByEmail" | "deleteOidcUser" | "getUserInOrgByOidc" | "resetMemberMfa" | "completeResetMemberMfa" | "getUserInOrg" | "deleteUser" | "updateUserMembership" | "passkeyAuthInit" | "passkeyAuthComplete" | "userOrgs" | "blobSign" | "cube3signerHeartbeat" | "eth1Sign" | "eth2Sign" | "stake" | "unstake" | "signerSessionRefresh" | "mfaApproveCs" | "mfaRejectCs" | "mfaApproveTotp" | "mfaRejectTotp" | "mfaApproveFidoComplete" | "mfaRejectFidoComplete" | "mfaEmailComplete" | "binanceSign" | "bybitSign" | "coinbaseSign" | "psbtLegacyInputSign" | "psbtSegwitInputSign" | "psbtTaprootInputSign" | "keyCreated" | "keyImported" | "rpcCreateTransaction" | "rpcGetTransaction" | "rpcListTransactions" | "rpcBtcListUtxos" | "rpcRetryTransaction" | "rpcCancelTransaction" | "rpcBinance" | "rpcBybit" | "rpcCoinbase", "attestationJwkSet" | "email_my_orgs" | "sentryApiCallPublic" | "mmiJwkSet" | "mmi" | "oauth2TokenRefresh" | "getOrg" | "updateOrg" | "queryAuditLog" | "authMigrationIdentityAdd" | "authMigrationIdentityRemove" | "authMigrationUserUpdate" | "avaSerializedTxSign" | "avaSign" | "babylonCovSign" | "createEotsNonces" | "eotsSign" | "babylonRegistration" | "babylonStaking" | "btcMessageSign" | "psbtSign" | "btcSign" | "btcTaprootSign" | "listContacts" | "createContact" | "lookupContactsByAddress" | "getContact" | "deleteContact" | "updateContact" | "counts" | "deriveKey" | "diffieHellmanExchange" | "getEmailConfig" | "configureEmail" | "deleteEmailConfig" | "eip191Sign" | "eip712Sign" | "eip7702Sign" | "getOrgExport" | "listOidcIdentities" | "addOidcIdentity" | "removeOidcIdentity" | "createProofCubeSigner" | "createProofOidc" | "verifyProof" | "idpAuthenticate" | "idpPasswordResetRequest" | "idpPasswordResetConfirm" | "createKeyImportKey" | "importKey" | "public_org_info" | "customChainRpcCall" | "esploraApiCall" | "sentryApiCall" | "invitationAccept" | "listInvitations" | "cancelInvitation" | "invite" | "listKeysInOrg" | "createKey" | "getKeyInOrg" | "deleteKey" | "updateKey" | "attestKey" | "listKeyRoles" | "listHistoricalKeyTx" | "getKeyByMaterialId" | "queryMetrics" | "mfaList" | "mfaGet" | "mfaEmailInit" | "mfaFidoInit" | "mmiMessageList" | "mmiMessageGet" | "mmiMessageDelete" | "mmiMessageReject" | "mmiMessageSign" | "oauth2Twitter" | "oidcAuth" | "emailOtpAuth" | "siweInit" | "siweComplete" | "siwsInit" | "siwsComplete" | "telegramAuth" | "createOrg" | "listPolicies" | "createPolicy" | "deletePolicy" | "updatePolicy" | "getPolicyLogs" | "getPolicy" | "invokePolicy" | "listPolicyBuckets" | "getPolicyBucket" | "updatePolicyBucket" | "createPolicyImportKey" | "getPolicySecrets" | "updatePolicySecrets" | "setPolicySecret" | "deletePolicySecret" | "uploadWasmPolicy" | "listRoles" | "createRole" | "getRole" | "deleteRole" | "updateRole" | "addKeysToRole" | "addUserToRole" | "attestRole" | "listRoleKeys" | "getRoleKey" | "removeKeyFromRole" | "createRoleToken" | "listHistoricalRoleTx" | "listRoleUsers" | "removeUserFromRole" | "rpcApi" | "listSessions" | "createSession" | "revokeSessions" | "revokeCurrentSession" | "getSession" | "revokeSession" | "solanaSign" | "suiSign" | "tendermintSign" | "listTokenKeys" | "aboutMe" | "userResetEmailInit" | "userResetEmailComplete" | "userExportList" | "userExportInit" | "userExportDelete" | "userExportComplete" | "userRegisterFidoInit" | "userRegisterFidoComplete" | "userDeleteFido" | "userResetTotpInit" | "userDeleteTotp" | "userResetTotpComplete" | "userVerifyTotp" | "listUsersInOrg" | "createOidcUser" | "getUserInOrgByEmail" | "deleteOidcUser" | "getUserInOrgByOidc" | "resetMemberMfa" | "completeResetMemberMfa" | "getUserInOrg" | "deleteUser" | "updateUserMembership" | "passkeyAuthInit" | "passkeyAuthComplete" | "userOrgs" | "blobSign" | "cube3signerHeartbeat" | "eth1Sign" | "eth2Sign" | "stake" | "unstake" | "signerSessionRefresh" | "mfaApproveCs" | "mfaRejectCs" | "mfaApproveTotp" | "mfaRejectTotp" | "mfaApproveFidoComplete" | "mfaRejectFidoComplete" | "mfaEmailComplete" | "binanceSign" | "bybitSign" | "coinbaseSign" | "psbtLegacyInputSign" | "psbtSegwitInputSign" | "psbtTaprootInputSign" | "keyCreated" | "keyImported" | "rpcCreateTransaction" | "rpcGetTransaction" | "rpcListTransactions" | "rpcBtcListUtxos" | "rpcRetryTransaction" | "rpcCancelTransaction" | "rpcBinance" | "rpcBybit" | "rpcCoinbase">;
    user_id: z.ZodMiniOptional<z.ZodMiniString<string>>;
    role_id: z.ZodMiniOptional<z.ZodMiniString<string>>;
    key_id: z.ZodMiniOptional<z.ZodMiniString<string>>;
    /** UUID uniquely identifying this event across all events. */
    event_id: z.ZodMiniString<string>;
    /** The org in which this event occurred. */
    org_id: z.ZodMiniString<string>;
    /** ID of the HTTP request that triggered this event (one request can trigger multiple events). */
    request_id: z.ZodMiniString<string>;
    /** Timestamp of when the event was logged, formatted like YYYY-MM-DD HH:MM:SS.NNNNNNNNN */
    time: z.ZodMiniString<string>;
    /** ID of the user or role that triggered the event; absent for unauthenticated endpoints. */
    triggered_by: z.ZodMiniNullable<z.ZodMiniString<string>>;
}, z.core.$strip>, z.ZodMiniObject<{
    event: z.ZodMiniLiteral<"Response">;
    kind: z.ZodMiniCustom<"attestationJwkSet" | "email_my_orgs" | "sentryApiCallPublic" | "mmiJwkSet" | "mmi" | "oauth2TokenRefresh" | "getOrg" | "updateOrg" | "queryAuditLog" | "authMigrationIdentityAdd" | "authMigrationIdentityRemove" | "authMigrationUserUpdate" | "avaSerializedTxSign" | "avaSign" | "babylonCovSign" | "createEotsNonces" | "eotsSign" | "babylonRegistration" | "babylonStaking" | "btcMessageSign" | "psbtSign" | "btcSign" | "btcTaprootSign" | "listContacts" | "createContact" | "lookupContactsByAddress" | "getContact" | "deleteContact" | "updateContact" | "counts" | "deriveKey" | "diffieHellmanExchange" | "getEmailConfig" | "configureEmail" | "deleteEmailConfig" | "eip191Sign" | "eip712Sign" | "eip7702Sign" | "getOrgExport" | "listOidcIdentities" | "addOidcIdentity" | "removeOidcIdentity" | "createProofCubeSigner" | "createProofOidc" | "verifyProof" | "idpAuthenticate" | "idpPasswordResetRequest" | "idpPasswordResetConfirm" | "createKeyImportKey" | "importKey" | "public_org_info" | "customChainRpcCall" | "esploraApiCall" | "sentryApiCall" | "invitationAccept" | "listInvitations" | "cancelInvitation" | "invite" | "listKeysInOrg" | "createKey" | "getKeyInOrg" | "deleteKey" | "updateKey" | "attestKey" | "listKeyRoles" | "listHistoricalKeyTx" | "getKeyByMaterialId" | "queryMetrics" | "mfaList" | "mfaGet" | "mfaEmailInit" | "mfaFidoInit" | "mmiMessageList" | "mmiMessageGet" | "mmiMessageDelete" | "mmiMessageReject" | "mmiMessageSign" | "oauth2Twitter" | "oidcAuth" | "emailOtpAuth" | "siweInit" | "siweComplete" | "siwsInit" | "siwsComplete" | "telegramAuth" | "createOrg" | "listPolicies" | "createPolicy" | "deletePolicy" | "updatePolicy" | "getPolicyLogs" | "getPolicy" | "invokePolicy" | "listPolicyBuckets" | "getPolicyBucket" | "updatePolicyBucket" | "createPolicyImportKey" | "getPolicySecrets" | "updatePolicySecrets" | "setPolicySecret" | "deletePolicySecret" | "uploadWasmPolicy" | "listRoles" | "createRole" | "getRole" | "deleteRole" | "updateRole" | "addKeysToRole" | "addUserToRole" | "attestRole" | "listRoleKeys" | "getRoleKey" | "removeKeyFromRole" | "createRoleToken" | "listHistoricalRoleTx" | "listRoleUsers" | "removeUserFromRole" | "rpcApi" | "listSessions" | "createSession" | "revokeSessions" | "revokeCurrentSession" | "getSession" | "revokeSession" | "solanaSign" | "suiSign" | "tendermintSign" | "listTokenKeys" | "aboutMe" | "userResetEmailInit" | "userResetEmailComplete" | "userExportList" | "userExportInit" | "userExportDelete" | "userExportComplete" | "userRegisterFidoInit" | "userRegisterFidoComplete" | "userDeleteFido" | "userResetTotpInit" | "userDeleteTotp" | "userResetTotpComplete" | "userVerifyTotp" | "listUsersInOrg" | "createOidcUser" | "getUserInOrgByEmail" | "deleteOidcUser" | "getUserInOrgByOidc" | "resetMemberMfa" | "completeResetMemberMfa" | "getUserInOrg" | "deleteUser" | "updateUserMembership" | "passkeyAuthInit" | "passkeyAuthComplete" | "userOrgs" | "blobSign" | "cube3signerHeartbeat" | "eth1Sign" | "eth2Sign" | "stake" | "unstake" | "signerSessionRefresh" | "mfaApproveCs" | "mfaRejectCs" | "mfaApproveTotp" | "mfaRejectTotp" | "mfaApproveFidoComplete" | "mfaRejectFidoComplete" | "mfaEmailComplete" | "binanceSign" | "bybitSign" | "coinbaseSign" | "psbtLegacyInputSign" | "psbtSegwitInputSign" | "psbtTaprootInputSign" | "keyCreated" | "keyImported" | "rpcCreateTransaction" | "rpcGetTransaction" | "rpcListTransactions" | "rpcBtcListUtxos" | "rpcRetryTransaction" | "rpcCancelTransaction" | "rpcBinance" | "rpcBybit" | "rpcCoinbase", "attestationJwkSet" | "email_my_orgs" | "sentryApiCallPublic" | "mmiJwkSet" | "mmi" | "oauth2TokenRefresh" | "getOrg" | "updateOrg" | "queryAuditLog" | "authMigrationIdentityAdd" | "authMigrationIdentityRemove" | "authMigrationUserUpdate" | "avaSerializedTxSign" | "avaSign" | "babylonCovSign" | "createEotsNonces" | "eotsSign" | "babylonRegistration" | "babylonStaking" | "btcMessageSign" | "psbtSign" | "btcSign" | "btcTaprootSign" | "listContacts" | "createContact" | "lookupContactsByAddress" | "getContact" | "deleteContact" | "updateContact" | "counts" | "deriveKey" | "diffieHellmanExchange" | "getEmailConfig" | "configureEmail" | "deleteEmailConfig" | "eip191Sign" | "eip712Sign" | "eip7702Sign" | "getOrgExport" | "listOidcIdentities" | "addOidcIdentity" | "removeOidcIdentity" | "createProofCubeSigner" | "createProofOidc" | "verifyProof" | "idpAuthenticate" | "idpPasswordResetRequest" | "idpPasswordResetConfirm" | "createKeyImportKey" | "importKey" | "public_org_info" | "customChainRpcCall" | "esploraApiCall" | "sentryApiCall" | "invitationAccept" | "listInvitations" | "cancelInvitation" | "invite" | "listKeysInOrg" | "createKey" | "getKeyInOrg" | "deleteKey" | "updateKey" | "attestKey" | "listKeyRoles" | "listHistoricalKeyTx" | "getKeyByMaterialId" | "queryMetrics" | "mfaList" | "mfaGet" | "mfaEmailInit" | "mfaFidoInit" | "mmiMessageList" | "mmiMessageGet" | "mmiMessageDelete" | "mmiMessageReject" | "mmiMessageSign" | "oauth2Twitter" | "oidcAuth" | "emailOtpAuth" | "siweInit" | "siweComplete" | "siwsInit" | "siwsComplete" | "telegramAuth" | "createOrg" | "listPolicies" | "createPolicy" | "deletePolicy" | "updatePolicy" | "getPolicyLogs" | "getPolicy" | "invokePolicy" | "listPolicyBuckets" | "getPolicyBucket" | "updatePolicyBucket" | "createPolicyImportKey" | "getPolicySecrets" | "updatePolicySecrets" | "setPolicySecret" | "deletePolicySecret" | "uploadWasmPolicy" | "listRoles" | "createRole" | "getRole" | "deleteRole" | "updateRole" | "addKeysToRole" | "addUserToRole" | "attestRole" | "listRoleKeys" | "getRoleKey" | "removeKeyFromRole" | "createRoleToken" | "listHistoricalRoleTx" | "listRoleUsers" | "removeUserFromRole" | "rpcApi" | "listSessions" | "createSession" | "revokeSessions" | "revokeCurrentSession" | "getSession" | "revokeSession" | "solanaSign" | "suiSign" | "tendermintSign" | "listTokenKeys" | "aboutMe" | "userResetEmailInit" | "userResetEmailComplete" | "userExportList" | "userExportInit" | "userExportDelete" | "userExportComplete" | "userRegisterFidoInit" | "userRegisterFidoComplete" | "userDeleteFido" | "userResetTotpInit" | "userDeleteTotp" | "userResetTotpComplete" | "userVerifyTotp" | "listUsersInOrg" | "createOidcUser" | "getUserInOrgByEmail" | "deleteOidcUser" | "getUserInOrgByOidc" | "resetMemberMfa" | "completeResetMemberMfa" | "getUserInOrg" | "deleteUser" | "updateUserMembership" | "passkeyAuthInit" | "passkeyAuthComplete" | "userOrgs" | "blobSign" | "cube3signerHeartbeat" | "eth1Sign" | "eth2Sign" | "stake" | "unstake" | "signerSessionRefresh" | "mfaApproveCs" | "mfaRejectCs" | "mfaApproveTotp" | "mfaRejectTotp" | "mfaApproveFidoComplete" | "mfaRejectFidoComplete" | "mfaEmailComplete" | "binanceSign" | "bybitSign" | "coinbaseSign" | "psbtLegacyInputSign" | "psbtSegwitInputSign" | "psbtTaprootInputSign" | "keyCreated" | "keyImported" | "rpcCreateTransaction" | "rpcGetTransaction" | "rpcListTransactions" | "rpcBtcListUtxos" | "rpcRetryTransaction" | "rpcCancelTransaction" | "rpcBinance" | "rpcBybit" | "rpcCoinbase">;
    status: z.ZodMiniNumber<unknown>;
    duration_ms: z.ZodMiniNumber<unknown>;
    /** UUID uniquely identifying this event across all events. */
    event_id: z.ZodMiniString<string>;
    /** The org in which this event occurred. */
    org_id: z.ZodMiniString<string>;
    /** ID of the HTTP request that triggered this event (one request can trigger multiple events). */
    request_id: z.ZodMiniString<string>;
    /** Timestamp of when the event was logged, formatted like YYYY-MM-DD HH:MM:SS.NNNNNNNNN */
    time: z.ZodMiniString<string>;
    /** ID of the user or role that triggered the event; absent for unauthenticated endpoints. */
    triggered_by: z.ZodMiniNullable<z.ZodMiniString<string>>;
}, z.core.$strip>, z.ZodMiniObject<{
    event: z.ZodMiniLiteral<"OidcAuth">;
    issuer: z.ZodMiniString<string>;
    membership: z.ZodMiniCustom<"Alien" | "Member" | "Owner", "Alien" | "Member" | "Owner">;
    email: z.ZodMiniOptional<z.ZodMiniString<string>>;
    username: z.ZodMiniOptional<z.ZodMiniString<string>>;
    scopes: z.ZodMiniPipe<z.ZodMiniString<string>, z.ZodMiniTransform<string[], string>>;
    /** UUID uniquely identifying this event across all events. */
    event_id: z.ZodMiniString<string>;
    /** The org in which this event occurred. */
    org_id: z.ZodMiniString<string>;
    /** ID of the HTTP request that triggered this event (one request can trigger multiple events). */
    request_id: z.ZodMiniString<string>;
    /** Timestamp of when the event was logged, formatted like YYYY-MM-DD HH:MM:SS.NNNNNNNNN */
    time: z.ZodMiniString<string>;
    /** ID of the user or role that triggered the event; absent for unauthenticated endpoints. */
    triggered_by: z.ZodMiniNullable<z.ZodMiniString<string>>;
}, z.core.$strip>, z.ZodMiniObject<{
    event: z.ZodMiniLiteral<"Signed">;
    kind: z.ZodMiniCustom<"Eth2Unstake" | "BabylonStaking" | "BabylonCovSign" | "AvaSign" | "AvaChainTxSign" | "BabylonRegistration" | "BinanceSubToMaster" | "BinanceSubToSub" | "BinanceUniversalTransfer" | "BinanceSubAccountAssets" | "BinanceAccountInfo" | "BinanceSubAccountTransferHistory" | "BinanceUniversalTransferHistory" | "BinanceWithdraw" | "BinanceWithdrawHistory" | "BinanceDeposit" | "BinanceDepositHistory" | "BinanceListSubAccounts" | "BinanceCoinInfo" | "BinanceSubAccountDepositAddress" | "BlobSign" | "BtcMessageSign" | "BtcSign" | "BybitQueryUser" | "BybitQuerySubMembers" | "BybitQueryCoinsBalance" | "BybitQueryDepositAddress" | "BybitUniversalTransfer" | "BybitWithdraw" | "BybitWithdrawals" | "BybitQueryCoinInfo" | "BybitDepositHistory" | "BybitUniversalTransferHistory" | "BybitQueryWithdrawAddress" | "BybitQuerySubDepositAddress" | "CoinbaseListAccounts" | "CoinbaseListPortfolios" | "CoinbaseMoveFunds" | "DiffieHellman" | "PsbtSign" | "TaprootSign" | "Eip191Sign" | "Eip712Sign" | "Eip7702Sign" | "EotsNonces" | "EotsSign" | "Eth1Sign" | "Eth2Sign" | "Eth2Stake" | "SolanaSign" | "SuiSign" | "TendermintSign" | "RoleUpdate", "Eth2Unstake" | "BabylonStaking" | "BabylonCovSign" | "AvaSign" | "AvaChainTxSign" | "BabylonRegistration" | "BinanceSubToMaster" | "BinanceSubToSub" | "BinanceUniversalTransfer" | "BinanceSubAccountAssets" | "BinanceAccountInfo" | "BinanceSubAccountTransferHistory" | "BinanceUniversalTransferHistory" | "BinanceWithdraw" | "BinanceWithdrawHistory" | "BinanceDeposit" | "BinanceDepositHistory" | "BinanceListSubAccounts" | "BinanceCoinInfo" | "BinanceSubAccountDepositAddress" | "BlobSign" | "BtcMessageSign" | "BtcSign" | "BybitQueryUser" | "BybitQuerySubMembers" | "BybitQueryCoinsBalance" | "BybitQueryDepositAddress" | "BybitUniversalTransfer" | "BybitWithdraw" | "BybitWithdrawals" | "BybitQueryCoinInfo" | "BybitDepositHistory" | "BybitUniversalTransferHistory" | "BybitQueryWithdrawAddress" | "BybitQuerySubDepositAddress" | "CoinbaseListAccounts" | "CoinbaseListPortfolios" | "CoinbaseMoveFunds" | "DiffieHellman" | "PsbtSign" | "TaprootSign" | "Eip191Sign" | "Eip712Sign" | "Eip7702Sign" | "EotsNonces" | "EotsSign" | "Eth1Sign" | "Eth2Sign" | "Eth2Stake" | "SolanaSign" | "SuiSign" | "TendermintSign" | "RoleUpdate">;
    key_type: z.ZodMiniCustom<"SecpEthAddr" | "SecpBtc" | "SecpBtcTest" | "SecpBtcLegacy" | "SecpBtcLegacyTest" | "SecpAvaAddr" | "SecpAvaTestAddr" | "BlsPub" | "BlsInactive" | "BlsAvaIcm" | "Ed25519SolanaAddr" | "Ed25519SuiAddr" | "Ed25519AptosAddr" | "Ed25519CardanoAddrVk" | "Ed25519StellarAddr" | "Ed25519SubstrateAddr" | "Ed25519CantonAddr" | "Ed25519BinanceApi" | "Ed25519CoinbaseApi" | "Mnemonic" | "Stark" | "BabylonEots" | "BabylonCov" | "TaprootBtc" | "TaprootBtcTest" | "SecpCosmosAddr" | "P256CosmosAddr" | "P256OntologyAddr" | "P256Neo3Addr" | "Ed25519TendermintAddr" | "SecpTronAddr" | "Ed25519TonAddr" | "SecpDogeAddr" | "SecpDogeTestAddr" | "SecpKaspaAddr" | "SecpKaspaTestAddr" | "SchnorrKaspaAddr" | "SchnorrKaspaTestAddr" | "SecpLtc" | "SecpLtcTest" | "SecpXrpAddr" | "Ed25519XrpAddr" | "BabyJubjub" | "HmacSha256" | "HmacSha256Bybit", "SecpEthAddr" | "SecpBtc" | "SecpBtcTest" | "SecpBtcLegacy" | "SecpBtcLegacyTest" | "SecpAvaAddr" | "SecpAvaTestAddr" | "BlsPub" | "BlsInactive" | "BlsAvaIcm" | "Ed25519SolanaAddr" | "Ed25519SuiAddr" | "Ed25519AptosAddr" | "Ed25519CardanoAddrVk" | "Ed25519StellarAddr" | "Ed25519SubstrateAddr" | "Ed25519CantonAddr" | "Ed25519BinanceApi" | "Ed25519CoinbaseApi" | "Mnemonic" | "Stark" | "BabylonEots" | "BabylonCov" | "TaprootBtc" | "TaprootBtcTest" | "SecpCosmosAddr" | "P256CosmosAddr" | "P256OntologyAddr" | "P256Neo3Addr" | "Ed25519TendermintAddr" | "SecpTronAddr" | "Ed25519TonAddr" | "SecpDogeAddr" | "SecpDogeTestAddr" | "SecpKaspaAddr" | "SecpKaspaTestAddr" | "SchnorrKaspaAddr" | "SchnorrKaspaTestAddr" | "SecpLtc" | "SecpLtcTest" | "SecpXrpAddr" | "Ed25519XrpAddr" | "BabyJubjub" | "HmacSha256" | "HmacSha256Bybit">;
    key_id: z.ZodMiniString<string>;
    /** UUID uniquely identifying this event across all events. */
    event_id: z.ZodMiniString<string>;
    /** The org in which this event occurred. */
    org_id: z.ZodMiniString<string>;
    /** ID of the HTTP request that triggered this event (one request can trigger multiple events). */
    request_id: z.ZodMiniString<string>;
    /** Timestamp of when the event was logged, formatted like YYYY-MM-DD HH:MM:SS.NNNNNNNNN */
    time: z.ZodMiniString<string>;
    /** ID of the user or role that triggered the event; absent for unauthenticated endpoints. */
    triggered_by: z.ZodMiniNullable<z.ZodMiniString<string>>;
}, z.core.$strip>, z.ZodMiniObject<{
    event: z.ZodMiniLiteral<"BabylonEotsConcurrentSigning">;
    key_id: z.ZodMiniString<string>;
    chain_id: z.ZodMiniString<string>;
    prev_block_height: z.ZodMiniNumber<unknown>;
    prev_signing_hash: z.ZodMiniString<string>;
    req_block_height: z.ZodMiniNumber<unknown>;
    req_signing_hash: z.ZodMiniString<string>;
    /** UUID uniquely identifying this event across all events. */
    event_id: z.ZodMiniString<string>;
    /** The org in which this event occurred. */
    org_id: z.ZodMiniString<string>;
    /** ID of the HTTP request that triggered this event (one request can trigger multiple events). */
    request_id: z.ZodMiniString<string>;
    /** Timestamp of when the event was logged, formatted like YYYY-MM-DD HH:MM:SS.NNNNNNNNN */
    time: z.ZodMiniString<string>;
    /** ID of the user or role that triggered the event; absent for unauthenticated endpoints. */
    triggered_by: z.ZodMiniNullable<z.ZodMiniString<string>>;
}, z.core.$strip>, z.ZodMiniObject<{
    event: z.ZodMiniLiteral<"Eth2ConcurrentAttestationSigning">;
    key_id: z.ZodMiniString<string>;
    /** UUID uniquely identifying this event across all events. */
    event_id: z.ZodMiniString<string>;
    /** The org in which this event occurred. */
    org_id: z.ZodMiniString<string>;
    /** ID of the HTTP request that triggered this event (one request can trigger multiple events). */
    request_id: z.ZodMiniString<string>;
    /** Timestamp of when the event was logged, formatted like YYYY-MM-DD HH:MM:SS.NNNNNNNNN */
    time: z.ZodMiniString<string>;
    /** ID of the user or role that triggered the event; absent for unauthenticated endpoints. */
    triggered_by: z.ZodMiniNullable<z.ZodMiniString<string>>;
}, z.core.$strip>, z.ZodMiniObject<{
    event: z.ZodMiniLiteral<"Eth2ConcurrentBlockSigning">;
    key_id: z.ZodMiniString<string>;
    /** UUID uniquely identifying this event across all events. */
    event_id: z.ZodMiniString<string>;
    /** The org in which this event occurred. */
    org_id: z.ZodMiniString<string>;
    /** ID of the HTTP request that triggered this event (one request can trigger multiple events). */
    request_id: z.ZodMiniString<string>;
    /** Timestamp of when the event was logged, formatted like YYYY-MM-DD HH:MM:SS.NNNNNNNNN */
    time: z.ZodMiniString<string>;
    /** ID of the user or role that triggered the event; absent for unauthenticated endpoints. */
    triggered_by: z.ZodMiniNullable<z.ZodMiniString<string>>;
}, z.core.$strip>, z.ZodMiniObject<{
    event: z.ZodMiniLiteral<"Eth2InvalidBlockProposerSlotTooLow">;
    slot: z.ZodMiniNumber<unknown>;
    signing_root: z.ZodMiniString<string>;
    last_slot: z.ZodMiniNumber<unknown>;
    last_signing_root: z.ZodMiniString<string>;
    enforced: z.ZodMiniBoolean<unknown>;
    /** UUID uniquely identifying this event across all events. */
    event_id: z.ZodMiniString<string>;
    /** The org in which this event occurred. */
    org_id: z.ZodMiniString<string>;
    /** ID of the HTTP request that triggered this event (one request can trigger multiple events). */
    request_id: z.ZodMiniString<string>;
    /** Timestamp of when the event was logged, formatted like YYYY-MM-DD HH:MM:SS.NNNNNNNNN */
    time: z.ZodMiniString<string>;
    /** ID of the user or role that triggered the event; absent for unauthenticated endpoints. */
    triggered_by: z.ZodMiniNullable<z.ZodMiniString<string>>;
}, z.core.$strip>, z.ZodMiniObject<{
    event: z.ZodMiniLiteral<"Eth2InvalidAttestationSourceEpochTooLow">;
    source_epoch: z.ZodMiniNumber<unknown>;
    signing_root: z.ZodMiniString<string>;
    last_target_epoch: z.ZodMiniNumber<unknown>;
    last_signing_root: z.ZodMiniString<string>;
    enforced: z.ZodMiniBoolean<unknown>;
    /** UUID uniquely identifying this event across all events. */
    event_id: z.ZodMiniString<string>;
    /** The org in which this event occurred. */
    org_id: z.ZodMiniString<string>;
    /** ID of the HTTP request that triggered this event (one request can trigger multiple events). */
    request_id: z.ZodMiniString<string>;
    /** Timestamp of when the event was logged, formatted like YYYY-MM-DD HH:MM:SS.NNNNNNNNN */
    time: z.ZodMiniString<string>;
    /** ID of the user or role that triggered the event; absent for unauthenticated endpoints. */
    triggered_by: z.ZodMiniNullable<z.ZodMiniString<string>>;
}, z.core.$strip>, z.ZodMiniObject<{
    event: z.ZodMiniLiteral<"Eth2InvalidAttestationTargetEpochTooLow">;
    target_epoch: z.ZodMiniNumber<unknown>;
    signing_root: z.ZodMiniString<string>;
    last_target_epoch: z.ZodMiniNumber<unknown>;
    last_signing_root: z.ZodMiniString<string>;
    enforced: z.ZodMiniBoolean<unknown>;
    /** UUID uniquely identifying this event across all events. */
    event_id: z.ZodMiniString<string>;
    /** The org in which this event occurred. */
    org_id: z.ZodMiniString<string>;
    /** ID of the HTTP request that triggered this event (one request can trigger multiple events). */
    request_id: z.ZodMiniString<string>;
    /** Timestamp of when the event was logged, formatted like YYYY-MM-DD HH:MM:SS.NNNNNNNNN */
    time: z.ZodMiniString<string>;
    /** ID of the user or role that triggered the event; absent for unauthenticated endpoints. */
    triggered_by: z.ZodMiniNullable<z.ZodMiniString<string>>;
}, z.core.$strip>, z.ZodMiniObject<{
    event: z.ZodMiniLiteral<"Eth2Unstake">;
    key_id: z.ZodMiniString<string>;
    validator_index: z.ZodMiniNumber<unknown>;
    daily_unstake_count: z.ZodMiniNumber<unknown>;
    /** UUID uniquely identifying this event across all events. */
    event_id: z.ZodMiniString<string>;
    /** The org in which this event occurred. */
    org_id: z.ZodMiniString<string>;
    /** ID of the HTTP request that triggered this event (one request can trigger multiple events). */
    request_id: z.ZodMiniString<string>;
    /** Timestamp of when the event was logged, formatted like YYYY-MM-DD HH:MM:SS.NNNNNNNNN */
    time: z.ZodMiniString<string>;
    /** ID of the user or role that triggered the event; absent for unauthenticated endpoints. */
    triggered_by: z.ZodMiniNullable<z.ZodMiniString<string>>;
}, z.core.$strip>, z.ZodMiniObject<{
    event: z.ZodMiniLiteral<"Eth2ExceededMaxUnstake">;
    max: z.ZodMiniNumber<unknown>;
    date: z.ZodMiniString<string>;
    /** UUID uniquely identifying this event across all events. */
    event_id: z.ZodMiniString<string>;
    /** The org in which this event occurred. */
    org_id: z.ZodMiniString<string>;
    /** ID of the HTTP request that triggered this event (one request can trigger multiple events). */
    request_id: z.ZodMiniString<string>;
    /** Timestamp of when the event was logged, formatted like YYYY-MM-DD HH:MM:SS.NNNNNNNNN */
    time: z.ZodMiniString<string>;
    /** ID of the user or role that triggered the event; absent for unauthenticated endpoints. */
    triggered_by: z.ZodMiniNullable<z.ZodMiniString<string>>;
}, z.core.$strip>, z.ZodMiniObject<{
    event: z.ZodMiniLiteral<"KeyCreated">;
    key_type: z.ZodMiniCustom<"SecpEthAddr" | "SecpBtc" | "SecpBtcTest" | "SecpBtcLegacy" | "SecpBtcLegacyTest" | "SecpAvaAddr" | "SecpAvaTestAddr" | "BlsPub" | "BlsInactive" | "BlsAvaIcm" | "Ed25519SolanaAddr" | "Ed25519SuiAddr" | "Ed25519AptosAddr" | "Ed25519CardanoAddrVk" | "Ed25519StellarAddr" | "Ed25519SubstrateAddr" | "Ed25519CantonAddr" | "Ed25519BinanceApi" | "Ed25519CoinbaseApi" | "Mnemonic" | "Stark" | "BabylonEots" | "BabylonCov" | "TaprootBtc" | "TaprootBtcTest" | "SecpCosmosAddr" | "P256CosmosAddr" | "P256OntologyAddr" | "P256Neo3Addr" | "Ed25519TendermintAddr" | "SecpTronAddr" | "Ed25519TonAddr" | "SecpDogeAddr" | "SecpDogeTestAddr" | "SecpKaspaAddr" | "SecpKaspaTestAddr" | "SchnorrKaspaAddr" | "SchnorrKaspaTestAddr" | "SecpLtc" | "SecpLtcTest" | "SecpXrpAddr" | "Ed25519XrpAddr" | "BabyJubjub" | "HmacSha256" | "HmacSha256Bybit", "SecpEthAddr" | "SecpBtc" | "SecpBtcTest" | "SecpBtcLegacy" | "SecpBtcLegacyTest" | "SecpAvaAddr" | "SecpAvaTestAddr" | "BlsPub" | "BlsInactive" | "BlsAvaIcm" | "Ed25519SolanaAddr" | "Ed25519SuiAddr" | "Ed25519AptosAddr" | "Ed25519CardanoAddrVk" | "Ed25519StellarAddr" | "Ed25519SubstrateAddr" | "Ed25519CantonAddr" | "Ed25519BinanceApi" | "Ed25519CoinbaseApi" | "Mnemonic" | "Stark" | "BabylonEots" | "BabylonCov" | "TaprootBtc" | "TaprootBtcTest" | "SecpCosmosAddr" | "P256CosmosAddr" | "P256OntologyAddr" | "P256Neo3Addr" | "Ed25519TendermintAddr" | "SecpTronAddr" | "Ed25519TonAddr" | "SecpDogeAddr" | "SecpDogeTestAddr" | "SecpKaspaAddr" | "SecpKaspaTestAddr" | "SchnorrKaspaAddr" | "SchnorrKaspaTestAddr" | "SecpLtc" | "SecpLtcTest" | "SecpXrpAddr" | "Ed25519XrpAddr" | "BabyJubjub" | "HmacSha256" | "HmacSha256Bybit">;
    owner_id: z.ZodMiniString<string>;
    count: z.ZodMiniNumber<unknown>;
    /** UUID uniquely identifying this event across all events. */
    event_id: z.ZodMiniString<string>;
    /** The org in which this event occurred. */
    org_id: z.ZodMiniString<string>;
    /** ID of the HTTP request that triggered this event (one request can trigger multiple events). */
    request_id: z.ZodMiniString<string>;
    /** Timestamp of when the event was logged, formatted like YYYY-MM-DD HH:MM:SS.NNNNNNNNN */
    time: z.ZodMiniString<string>;
    /** ID of the user or role that triggered the event; absent for unauthenticated endpoints. */
    triggered_by: z.ZodMiniNullable<z.ZodMiniString<string>>;
}, z.core.$strip>, z.ZodMiniObject<{
    event: z.ZodMiniLiteral<"MfaApproved">;
    mfa_id: z.ZodMiniString<string>;
    meets_approval_criteria: z.ZodMiniBoolean<unknown>;
    /** UUID uniquely identifying this event across all events. */
    event_id: z.ZodMiniString<string>;
    /** The org in which this event occurred. */
    org_id: z.ZodMiniString<string>;
    /** ID of the HTTP request that triggered this event (one request can trigger multiple events). */
    request_id: z.ZodMiniString<string>;
    /** Timestamp of when the event was logged, formatted like YYYY-MM-DD HH:MM:SS.NNNNNNNNN */
    time: z.ZodMiniString<string>;
    /** ID of the user or role that triggered the event; absent for unauthenticated endpoints. */
    triggered_by: z.ZodMiniNullable<z.ZodMiniString<string>>;
}, z.core.$strip>, z.ZodMiniObject<{
    event: z.ZodMiniLiteral<"MfaRejected">;
    mfa_id: z.ZodMiniString<string>;
    /** UUID uniquely identifying this event across all events. */
    event_id: z.ZodMiniString<string>;
    /** The org in which this event occurred. */
    org_id: z.ZodMiniString<string>;
    /** ID of the HTTP request that triggered this event (one request can trigger multiple events). */
    request_id: z.ZodMiniString<string>;
    /** Timestamp of when the event was logged, formatted like YYYY-MM-DD HH:MM:SS.NNNNNNNNN */
    time: z.ZodMiniString<string>;
    /** ID of the user or role that triggered the event; absent for unauthenticated endpoints. */
    triggered_by: z.ZodMiniNullable<z.ZodMiniString<string>>;
}, z.core.$strip>, z.ZodMiniObject<{
    event: z.ZodMiniLiteral<"PolicyChanged">;
    /** UUID uniquely identifying this event across all events. */
    event_id: z.ZodMiniString<string>;
    /** The org in which this event occurred. */
    org_id: z.ZodMiniString<string>;
    /** ID of the HTTP request that triggered this event (one request can trigger multiple events). */
    request_id: z.ZodMiniString<string>;
    /** Timestamp of when the event was logged, formatted like YYYY-MM-DD HH:MM:SS.NNNNNNNNN */
    time: z.ZodMiniString<string>;
    /** ID of the user or role that triggered the event; absent for unauthenticated endpoints. */
    triggered_by: z.ZodMiniNullable<z.ZodMiniString<string>>;
}, z.core.$strip>, z.ZodMiniObject<{
    event: z.ZodMiniLiteral<"TendermintConcurrentSigning">;
    key_id: z.ZodMiniString<string>;
    chain_id: z.ZodMiniString<string>;
    last_state: z.ZodMiniString<string>;
    current_state: z.ZodMiniString<string>;
    /** UUID uniquely identifying this event across all events. */
    event_id: z.ZodMiniString<string>;
    /** The org in which this event occurred. */
    org_id: z.ZodMiniString<string>;
    /** ID of the HTTP request that triggered this event (one request can trigger multiple events). */
    request_id: z.ZodMiniString<string>;
    /** Timestamp of when the event was logged, formatted like YYYY-MM-DD HH:MM:SS.NNNNNNNNN */
    time: z.ZodMiniString<string>;
    /** ID of the user or role that triggered the event; absent for unauthenticated endpoints. */
    triggered_by: z.ZodMiniNullable<z.ZodMiniString<string>>;
}, z.core.$strip>, z.ZodMiniObject<{
    event: z.ZodMiniLiteral<"InvitationCreated">;
    email: z.ZodMiniString<string>;
    role: z.ZodMiniString<string>;
    /** UUID uniquely identifying this event across all events. */
    event_id: z.ZodMiniString<string>;
    /** The org in which this event occurred. */
    org_id: z.ZodMiniString<string>;
    /** ID of the HTTP request that triggered this event (one request can trigger multiple events). */
    request_id: z.ZodMiniString<string>;
    /** Timestamp of when the event was logged, formatted like YYYY-MM-DD HH:MM:SS.NNNNNNNNN */
    time: z.ZodMiniString<string>;
    /** ID of the user or role that triggered the event; absent for unauthenticated endpoints. */
    triggered_by: z.ZodMiniNullable<z.ZodMiniString<string>>;
}, z.core.$strip>, z.ZodMiniObject<{
    event: z.ZodMiniLiteral<"InvitationCanceled">;
    email: z.ZodMiniString<string>;
    /** UUID uniquely identifying this event across all events. */
    event_id: z.ZodMiniString<string>;
    /** The org in which this event occurred. */
    org_id: z.ZodMiniString<string>;
    /** ID of the HTTP request that triggered this event (one request can trigger multiple events). */
    request_id: z.ZodMiniString<string>;
    /** Timestamp of when the event was logged, formatted like YYYY-MM-DD HH:MM:SS.NNNNNNNNN */
    time: z.ZodMiniString<string>;
    /** ID of the user or role that triggered the event; absent for unauthenticated endpoints. */
    triggered_by: z.ZodMiniNullable<z.ZodMiniString<string>>;
}, z.core.$strip>, z.ZodMiniObject<{
    event: z.ZodMiniLiteral<"UserExportInit">;
    key_id: z.ZodMiniString<string>;
    valid_epoch: z.ZodMiniNumber<unknown>;
    /** UUID uniquely identifying this event across all events. */
    event_id: z.ZodMiniString<string>;
    /** The org in which this event occurred. */
    org_id: z.ZodMiniString<string>;
    /** ID of the HTTP request that triggered this event (one request can trigger multiple events). */
    request_id: z.ZodMiniString<string>;
    /** Timestamp of when the event was logged, formatted like YYYY-MM-DD HH:MM:SS.NNNNNNNNN */
    time: z.ZodMiniString<string>;
    /** ID of the user or role that triggered the event; absent for unauthenticated endpoints. */
    triggered_by: z.ZodMiniNullable<z.ZodMiniString<string>>;
}, z.core.$strip>, z.ZodMiniObject<{
    event: z.ZodMiniLiteral<"UserExportComplete">;
    key_id: z.ZodMiniString<string>;
    /** UUID uniquely identifying this event across all events. */
    event_id: z.ZodMiniString<string>;
    /** The org in which this event occurred. */
    org_id: z.ZodMiniString<string>;
    /** ID of the HTTP request that triggered this event (one request can trigger multiple events). */
    request_id: z.ZodMiniString<string>;
    /** Timestamp of when the event was logged, formatted like YYYY-MM-DD HH:MM:SS.NNNNNNNNN */
    time: z.ZodMiniString<string>;
    /** ID of the user or role that triggered the event; absent for unauthenticated endpoints. */
    triggered_by: z.ZodMiniNullable<z.ZodMiniString<string>>;
}, z.core.$strip>, z.ZodMiniObject<{
    event: z.ZodMiniLiteral<"WasmPolicyExecuted">;
    source: z.ZodMiniString<string>;
    key_id: z.ZodMiniOptional<z.ZodMiniString<string>>;
    policy: z.ZodMiniString<string>;
    policy_hash: z.ZodMiniString<string>;
    stdout: z.ZodMiniString<string>;
    stderr: z.ZodMiniString<string>;
    response: z.ZodMiniString<string>;
    reason: z.ZodMiniOptional<z.ZodMiniString<string>>;
    error: z.ZodMiniOptional<z.ZodMiniString<string>>;
    /** UUID uniquely identifying this event across all events. */
    event_id: z.ZodMiniString<string>;
    /** The org in which this event occurred. */
    org_id: z.ZodMiniString<string>;
    /** ID of the HTTP request that triggered this event (one request can trigger multiple events). */
    request_id: z.ZodMiniString<string>;
    /** Timestamp of when the event was logged, formatted like YYYY-MM-DD HH:MM:SS.NNNNNNNNN */
    time: z.ZodMiniString<string>;
    /** ID of the user or role that triggered the event; absent for unauthenticated endpoints. */
    triggered_by: z.ZodMiniNullable<z.ZodMiniString<string>>;
}, z.core.$strip>], "event">;
export type AuditLogEntry = z.infer<typeof auditLogEntrySchema>;
//# sourceMappingURL=audit_log.d.ts.map