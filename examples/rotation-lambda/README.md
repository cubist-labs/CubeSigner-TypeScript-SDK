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

Running the example requires a CubeSigner session stored in `session.json` at
the root of the example, as well as AWS ambient credentials which can be used
to deploy stacks. The session must have auth and refresh
lifetimes of at least four hours (the [minimum secrets rotation period for AWS Secrets Manager](https://docs.aws.amazon.com/secretsmanager/latest/userguide/rotate-secrets_schedule.html)). Your session should have as few scopes as possible for your service, this example requires `manage:session:get` to assert this session has the minimum lifetimes required before storing it in AWS. The following example
creates such a session with a 10-hour auth lifetime and a 1-day refresh lifetime:

```bash
# DO NOT use the default 'manage:*' scope; choose only the scopes your service needs by providing one or more `--scope` arguments!
cs login --export session.json --auth-lifetime 10h --refresh-lifetime 1d --scope "manage:session:get" ...
```

To check that you have ambient AWS credentials, run
`aws sts get-caller-identity` and ensure it succeeds.

To deploy the AWS infrastructure, run `make deploy`. This compiles the lambda
code and deploys the infrastructure using CDK. It generates `cdk/outputs.json`,
which stores the name of the secret. Note that the AWS account has to be
[bootstrapped](https://docs.aws.amazon.com/cdk/v2/guide/bootstrapping.html) for
the deployment to work.

To populate the secret, run `npm run store-session`. This validates that
`session.json` has the minimum required auth and refresh lifetimes, then stores
it in the secret.

To use the session data stored in the secret, run `npm run use-session`. This
executes a simple script (`scripts/use-session.ts`), which creates an
`CubeSignerClient` backed by an `AwsSecretSessionManager` to retrieve
information about the current session. The `AwsSecretSessionManager` fetches the
session data stored in AWS Secrets Manager and provides it to the
`CubeSignerClient`.

To tear down the AWS infrastructure, run `make destroy`.

## Adapting the Example

The `cs login` command used above defaults to creating a session with `manage:*`
scope, which is likely too broad. When adapting this example, create a session
with only the strictly necessary scopes for your use case. The session data
stored in AWS Secrets Manager is base64-encoded session data, which can also be
stored directly using the `cs` binary:

```bash
cs login --export session.json --auth-lifetime 10h --refresh-lifetime 1d ...
SECRETS_ARN=$(cat cdk/outputs.json | jq -r ".RotationLambdaStack.CubeSignerSessionArn")
aws secretsmanager put-secret-value --secret-id "${SECRETS_ARN}" --secret-string $(base64 -w0 -i session.json)
rm session.json
```

The example rotates the secret every four hours. When adapting the example, it
is important to make sure that the rotation schedule is shorter than the auth
and the refresh lifetimes of the session stored in the secret.
