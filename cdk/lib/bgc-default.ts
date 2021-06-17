import * as cdk from '@aws-cdk/core';
import { Duration } from '@aws-cdk/core';
import { Runtime } from '@aws-cdk/aws-lambda';
import * as lambda from '@aws-cdk/aws-lambda-nodejs';
import * as sqs from '@aws-cdk/aws-sqs';
import * as path from 'path';

export class BgcDefaultStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const newCandidateSQSDlq = new sqs.Queue(this, 'newCandidateSQSDlq', {
      queueName: "newCandidateSQSDlq.fifo",
      deliveryDelay: Duration.millis(0),
      contentBasedDeduplication: true,
      retentionPeriod: Duration.days(14),
      fifo: true
    });

    const newCandidateSQS = new sqs.Queue(this, 'newCandidateSQS' , {
      queueName: "newCandidateSQS.fifo",
      deliveryDelay: Duration.millis(0),
      contentBasedDeduplication: true,
      retentionPeriod: Duration.days(14),
      fifo: true,
      visibilityTimeout: Duration.seconds(30),
      deadLetterQueue: {
        queue: newCandidateSQSDlq,
        maxReceiveCount: 3
      },
    });

    const newCandidateLambda = new lambda.NodejsFunction(this, 'newCandidate', {
      entry: path.join(__dirname, '../', '../', 'src', 'functions', 'newCandidate.ts'), 
      handler: 'main', // defaults to 'handler',
      runtime: Runtime.NODEJS_14_X,
      environment: {
        NEW_CANDIDATE_SQS: newCandidateSQS.queueUrl
      }
    });

    newCandidateSQS.grantSendMessages(newCandidateLambda);


    // add the event source to trigger the lambda
    // newCandidateLambda.addEventSource

    // const processCandidateLambda = new lambda.NodejsFunction(this, 'processCandidate', {
    //   entry: path.join(__dirname, '../', '../', 'src', 'functions', 'index.ts'), 
    //   handler: 'main', // defaults to 'handler',
    //   runtime: Runtime.NODEJS_14_X,
    //   //https://docs.aws.amazon.com/cdk/api/latest/docs/aws-lambda-event-sources-readme.html
    // });

  }
}
