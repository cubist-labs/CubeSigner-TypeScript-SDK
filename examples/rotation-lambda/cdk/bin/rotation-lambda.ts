#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { RotationLambdaStack } from '../lib/rotation-lambda-stack';

const app = new cdk.App();
new RotationLambdaStack(app, 'RotationLambdaStack', {});
