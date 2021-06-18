import * as cdk from '@aws-cdk/core';
import { Duration } from '@aws-cdk/core';
import { Runtime } from '@aws-cdk/aws-lambda';
import { CorsHttpMethod, HttpApi, HttpMethod } from '@aws-cdk/aws-apigatewayv2';
import { LambdaProxyIntegration } from '@aws-cdk/aws-apigatewayv2-integrations';
import * as lambda from '@aws-cdk/aws-lambda-nodejs';
import * as sqs from '@aws-cdk/aws-sqs';
import * as path from 'path';
import { DefaultSQSWithDlq } from './common/default-sqs-with-dead';

export class BgcDefaultStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    /*
    // SQS Deadletter
    const newCandidateSQSDlq = new sqs.Queue(this, 'newCandidateSQSDlq', {
      queueName: "newCandidateSQSDlq.fifo",
      deliveryDelay: Duration.millis(0),
      contentBasedDeduplication: true,
      retentionPeriod: Duration.days(14),
      fifo: true
    });

    // SQS
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
    */

    // Creating queues with own default parameters
    const { sqsQueue: myNewQueue } = new DefaultSQSWithDlq(this, 'myNewQueue', {
      queueName: 'myNewQueue'
    })

    // LAMBDA
    const newCandidateLambda = new lambda.NodejsFunction(this, 'newCandidate', {
      entry: path.join(__dirname, '../../src/functions/newCandidate.ts'), 
      handler: 'main',
      runtime: Runtime.NODEJS_14_X,
      environment: {
        NEW_CANDIDATE_SQS: myNewQueue.queueUrl
      }
    });

    // Permissões da SQS pra Lambda
    myNewQueue.grantSendMessages(newCandidateLambda);

    // Adicionar trigger de SQS
    // newCandidateLambda.addEventSource(new SqsEventSource(newCandidateSQS));


    // Creating a HTTP api gateway with proxy integration
    const httpApi = new HttpApi(this, 'bgc-default-api-proxy', {
      corsPreflight: {
        allowOrigins: ['*'],
        allowMethods: [CorsHttpMethod.ANY]
      },
      apiName: 'bgc-default-api',
      createDefaultStage: true
    });

    httpApi.addRoutes({
      path: '/newCandidate',
      methods: [
        HttpMethod.POST
      ],
      integration: new LambdaProxyIntegration({
        handler: newCandidateLambda
      })
    })

    // OUTPUTS
    new cdk.CfnOutput(this, 'apiEndpointExport', {
      value: httpApi.apiEndpoint,
      exportName: 'ApiEndpoint',
      description: 'Biruleibis descrição'
    });

  }
}
