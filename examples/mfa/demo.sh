#!/bin/bash

set -EeuoT pipefail

SCRIPT_DIR="$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

# NOTE: set to full path to your CubeSigner 'cs' binary unless 'cs' is in your PATH
CUBESIGNER_CLI="${CUBESIGNER_CLI:-cs}"

# Invokes the CubeSigner 'cs' binary
function cs {
    "$CUBESIGNER_CLI" "$@"
}

# Invokes the Node app from this folder
function app {
    npm -s run start -- "$@"
}

function step {
  NL=
  if [ "$1" == "-n" ]; then
    NL="-n"
    shift
  fi

  BGreen='\033[1;32m'
  Color_Off='\033[0m'
  echo
  echo $NL -e "${BGreen}$@${Color_Off}"
}

cd "$SCRIPT_DIR"
npm -s ci
npm -s run build

step "Double check we are logged into CubeSigner"
UserInfo=$(cs user me)
OrgId=$(echo "$UserInfo" | jq -r '.org_ids[0]')
echo "$UserInfo"

step "Creating a role"
RoleId=$(cs role create | jq -r .role_id)
echo "Created $RoleId"

step "Creating a key"
KeyId=$(cs key create --key-type secp | jq -r .keys[].key_id)
echo "Created $KeyId"

# NOTE: customize your policy here. For example, you can specify '"count": 2' but then
#       you'll have to specify '"allowed_approvers": [$USER1_ID, $USER2_ID, ...]'
step "Adding key to role with RequireMfa policy"
cs role add-keys --role-id $RoleId --key-id $KeyId --policy '{"RequireMfa": { "count": 1 }}'

# NOTE: optionally add more users to the role
# cs role add-user --role-id $RoleId --user-id $USER1_ID
# cs role add-user --role-id $RoleId --user-id $USER2_ID

step "Creating a role token (for signing actions)"
RoleToken=$(cs token create --role-id $RoleId --output base64)

step "Creating a user token (for management/mfa actions)"
UserToken=$(cs token create --user --output base64 --scope manage-all)

export CUBE_SIGNER_USER_TOKEN="$UserToken"
export CUBE_SIGNER_ROLE_TOKEN="$RoleToken"
export CUBE_SIGNER_ORG_ID="$OrgId"

step "Listing accessible keys"
Keys=$(app keys)
Pubkey=$(echo "$Keys" | jq -r '.[0]')
echo "$Keys"

step "Submitting 'sign-tx' with $Pubkey; expecting MFA"
mfaId=$(app sign-tx --key $Pubkey)
echo "$mfaId"

step "Listing my pending MFA requests"
MfaRequest=$(app mfa-list)
echo "$MfaRequest"
MfaId=$(echo "$MfaRequest" | jq -r '.[] | select(.id == "'"$mfaId"'") | .id')

step "Approving $MfaId"
app mfa-approve $MfaId

# NOTE: Log in as another user if multiple approvals are need and
#       repeat the 'mfa-list' and 'mfa-approve' steps. Once the
#       request is approved (it has 'receipt' attached), any one
#       of the users can proceed to resum the initial sign-tx request.

step "Completing the initial sign-tx call"
app mfa-resume $MfaId
