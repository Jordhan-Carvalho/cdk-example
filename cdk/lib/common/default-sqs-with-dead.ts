import { Duration, Construct } from '@aws-cdk/core';
import * as sqs from '@aws-cdk/aws-sqs';
import { Queue } from '@aws-cdk/aws-sqs';


interface DefaultSQSWithDlqProps {
  queueName: string
}

export class DefaultSQSWithDlq extends Construct {
  public readonly sqsQueue: Queue
  public readonly sqsDqlQueue: Queue

  constructor(scope: Construct, id: string, props: DefaultSQSWithDlqProps) {
    super(scope, id);

        // SQS Deadletter
        this.sqsDqlQueue = new sqs.Queue(this, `${props.queueName}Dlq`, {
          queueName: `${props.queueName}Dlq.fifo`,
          deliveryDelay: Duration.millis(0),
          contentBasedDeduplication: true,
          retentionPeriod: Duration.days(14),
          fifo: true
        });
    
        // SQS
        this.sqsQueue = new sqs.Queue(this, `${props.queueName}` , {
          queueName: `${props.queueName}.fifo`,
          deliveryDelay: Duration.millis(0),
          contentBasedDeduplication: true,
          retentionPeriod: Duration.days(14),
          fifo: true,
          visibilityTimeout: Duration.seconds(30),
          deadLetterQueue: {
            queue: this.sqsDqlQueue,
            maxReceiveCount: 3
          },
        });
  }
};
