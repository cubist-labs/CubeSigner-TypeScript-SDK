import { z } from "zod/mini";
export declare const auditLogEntrySchema: z.ZodMiniDiscriminatedUnion<[z.ZodMiniObject<{
    event: z.ZodMiniLiteral<"Billing">;
    kind: z.ZodMiniCustom<"OidcAuth" | "KeyCreated" | "UserExportInit" | "UserExportComplete" | "BabylonStaking" | "BabylonCovSign" | "Mmi" | "MmiMessageGet" | "MmiMessageList" | "MmiMessageSign" | "MmiMessageReject" | "MmiMessageDelete" | "AboutMe" | "UserResetEmailInit" | "UserResetEmailComplete" | "UserDeleteTotp" | "UserResetTotpInit" | "UserResetTotpComplete" | "UserVerifyTotp" | "UserRegisterFidoInit" | "UserRegisterFidoComplete" | "UserDeleteFido" | "CreateProofOidc" | "CreateProofCubeSigner" | "VerifyProof" | "AddOidcIdentity" | "RemoveOidcIdentity" | "ListOidcIdentities" | "GetOrg" | "UpdateOrg" | "GetOrgExport" | "CreateOrg" | "ListKeys" | "AttestKey" | "GetKey" | "GetKeyByMaterialId" | "ListKeyRoles" | "UpdateKey" | "ListHistoricalKeyTx" | "Invite" | "CancelInvitation" | "ListInvitations" | "ListUsers" | "GetUser" | "GetUserByEmail" | "GetUserByOidc" | "UpdateMembership" | "ResetMemberMfa" | "CompleteResetMemberMfa" | "CreateRole" | "AttestRole" | "GetRole" | "ListTokenKeys" | "ListRoles" | "GetRoleKey" | "ListRoleKeys" | "ListRoleUsers" | "UpdateRole" | "DeleteRole" | "ConfigureEmail" | "GetEmailConfig" | "DeleteEmailConfig" | "ListHistoricalRoleTx" | "CreatePolicy" | "GetPolicy" | "ListPolicies" | "DeletePolicy" | "UpdatePolicy" | "InvokePolicy" | "GetPolicyLogs" | "UploadWasmPolicy" | "GetPolicySecrets" | "UpdatePolicySecrets" | "SetPolicySecret" | "DeletePolicySecret" | "CreatePolicyImportKey" | "GetPolicyBucket" | "ListPolicyBuckets" | "UpdatePolicyBucket" | "UserExportDelete" | "UserExportList" | "AddUserToRole" | "RemoveUserFromRole" | "MfaApproveCs" | "MfaRejectCs" | "MfaGet" | "MfaList" | "AddKeysToRole" | "RemoveKeyFromRole" | "CreateToken" | "CreateSession" | "RevokeSession" | "RevokeCurrentSession" | "RevokeSessions" | "ListSessions" | "GetSession" | "SignerSessionRefresh" | "MfaApproveTotp" | "MfaRejectTotp" | "MfaFidoInit" | "MfaApproveFidoComplete" | "MfaRejectFidoComplete" | "MfaEmailInit" | "MfaEmailComplete" | "Cube3signerHeartbeat" | "CreateContact" | "GetContact" | "ListContacts" | "DeleteContact" | "UpdateContact" | "LookupContactsByAddress" | "QueryMetrics" | "QueryAuditLog" | "Counts" | "CreateKey" | "ImportKey" | "CreateKeyImportKey" | "DeriveKey" | "DeleteKey" | "AvaSign" | "AvaSerializedTxSign" | "BabylonRegistration" | "BlobSign" | "BtcMessageSign" | "BtcSign" | "DiffieHellmanExchange" | "PsbtSign" | "PsbtLegacyInputSign" | "PsbtSegwitInputSign" | "PsbtTaprootInputSign" | "TaprootSign" | "Eip712Sign" | "Eip191Sign" | "Eth1Sign" | "Eth2Sign" | "SolanaSign" | "SuiSign" | "TendermintSign" | "Stake" | "Unstake" | "PasskeyAuthInit" | "PasskeyAuthComplete" | "Oauth2Twitter" | "OAuth2TokenRefresh" | "EmailOtpAuth" | "SiweInit" | "SiweComplete" | "TelegramAuth" | "CreateOidcUser" | "DeleteOidcUser" | "DeleteUser" | "CreateEotsNonces" | "EotsSign" | "AuthMigrationIdentityAdd" | "AuthMigrationIdentityRemove" | "AuthMigrationUserUpdate" | "KeyImported" | "InvitationAccept" | "IdpAuthenticate" | "IdpPasswordResetRequest" | "IdpPasswordResetConfirm" | "RpcApi" | "RpcCreateTransaction" | "RpcGetTransaction" | "RpcListTransactions" | "RpcBinanceSubToMaster" | "RpcBinanceSubToSub" | "RpcBinanceUniversalTransfer" | "RpcBinanceSubAccountAssets" | "RpcBinanceAccountInfo" | "RpcBinanceSubAccountTransferHistory" | "RpcBinanceUniversalTransferHistory" | "RpcBinanceWithdraw" | "RpcBinanceWithdrawHistory" | "CustomChainRpcCall" | "EsploraApiCall" | "SentryApiCall" | "SentryApiCallPublic" | "MmiJwkSet" | "AttestationJwkSet" | "UserOrgs" | "PublicOrgInfo" | "EmailMyOrgs", "OidcAuth" | "KeyCreated" | "UserExportInit" | "UserExportComplete" | "BabylonStaking" | "BabylonCovSign" | "Mmi" | "MmiMessageGet" | "MmiMessageList" | "MmiMessageSign" | "MmiMessageReject" | "MmiMessageDelete" | "AboutMe" | "UserResetEmailInit" | "UserResetEmailComplete" | "UserDeleteTotp" | "UserResetTotpInit" | "UserResetTotpComplete" | "UserVerifyTotp" | "UserRegisterFidoInit" | "UserRegisterFidoComplete" | "UserDeleteFido" | "CreateProofOidc" | "CreateProofCubeSigner" | "VerifyProof" | "AddOidcIdentity" | "RemoveOidcIdentity" | "ListOidcIdentities" | "GetOrg" | "UpdateOrg" | "GetOrgExport" | "CreateOrg" | "ListKeys" | "AttestKey" | "GetKey" | "GetKeyByMaterialId" | "ListKeyRoles" | "UpdateKey" | "ListHistoricalKeyTx" | "Invite" | "CancelInvitation" | "ListInvitations" | "ListUsers" | "GetUser" | "GetUserByEmail" | "GetUserByOidc" | "UpdateMembership" | "ResetMemberMfa" | "CompleteResetMemberMfa" | "CreateRole" | "AttestRole" | "GetRole" | "ListTokenKeys" | "ListRoles" | "GetRoleKey" | "ListRoleKeys" | "ListRoleUsers" | "UpdateRole" | "DeleteRole" | "ConfigureEmail" | "GetEmailConfig" | "DeleteEmailConfig" | "ListHistoricalRoleTx" | "CreatePolicy" | "GetPolicy" | "ListPolicies" | "DeletePolicy" | "UpdatePolicy" | "InvokePolicy" | "GetPolicyLogs" | "UploadWasmPolicy" | "GetPolicySecrets" | "UpdatePolicySecrets" | "SetPolicySecret" | "DeletePolicySecret" | "CreatePolicyImportKey" | "GetPolicyBucket" | "ListPolicyBuckets" | "UpdatePolicyBucket" | "UserExportDelete" | "UserExportList" | "AddUserToRole" | "RemoveUserFromRole" | "MfaApproveCs" | "MfaRejectCs" | "MfaGet" | "MfaList" | "AddKeysToRole" | "RemoveKeyFromRole" | "CreateToken" | "CreateSession" | "RevokeSession" | "RevokeCurrentSession" | "RevokeSessions" | "ListSessions" | "GetSession" | "SignerSessionRefresh" | "MfaApproveTotp" | "MfaRejectTotp" | "MfaFidoInit" | "MfaApproveFidoComplete" | "MfaRejectFidoComplete" | "MfaEmailInit" | "MfaEmailComplete" | "Cube3signerHeartbeat" | "CreateContact" | "GetContact" | "ListContacts" | "DeleteContact" | "UpdateContact" | "LookupContactsByAddress" | "QueryMetrics" | "QueryAuditLog" | "Counts" | "CreateKey" | "ImportKey" | "CreateKeyImportKey" | "DeriveKey" | "DeleteKey" | "AvaSign" | "AvaSerializedTxSign" | "BabylonRegistration" | "BlobSign" | "BtcMessageSign" | "BtcSign" | "DiffieHellmanExchange" | "PsbtSign" | "PsbtLegacyInputSign" | "PsbtSegwitInputSign" | "PsbtTaprootInputSign" | "TaprootSign" | "Eip712Sign" | "Eip191Sign" | "Eth1Sign" | "Eth2Sign" | "SolanaSign" | "SuiSign" | "TendermintSign" | "Stake" | "Unstake" | "PasskeyAuthInit" | "PasskeyAuthComplete" | "Oauth2Twitter" | "OAuth2TokenRefresh" | "EmailOtpAuth" | "SiweInit" | "SiweComplete" | "TelegramAuth" | "CreateOidcUser" | "DeleteOidcUser" | "DeleteUser" | "CreateEotsNonces" | "EotsSign" | "AuthMigrationIdentityAdd" | "AuthMigrationIdentityRemove" | "AuthMigrationUserUpdate" | "KeyImported" | "InvitationAccept" | "IdpAuthenticate" | "IdpPasswordResetRequest" | "IdpPasswordResetConfirm" | "RpcApi" | "RpcCreateTransaction" | "RpcGetTransaction" | "RpcListTransactions" | "RpcBinanceSubToMaster" | "RpcBinanceSubToSub" | "RpcBinanceUniversalTransfer" | "RpcBinanceSubAccountAssets" | "RpcBinanceAccountInfo" | "RpcBinanceSubAccountTransferHistory" | "RpcBinanceUniversalTransferHistory" | "RpcBinanceWithdraw" | "RpcBinanceWithdrawHistory" | "CustomChainRpcCall" | "EsploraApiCall" | "SentryApiCall" | "SentryApiCallPublic" | "MmiJwkSet" | "AttestationJwkSet" | "UserOrgs" | "PublicOrgInfo" | "EmailMyOrgs">;
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
    kind: z.ZodMiniCustom<"OidcAuth" | "KeyCreated" | "UserExportInit" | "UserExportComplete" | "BabylonStaking" | "BabylonCovSign" | "Mmi" | "MmiMessageGet" | "MmiMessageList" | "MmiMessageSign" | "MmiMessageReject" | "MmiMessageDelete" | "AboutMe" | "UserResetEmailInit" | "UserResetEmailComplete" | "UserDeleteTotp" | "UserResetTotpInit" | "UserResetTotpComplete" | "UserVerifyTotp" | "UserRegisterFidoInit" | "UserRegisterFidoComplete" | "UserDeleteFido" | "CreateProofOidc" | "CreateProofCubeSigner" | "VerifyProof" | "AddOidcIdentity" | "RemoveOidcIdentity" | "ListOidcIdentities" | "GetOrg" | "UpdateOrg" | "GetOrgExport" | "CreateOrg" | "ListKeys" | "AttestKey" | "GetKey" | "GetKeyByMaterialId" | "ListKeyRoles" | "UpdateKey" | "ListHistoricalKeyTx" | "Invite" | "CancelInvitation" | "ListInvitations" | "ListUsers" | "GetUser" | "GetUserByEmail" | "GetUserByOidc" | "UpdateMembership" | "ResetMemberMfa" | "CompleteResetMemberMfa" | "CreateRole" | "AttestRole" | "GetRole" | "ListTokenKeys" | "ListRoles" | "GetRoleKey" | "ListRoleKeys" | "ListRoleUsers" | "UpdateRole" | "DeleteRole" | "ConfigureEmail" | "GetEmailConfig" | "DeleteEmailConfig" | "ListHistoricalRoleTx" | "CreatePolicy" | "GetPolicy" | "ListPolicies" | "DeletePolicy" | "UpdatePolicy" | "InvokePolicy" | "GetPolicyLogs" | "UploadWasmPolicy" | "GetPolicySecrets" | "UpdatePolicySecrets" | "SetPolicySecret" | "DeletePolicySecret" | "CreatePolicyImportKey" | "GetPolicyBucket" | "ListPolicyBuckets" | "UpdatePolicyBucket" | "UserExportDelete" | "UserExportList" | "AddUserToRole" | "RemoveUserFromRole" | "MfaApproveCs" | "MfaRejectCs" | "MfaGet" | "MfaList" | "AddKeysToRole" | "RemoveKeyFromRole" | "CreateToken" | "CreateSession" | "RevokeSession" | "RevokeCurrentSession" | "RevokeSessions" | "ListSessions" | "GetSession" | "SignerSessionRefresh" | "MfaApproveTotp" | "MfaRejectTotp" | "MfaFidoInit" | "MfaApproveFidoComplete" | "MfaRejectFidoComplete" | "MfaEmailInit" | "MfaEmailComplete" | "Cube3signerHeartbeat" | "CreateContact" | "GetContact" | "ListContacts" | "DeleteContact" | "UpdateContact" | "LookupContactsByAddress" | "QueryMetrics" | "QueryAuditLog" | "Counts" | "CreateKey" | "ImportKey" | "CreateKeyImportKey" | "DeriveKey" | "DeleteKey" | "AvaSign" | "AvaSerializedTxSign" | "BabylonRegistration" | "BlobSign" | "BtcMessageSign" | "BtcSign" | "DiffieHellmanExchange" | "PsbtSign" | "PsbtLegacyInputSign" | "PsbtSegwitInputSign" | "PsbtTaprootInputSign" | "TaprootSign" | "Eip712Sign" | "Eip191Sign" | "Eth1Sign" | "Eth2Sign" | "SolanaSign" | "SuiSign" | "TendermintSign" | "Stake" | "Unstake" | "PasskeyAuthInit" | "PasskeyAuthComplete" | "Oauth2Twitter" | "OAuth2TokenRefresh" | "EmailOtpAuth" | "SiweInit" | "SiweComplete" | "TelegramAuth" | "CreateOidcUser" | "DeleteOidcUser" | "DeleteUser" | "CreateEotsNonces" | "EotsSign" | "AuthMigrationIdentityAdd" | "AuthMigrationIdentityRemove" | "AuthMigrationUserUpdate" | "KeyImported" | "InvitationAccept" | "IdpAuthenticate" | "IdpPasswordResetRequest" | "IdpPasswordResetConfirm" | "RpcApi" | "RpcCreateTransaction" | "RpcGetTransaction" | "RpcListTransactions" | "RpcBinanceSubToMaster" | "RpcBinanceSubToSub" | "RpcBinanceUniversalTransfer" | "RpcBinanceSubAccountAssets" | "RpcBinanceAccountInfo" | "RpcBinanceSubAccountTransferHistory" | "RpcBinanceUniversalTransferHistory" | "RpcBinanceWithdraw" | "RpcBinanceWithdrawHistory" | "CustomChainRpcCall" | "EsploraApiCall" | "SentryApiCall" | "SentryApiCallPublic" | "MmiJwkSet" | "AttestationJwkSet" | "UserOrgs" | "PublicOrgInfo" | "EmailMyOrgs", "OidcAuth" | "KeyCreated" | "UserExportInit" | "UserExportComplete" | "BabylonStaking" | "BabylonCovSign" | "Mmi" | "MmiMessageGet" | "MmiMessageList" | "MmiMessageSign" | "MmiMessageReject" | "MmiMessageDelete" | "AboutMe" | "UserResetEmailInit" | "UserResetEmailComplete" | "UserDeleteTotp" | "UserResetTotpInit" | "UserResetTotpComplete" | "UserVerifyTotp" | "UserRegisterFidoInit" | "UserRegisterFidoComplete" | "UserDeleteFido" | "CreateProofOidc" | "CreateProofCubeSigner" | "VerifyProof" | "AddOidcIdentity" | "RemoveOidcIdentity" | "ListOidcIdentities" | "GetOrg" | "UpdateOrg" | "GetOrgExport" | "CreateOrg" | "ListKeys" | "AttestKey" | "GetKey" | "GetKeyByMaterialId" | "ListKeyRoles" | "UpdateKey" | "ListHistoricalKeyTx" | "Invite" | "CancelInvitation" | "ListInvitations" | "ListUsers" | "GetUser" | "GetUserByEmail" | "GetUserByOidc" | "UpdateMembership" | "ResetMemberMfa" | "CompleteResetMemberMfa" | "CreateRole" | "AttestRole" | "GetRole" | "ListTokenKeys" | "ListRoles" | "GetRoleKey" | "ListRoleKeys" | "ListRoleUsers" | "UpdateRole" | "DeleteRole" | "ConfigureEmail" | "GetEmailConfig" | "DeleteEmailConfig" | "ListHistoricalRoleTx" | "CreatePolicy" | "GetPolicy" | "ListPolicies" | "DeletePolicy" | "UpdatePolicy" | "InvokePolicy" | "GetPolicyLogs" | "UploadWasmPolicy" | "GetPolicySecrets" | "UpdatePolicySecrets" | "SetPolicySecret" | "DeletePolicySecret" | "CreatePolicyImportKey" | "GetPolicyBucket" | "ListPolicyBuckets" | "UpdatePolicyBucket" | "UserExportDelete" | "UserExportList" | "AddUserToRole" | "RemoveUserFromRole" | "MfaApproveCs" | "MfaRejectCs" | "MfaGet" | "MfaList" | "AddKeysToRole" | "RemoveKeyFromRole" | "CreateToken" | "CreateSession" | "RevokeSession" | "RevokeCurrentSession" | "RevokeSessions" | "ListSessions" | "GetSession" | "SignerSessionRefresh" | "MfaApproveTotp" | "MfaRejectTotp" | "MfaFidoInit" | "MfaApproveFidoComplete" | "MfaRejectFidoComplete" | "MfaEmailInit" | "MfaEmailComplete" | "Cube3signerHeartbeat" | "CreateContact" | "GetContact" | "ListContacts" | "DeleteContact" | "UpdateContact" | "LookupContactsByAddress" | "QueryMetrics" | "QueryAuditLog" | "Counts" | "CreateKey" | "ImportKey" | "CreateKeyImportKey" | "DeriveKey" | "DeleteKey" | "AvaSign" | "AvaSerializedTxSign" | "BabylonRegistration" | "BlobSign" | "BtcMessageSign" | "BtcSign" | "DiffieHellmanExchange" | "PsbtSign" | "PsbtLegacyInputSign" | "PsbtSegwitInputSign" | "PsbtTaprootInputSign" | "TaprootSign" | "Eip712Sign" | "Eip191Sign" | "Eth1Sign" | "Eth2Sign" | "SolanaSign" | "SuiSign" | "TendermintSign" | "Stake" | "Unstake" | "PasskeyAuthInit" | "PasskeyAuthComplete" | "Oauth2Twitter" | "OAuth2TokenRefresh" | "EmailOtpAuth" | "SiweInit" | "SiweComplete" | "TelegramAuth" | "CreateOidcUser" | "DeleteOidcUser" | "DeleteUser" | "CreateEotsNonces" | "EotsSign" | "AuthMigrationIdentityAdd" | "AuthMigrationIdentityRemove" | "AuthMigrationUserUpdate" | "KeyImported" | "InvitationAccept" | "IdpAuthenticate" | "IdpPasswordResetRequest" | "IdpPasswordResetConfirm" | "RpcApi" | "RpcCreateTransaction" | "RpcGetTransaction" | "RpcListTransactions" | "RpcBinanceSubToMaster" | "RpcBinanceSubToSub" | "RpcBinanceUniversalTransfer" | "RpcBinanceSubAccountAssets" | "RpcBinanceAccountInfo" | "RpcBinanceSubAccountTransferHistory" | "RpcBinanceUniversalTransferHistory" | "RpcBinanceWithdraw" | "RpcBinanceWithdrawHistory" | "CustomChainRpcCall" | "EsploraApiCall" | "SentryApiCall" | "SentryApiCallPublic" | "MmiJwkSet" | "AttestationJwkSet" | "UserOrgs" | "PublicOrgInfo" | "EmailMyOrgs">;
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
    scopes: z.ZodMiniArray<z.ZodMiniString<string>>;
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
    kind: z.ZodMiniCustom<"Eth2Unstake" | "BabylonStaking" | "BabylonCovSign" | "AvaSign" | "BabylonRegistration" | "BlobSign" | "BtcMessageSign" | "BtcSign" | "PsbtSign" | "TaprootSign" | "Eip712Sign" | "Eip191Sign" | "Eth1Sign" | "Eth2Sign" | "SolanaSign" | "SuiSign" | "TendermintSign" | "EotsSign" | "AvaChainTxSign" | "DiffieHellman" | "EotsNonces" | "Eth2Stake" | "RoleUpdate", "Eth2Unstake" | "BabylonStaking" | "BabylonCovSign" | "AvaSign" | "BabylonRegistration" | "BlobSign" | "BtcMessageSign" | "BtcSign" | "PsbtSign" | "TaprootSign" | "Eip712Sign" | "Eip191Sign" | "Eth1Sign" | "Eth2Sign" | "SolanaSign" | "SuiSign" | "TendermintSign" | "EotsSign" | "AvaChainTxSign" | "DiffieHellman" | "EotsNonces" | "Eth2Stake" | "RoleUpdate">;
    key_type: z.ZodMiniCustom<"SecpEthAddr" | "SecpBtc" | "SecpBtcTest" | "SecpBtcLegacy" | "SecpBtcLegacyTest" | "SecpAvaAddr" | "SecpAvaTestAddr" | "BlsPub" | "BlsInactive" | "BlsAvaIcm" | "Ed25519SolanaAddr" | "Ed25519SuiAddr" | "Ed25519AptosAddr" | "Ed25519CardanoAddrVk" | "Ed25519StellarAddr" | "Ed25519SubstrateAddr" | "Ed25519CantonAddr" | "Ed25519BinanceApi" | "Mnemonic" | "Stark" | "BabylonEots" | "BabylonCov" | "TaprootBtc" | "TaprootBtcTest" | "SecpCosmosAddr" | "P256CosmosAddr" | "P256OntologyAddr" | "P256Neo3Addr" | "Ed25519TendermintAddr" | "SecpTronAddr" | "Ed25519TonAddr" | "SecpDogeAddr" | "SecpDogeTestAddr" | "SecpKaspaAddr" | "SecpKaspaTestAddr" | "SchnorrKaspaAddr" | "SchnorrKaspaTestAddr" | "SecpLtc" | "SecpLtcTest" | "SecpXrpAddr" | "Ed25519XrpAddr" | "BabyJubjub", "SecpEthAddr" | "SecpBtc" | "SecpBtcTest" | "SecpBtcLegacy" | "SecpBtcLegacyTest" | "SecpAvaAddr" | "SecpAvaTestAddr" | "BlsPub" | "BlsInactive" | "BlsAvaIcm" | "Ed25519SolanaAddr" | "Ed25519SuiAddr" | "Ed25519AptosAddr" | "Ed25519CardanoAddrVk" | "Ed25519StellarAddr" | "Ed25519SubstrateAddr" | "Ed25519CantonAddr" | "Ed25519BinanceApi" | "Mnemonic" | "Stark" | "BabylonEots" | "BabylonCov" | "TaprootBtc" | "TaprootBtcTest" | "SecpCosmosAddr" | "P256CosmosAddr" | "P256OntologyAddr" | "P256Neo3Addr" | "Ed25519TendermintAddr" | "SecpTronAddr" | "Ed25519TonAddr" | "SecpDogeAddr" | "SecpDogeTestAddr" | "SecpKaspaAddr" | "SecpKaspaTestAddr" | "SchnorrKaspaAddr" | "SchnorrKaspaTestAddr" | "SecpLtc" | "SecpLtcTest" | "SecpXrpAddr" | "Ed25519XrpAddr" | "BabyJubjub">;
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
    key_type: z.ZodMiniCustom<"SecpEthAddr" | "SecpBtc" | "SecpBtcTest" | "SecpBtcLegacy" | "SecpBtcLegacyTest" | "SecpAvaAddr" | "SecpAvaTestAddr" | "BlsPub" | "BlsInactive" | "BlsAvaIcm" | "Ed25519SolanaAddr" | "Ed25519SuiAddr" | "Ed25519AptosAddr" | "Ed25519CardanoAddrVk" | "Ed25519StellarAddr" | "Ed25519SubstrateAddr" | "Ed25519CantonAddr" | "Ed25519BinanceApi" | "Mnemonic" | "Stark" | "BabylonEots" | "BabylonCov" | "TaprootBtc" | "TaprootBtcTest" | "SecpCosmosAddr" | "P256CosmosAddr" | "P256OntologyAddr" | "P256Neo3Addr" | "Ed25519TendermintAddr" | "SecpTronAddr" | "Ed25519TonAddr" | "SecpDogeAddr" | "SecpDogeTestAddr" | "SecpKaspaAddr" | "SecpKaspaTestAddr" | "SchnorrKaspaAddr" | "SchnorrKaspaTestAddr" | "SecpLtc" | "SecpLtcTest" | "SecpXrpAddr" | "Ed25519XrpAddr" | "BabyJubjub", "SecpEthAddr" | "SecpBtc" | "SecpBtcTest" | "SecpBtcLegacy" | "SecpBtcLegacyTest" | "SecpAvaAddr" | "SecpAvaTestAddr" | "BlsPub" | "BlsInactive" | "BlsAvaIcm" | "Ed25519SolanaAddr" | "Ed25519SuiAddr" | "Ed25519AptosAddr" | "Ed25519CardanoAddrVk" | "Ed25519StellarAddr" | "Ed25519SubstrateAddr" | "Ed25519CantonAddr" | "Ed25519BinanceApi" | "Mnemonic" | "Stark" | "BabylonEots" | "BabylonCov" | "TaprootBtc" | "TaprootBtcTest" | "SecpCosmosAddr" | "P256CosmosAddr" | "P256OntologyAddr" | "P256Neo3Addr" | "Ed25519TendermintAddr" | "SecpTronAddr" | "Ed25519TonAddr" | "SecpDogeAddr" | "SecpDogeTestAddr" | "SecpKaspaAddr" | "SecpKaspaTestAddr" | "SchnorrKaspaAddr" | "SchnorrKaspaTestAddr" | "SecpLtc" | "SecpLtcTest" | "SecpXrpAddr" | "Ed25519XrpAddr" | "BabyJubjub">;
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