# CubeSigner TypeScript SDK: CubeSigner AWS Secrets Manager Example

This example shows how CubeSigner session data can be stored in AWS Secrets
Manager using the `@cubist-labs/cubesigner-sdk-secretsmanager-storage` package.

The example uses [CDK](https://aws.amazon.com/cdk/) to deploy a CloudFormation
stack with a secret `CubeSignerSession`, which holds the CubeSigner session
data, and a lambda `RotationLambda`, which rotates the secret by refreshing
the session.

## Overview

The example consists of the following parts:
- `cdk`: This directory contains the CDK code for the stack that the example
  deploys
- `lambdas`: This directory contains the secrets rotation lambda code
- `scripts`: This directory contains scripts for managing the secret
- `Makefile`: This file is used to run the example

## Running the Example

Running the example requires an active CubeSigner session with a `manage:*`
scope and an auth lifetime of at least eight hours, which can be created using
`cs login --auth-lifetime 28800 ...` as well as AWS ambient credentials which
can be used to deploy stacks.

To check that you have an active CubeSigner session, run `cs user me` and
ensure that it succeeds. To check that you have ambient AWS credentials, run
`aws sts get-caller-identity` and ensure it succeeds.

To deploy the AWS infrastructure, run `make deploy`. This compiles the lambda
code and deploys the infrastructure using CDK. It generates `cdk/outputs.json`,
which stores the name of the secret. Note that the AWS account has to be
[bootstrapped](https://docs.aws.amazon.com/cdk/v2/guide/bootstrapping.html) for
the deployment to work.

To populate the secret, run `npm run gen-session`. This command uses the
current CubeSigner session to generate a new session (with a `manage:*` scope
and an auth lifetime of eight hours) and then stores the base64-encoded session
data in the secret.

To use the session data stored in the secret, run `npm run use-session`. This
executes a simple script (`scripts/use-session.ts`), which creates an
`CubeSignerClient` backed by an `AwsSecretSessionManager` to retrieve
information about the current user. The `AwsSecretSessionManager` fetches the
session data stored in AWS Secrets Manager and provides it to the
`CubeSignerClient`.

## Adapting the Example

As outlined above, the `npm run gen-session` command creates a session with
`manage:*` scope, which is likely too broad. It also uses the default settings
when creating a session, which are not ideal for every use case. The session
data stored in AWS Secrets Manager is base64-encoded session data, which can
also be generated using the `cs` binary:

```bash
cs login --export session.json
SECRETS_ARN=$(cat cdk/outputs.json | jq -r ".RotationLambdaStack.CubeSignerSessionArn")
aws secretsmanager put-secret-value --secret-id "${SECRETS_ARN}" --secret-string $(base64 -i session.json)
rm session.json
```

The example rotates the secret every four hours. When adapting the example, it
is important to make sure that the rotation schedule is shorter than the auth
and the refresh lifetimes of the session stored in the secret.
