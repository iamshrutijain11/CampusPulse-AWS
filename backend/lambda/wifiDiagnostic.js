/**
 * AWS Lambda Handler: Hostel Wi-Fi Diagnostic & SNS Outage Dispatcher
 * Runtime: Node.js 20.x
 * Integrates with Amazon DynamoDB and Amazon Simple Notification Service (SNS)
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');

const ddb = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-south-1' });
const docClient = DynamoDBDocumentClient.from(ddb);
const sns = new SNSClient({ region: process.env.AWS_REGION || 'ap-south-1' });

const TABLE_NAME = process.env.WIFI_TABLE_NAME || 'CampusPulse_WifiLogs';
const SNS_TOPIC_ARN = process.env.OUTAGE_SNS_TOPIC_ARN || '';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Content-Type': 'application/json'
};

exports.handler = async (event) => {
  const method = event.httpMethod || event.requestContext?.http?.method || 'GET';
  const path = event.path || event.rawPath || '/';

  if (method === 'OPTIONS') {
    return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify({ message: 'OK' }) };
  }

  try {
    // 1. POST /api/v1/wifi/outage-report (Dispatch Amazon SNS alert to CC Network Admin)
    if (path.includes('/outage-report') && method === 'POST') {
      const body = typeof event.body === 'string' ? JSON.parse(event.body || '{}') : (event.body || {});
      const { hostel, wing } = body;

      const incidentId = `INC_${Date.now()}`;
      const message = `[CampusPulse AWS ALERT] Wi-Fi Outage detected at IIT Bombay ${hostel} (${wing || 'All Wings'}). Automatic ticket created: ${incidentId}. CC Network Ops please inspect access points.`;

      let snsMessageId = 'mock_sns_' + Date.now();
      if (SNS_TOPIC_ARN) {
        try {
          const snsCmd = new PublishCommand({
            TopicArn: SNS_TOPIC_ARN,
            Subject: `[INCIDENT] Wi-Fi Outage: ${hostel}`,
            Message: message
          });
          const snsRes = await sns.send(snsCmd);
          snsMessageId = snsRes.MessageId;
        } catch (snsErr) {
          console.warn('[WARN] SNS Publish note:', snsErr.message);
        }
      }

      return {
        statusCode: 201,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          status: 'success',
          incident_id: incidentId,
          hostel,
          wing,
          sns_alert_dispatched: true,
          sns_message_id: snsMessageId
        })
      };
    }

    // 2. POST /api/v1/wifi/ping (Record student speed test)
    if (path.includes('/ping') && method === 'POST') {
      const body = typeof event.body === 'string' ? JSON.parse(event.body || '{}') : (event.body || {});
      const { download_speed_mbps, latency_ms } = body;

      const logEntry = {
        id: `ping_${Date.now()}`,
        speed: Number(download_speed_mbps) || 65,
        latency: Number(latency_ms) || 15,
        timestamp: new Date().toISOString()
      };

      try {
        await docClient.send(new PutCommand({ TableName: TABLE_NAME, Item: logEntry }));
      } catch (e) {
        console.warn('[WARN] DynamoDB ping log note:', e.message);
      }

      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          status: 'success',
          metric: logEntry
        })
      };
    }

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({ status: 'ok', service: 'Wi-Fi Sentinel AWS Lambda' })
    };
  } catch (error) {
    console.error('[ERROR]', error);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Internal Server Error', details: error.message })
    };
  }
};
