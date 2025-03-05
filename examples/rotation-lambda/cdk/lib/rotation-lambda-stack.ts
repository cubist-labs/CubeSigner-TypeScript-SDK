import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import type { Construct } from 'constructs';

/** Stack that deploys a secret for storing a CubeSigner session and a lambda for refreshing it */
export class RotationLambdaStack extends cdk.Stack {
  /**
   * Constructor.
   *
   * @param scope Parent of this stack
   * @param id The construct ID of this stack
   * @param props Stack properties
   */
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const cubeSignerSession = new secretsmanager.Secret(this, "CubeSignerSession", {
      description: "CubeSigner session data",
    });

    const rotationLambda = new lambda.Function(this, "RotationLambda", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "index.handler",
      description: "Lambda for refreshing a CubeSigner session",
      code: lambda.Code.fromAsset(`${__dirname}/../../build/rotation-lambda.zip`)
    });

    cubeSignerSession.grantWrite(rotationLambda);
    cubeSignerSession.addRotationSchedule("Rotation", {
      rotationLambda: rotationLambda,
      // NOTE: Make sure that this is smaller than the session's auth and refresh lifetimes to
      // make sure that there is always a valid auth token available
      automaticallyAfter: cdk.Duration.hours(4),
    });

    new cdk.CfnOutput(this, 'CubeSignerSessionArn', { value: cubeSignerSession.secretArn });
  }
}
