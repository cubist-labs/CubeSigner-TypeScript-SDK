import { MfaPolicy } from "./role";
import { components } from "./schema";
import { JsonMap } from "./util";

type schemas = components["schemas"];

export type UserInfo = schemas["UserInfo"];
export type UserInOrgMembership = schemas["UserInOrgMembership"];
export type ConfiguredMfa = schemas["ConfiguredMfa"];
export type RatchetConfig = schemas["RatchetConfig"];
export type IdentityProof = schemas["IdentityProof"];
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
export type UserInOrgInfo = schemas["UserInOrgInfo"];
export type UpdateOrgRequest = schemas["UpdateOrgRequest"];
export type UpdateOrgResponse = schemas["UpdateOrgResponse"];
export type NotificationEndpointConfiguration = schemas["NotificationEndpointConfiguration"];
export type OrgEvents = schemas["OrgEventDiscriminants"];

export type OidcIdentity = schemas["OIDCIdentity"];
export type MemberRole = schemas["MemberRole"];

export type SchemaKeyType = schemas["KeyType"];

export type ListKeysResponse = schemas["PaginatedListKeysResponse"];
export type UpdateKeyRequest = schemas["UpdateKeyRequest"];
export type KeyProperties = schemas["CreateAndUpdateKeyProperties"];
export type CreateKeyRequest = schemas["CreateKeyRequest"];
export type KeyInfoApi = schemas["KeyInfo"];
export type KeyInRoleInfo = schemas["KeyInRoleInfo"];
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
export type Eip191Or712SignResponse = schemas["Eip191Or712SignResponse"];
export type Eth2SignRequest = schemas["Eth2SignRequest"];
export type Eth2SignResponse = schemas["Eth2SignResponse"];
export type Eth2StakeRequest = schemas["StakeRequest"];
export type Eth2StakeResponse = schemas["StakeResponse"];
export type Eth2UnstakeRequest = schemas["UnstakeRequest"];
export type Eth2UnstakeResponse = schemas["UnstakeResponse"];
export type BlobSignRequest = schemas["BlobSignRequest"];
export type BlobSignResponse = schemas["BlobSignResponse"];
export type BtcSignRequest = schemas["BtcSignRequest"];
export type BtcSignResponse = schemas["BtcSignResponse"];
export type SolanaSignRequest = schemas["SolanaSignRequest"];
export type SolanaSignResponse = schemas["SolanaSignResponse"];
export type AvaSignRequest = schemas["AvaSignRequest"];
export type AvaSignResponse = schemas["AvaSignResponse"];

export type AcceptedResponse = schemas["AcceptedResponse"];
export type ErrorResponse = schemas["ErrorResponse"];
export type BtcSignatureKind = schemas["BtcSignatureKind"];
export type CsErrCode = schemas["SignerErrorCode"];

export type MfaType = schemas["MfaType"];
export type MfaVote = schemas["MfaVote"];
export type MfaRequestInfo = schemas["MfaRequestInfo"];

export type UserExportInitRequest = schemas["UserExportInitRequest"];
export type UserExportInitResponse = schemas["UserExportInitResponse"];
export type UserExportCompleteRequest = schemas["UserExportCompleteRequest"];
export type UserExportCompleteResponse = schemas["UserExportCompleteResponse"];
export type UserExportListResponse = schemas["PaginatedUserExportListResponse"];
export type UserExportKeyMaterial = schemas["JsonKeyPackage"];

export type Empty = schemas["EmptyImpl"];

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
