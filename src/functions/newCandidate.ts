import AWS from 'aws-sdk';
import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2, Context } from 'aws-lambda';

const sqs = new AWS.SQS();

/**
 * @name newCandidate
 * @description Lambda description
 * continue desc
 * @param {Object} event -  Base event object of AWS Lambda
 * @param {Object} event.body - Content of the message
 * @param {string} event.body.name - Some const of number type
 * @command sam-beta-cdk local invoke bgc-default/newCandidate -e test/mocks/newCandidate.json -n locals.json
 */
 export const main = async (event: APIGatewayProxyEventV2, context: Context): Promise<APIGatewayProxyStructuredResultV2> => {
   try {
    const body: {id:string, name:string, rg:string} = typeof event.body === 'string'
    ? JSON.parse(event.body)
    : event.body;
    
    console.log('######## Enviando mensagem', body);
    await sqs.sendMessage({
      DelaySeconds: 0,
      MessageBody: JSON.stringify({
        body,
      }),
      MessageGroupId: body.id,
      MessageDeduplicationId: body.id,
      // @ts-ignore
      QueueUrl: process.env.NEW_CANDIDATE_SQS,
    }).promise();
    
    return {
      statusCode: 200,
      body: `Mensagem enviada`,
    };
  } catch (error) {
    console.log(error);
    return {
      statusCode: 500,
      body: error.message
    }
  }
};
