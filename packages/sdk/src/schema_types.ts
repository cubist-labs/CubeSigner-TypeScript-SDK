import type { MfaPolicy } from "./role";
import type { components } from "./schema";
import type { JsonMap } from "./util";

export type schemas = components["schemas"];

export type UserInfo = schemas["UserInfo"];
export type UserInOrgMembership = schemas["UserInOrgMembership"];
export type ConfiguredMfa = schemas["ConfiguredMfa"];
export type RatchetConfig = schemas["RatchetConfig"];
export type IdentityProof = schemas["IdentityProof"];
export type AddIdentityRequest = schemas["AddIdentityRequest"];
export type ListIdentityResponse = schemas["ListIdentitiesResponse"];
export type TotpInfo = schemas["TotpInfo"];

export type OidcAuthResponse = schemas["NewSessionResponse"];
export type ApiAddFidoChallenge = schemas["FidoCreateChallengeResponse"];
export type ApiMfaFidoChallenge = schemas["FidoAssertChallenge"];

export type PublicKeyCredentialCreationOptions = schemas["PublicKeyCredentialCreationOptions"];
export type PublicKeyCredentialRequestOptions = schemas["PublicKeyCredentialRequestOptions"];
export type PublicKeyCredentialParameters = schemas["PublicKeyCredentialParameters"];
export type PublicKeyCredentialDescriptor = schemas["PublicKeyCredentialDescriptor"];
export type AuthenticatorSelectionCriteria = schemas["AuthenticatorSelectionCriteria"];
export type PublicKeyCredentialUserEntity = schemas["PublicKeyCredentialUserEntity"];
export type PublicKeyCredential = schemas["PublicKeyCredential"];

export type OrgInfo = schemas["OrgInfo"];
export type PublicOrgInfo = schemas["PublicOrgInfo"];
export type UserInOrgInfo = schemas["UserInOrgInfo"];
export type UpdateOrgRequest = schemas["UpdateOrgRequest"];
export type UpdateOrgResponse = schemas["UpdateOrgResponse"];
export type UpdateUserMembershipRequest = schemas["UpdateUserMembershipRequest"];
export type NotificationEndpointConfiguration = schemas["NotificationEndpointConfiguration"];
export type OrgEvents = schemas["OrgEventDiscriminants"];
export type BillingEvent = schemas["BillingEvent"];
export type OperationKind = schemas["OperationKind"];

export type OrgData = schemas["OrgData"];
export type UserOrgsResponse = schemas["UserOrgsResponse"];

export type OidcIdentity = schemas["OidcIdentity"];
export type MemberRole = schemas["MemberRole"];

export type SchemaKeyType = schemas["KeyType"];

export type ListKeysResponse = schemas["PaginatedListKeysResponse"];
export type UpdateKeyRequest = schemas["UpdateKeyRequest"];
export type KeyProperties = schemas["CreateAndUpdateKeyProperties"];
export type CreateKeyRequest = schemas["CreateKeyRequest"];
export type KeyInfo = schemas["KeyInfo"];
export type KeyInRoleInfo = schemas["KeyInRoleInfo"];
export type GetUsersInOrgResponse = schemas["PaginatedGetUsersInOrgResponse"];
export type UserInRoleInfo = schemas["UserInRoleInfo"];
export type KeyTypeApi = schemas["KeyType"];

export type ListKeyRolesResponse = schemas["PaginatedListKeyRolesResponse"];
export type ListRolesResponse = schemas["PaginatedListRolesResponse"];
export type ListRoleKeysResponse = schemas["PaginatedListRoleKeysResponse"];
export type ListRoleUsersResponse = schemas["PaginatedListRoleUsersResponse"];
export type UpdateRoleRequest = schemas["UpdateRoleRequest"];
export type KeyWithPoliciesInfo = schemas["KeyInRoleInfo"];
export type RoleInfo = schemas["RoleInfo"];

export type SessionInfo = schemas["SessionInfo"];
export type ClientSessionInfo = schemas["ClientSessionInfo"];
export type NewSessionResponse = schemas["NewSessionResponse"];
export type SessionsResponse = schemas["PaginatedSessionsResponse"];

export type CreateSignerSessionRequest = schemas["CreateTokenRequest"];
export type RefreshSignerSessionRequest = schemas["AuthData"];

export type EvmSignRequest = schemas["Eth1SignRequest"];
export type EvmSignResponse = schemas["Eth1SignResponse"];
export type Eip191SignRequest = schemas["Eip191SignRequest"];
export type Eip712SignRequest = schemas["Eip712SignRequest"];
export type Eip191Or712SignResponse = schemas["SignResponse"];
export type Eth2SignRequest = schemas["Eth2SignRequest"];
export type Eth2SignResponse = schemas["Eth2SignResponse"];
export type Eth2StakeRequest = schemas["StakeRequest"];
export type Eth2StakeResponse = schemas["StakeResponse"];
export type Eth2UnstakeRequest = schemas["UnstakeRequest"];
export type Eth2UnstakeResponse = schemas["UnstakeResponse"];
export type BlobSignRequest = schemas["BlobSignRequest"];
export type BlobSignResponse = schemas["SignResponse"];
export type BtcSignRequest = schemas["BtcSignRequest"];
export type BtcSignResponse = schemas["SignResponse"];
export type BtcMessageSignRequest = schemas["BtcMessageSignRequest"];
export type BtcMessageSignResponse = schemas["BtcMessageSignResponse"];
export type PsbtSignRequest = schemas["PsbtSignRequest"];
export type PsbtSignResponse = schemas["PsbtSignResponse"];
export type TaprootSignRequest = schemas["TaprootSignRequest"];
export type TaprootSignResponse = schemas["SignResponse"];
export type EotsSignRequest = schemas["EotsSignRequest"];
export type EotsSignResponse = schemas["SignResponse"];
export type EotsCreateNonceRequest = schemas["EotsCreateNonceRequest"];
export type EotsCreateNonceResponse = schemas["EotsCreateNonceResponse"];
export type BabylonStakingRequest = schemas["BabylonStakingRequest"];
export type BabylonStakingResponse = schemas["BabylonStakingResponse"];
export type SolanaSignRequest = schemas["SolanaSignRequest"];
export type SolanaSignResponse = schemas["SignResponse"];
export type AvaSignRequest = schemas["AvaSignRequest"];
export type AvaSignResponse = schemas["SignResponse"];
export type AvaSerializedTxSignRequest = schemas["AvaSerializedTxSignRequest"];
export type SuiSignRequest = schemas["SuiSignRequest"];
export type SuiSignResponse = schemas["SignResponse"];

export type PendingMessageSignResponse = schemas["PendingMessageSignResponse"];
export type PendingMessageInfo = schemas["PendingMessageInfo"];
export type EvmTransaction = schemas["Transaction"];
export type TypedTransaction = schemas["TypedTransaction"];
export type TransactionAndStatus = schemas["TransactionAndStatus"];
export type SignedMessage = schemas["SignedMessage"];
export type MmiMetadata = schemas["MmiMetadata"];
export type MmiStatus = schemas["MmiStatus"];
export type Eip191Message = NonNullable<PendingMessageInfo["message_eip191"]>;
export type Eip712Message = NonNullable<PendingMessageInfo["message_eip712"]>;

export type JrpcResponse = schemas["JrpcResponse"];
export type MmiJrpcMethod =
  | "custodian_listAccounts"
  | "custodian_listAccountsSigned"
  | "custodian_listAccountChainIds"
  | "custodian_createTransaction"
  | "custodian_sign"
  | "custodian_signTypedData"
  | "custodian_getSignedMessageById"
  | "custodian_getTransactionById"
  | "custodian_getCustomerProof"
  | "custodian_replaceTransaction"
  | "custodian_getTransactionLink"
  | "custodian_getSignedMessageLink";

export type AcceptedResponse = schemas["AcceptedResponse"];
export type ErrorResponse = schemas["ErrorResponse"];
export type BtcSignatureKind = schemas["BtcSignatureKind"];
export type CsErrCode = schemas["SignerErrorCode"];

export type MfaType = schemas["MfaType"];
export type MfaVote = schemas["MfaVote"];
export type MfaRequestInfo = schemas["MfaRequestInfo"];
export type MfaRequired = schemas["AcceptedValue"]["MfaRequired"];
export type EvmTxCmp = schemas["EvmTxCmp"];
export type SolanaTxCmp = schemas["SolanaTxCmp"];

export type CreateOrgRequest = schemas["CreateOrgRequest"];
export type OrgMetricName = schemas["OrgMetricDiscriminants"];
export type QueryMetricsRequest = schemas["QueryMetricsRequest"];
export type QueryMetricsResponse = schemas["QueryMetricsResponse"];

export type UserExportInitRequest = schemas["UserExportInitRequest"];
export type UserExportInitResponse = schemas["UserExportInitResponse"];
export type UserExportCompleteRequest = schemas["UserExportCompleteRequest"];
export type UserExportCompleteResponse = schemas["UserExportCompleteResponse"];
export type UserExportListResponse = schemas["PaginatedUserExportListResponse"];
export type UserExportKeyMaterial = schemas["JsonKeyPackage"];

export type HistoricalTx = schemas["HistoricalTx"];
export type ListHistoricalTxResponse = schemas["PaginatedListHistoricalTxResponse"];

export type AuthenticationRequest = schemas["AuthenticationRequest"];
export type AuthenticationResponse = schemas["AuthenticationResponse"];
export type PasswordResetRequest = schemas["PasswordResetRequest"];
export type PasswordResetConfirmRequest = schemas["PasswordResetConfirmRequest"];
export type EmailOtpResponse = schemas["EmailOtpResponse"];

export type Empty = schemas["EmptyImpl"];

export type Scope = schemas["Scope"];

/** Options for a new OIDC user */
export interface CreateOidcUserOptions {
  /** Optional name */
  name?: string | null;
  /** The role of an OIDC user, default is "Alien" */
  memberRole?: MemberRole;
  /** Optional MFA policy to associate with the user account */
  mfaPolicy?: MfaPolicy;
}

/** Ava P- or X-chain transaction */
export type AvaTx = { P: AvaPChainTx } | { X: AvaXChainTx };

/** Ava P-chain transaction */
export type AvaPChainTx =
  | { AddPermissionlessValidator: JsonMap }
  | { AddSubnetValidator: JsonMap }
  | { AddValidator: JsonMap }
  | { CreateChain: JsonMap }
  | { CreateSubnet: JsonMap }
  | { Export: JsonMap }
  | { Import: JsonMap };

/** Ava X-chain transaction */
export type AvaXChainTx = { Base: JsonMap } | { Export: JsonMap } | { Import: JsonMap };

/** Ava chains */
export type AvaChain = "C" | "X" | "P";

/** Key import */
export type CreateKeyImportKeyResponse = schemas["CreateKeyImportKeyResponse"];
export type ImportKeyRequest = schemas["ImportKeyRequest"];
export type ImportKeyRequestMaterial = schemas["ImportKeyRequestMaterial"];

export type InvitationAcceptRequest = schemas["InvitationAcceptRequest"];

export type KeyTypeAndDerivationPath = schemas["KeyTypeAndDerivationPath"];
