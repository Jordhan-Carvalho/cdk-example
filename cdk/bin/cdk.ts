#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { BgcDefaultStack } from '../lib/bgc-default';

const app = new cdk.App();

new BgcDefaultStack(app, 'bgc-default', {
});
