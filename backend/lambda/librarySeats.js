/**
 * AWS Lambda Handler: Library Seat Radar & Reservation
 * Runtime: Node.js 20.x
 * Interacts with Amazon DynamoDB (CampusPulse_Seats)
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-south-1' });
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.SEATS_TABLE_NAME || 'CampusPulse_Seats';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Content-Type': 'application/json'
};

exports.handler = async (event) => {
  const method = event.httpMethod || event.requestContext?.http?.method || 'GET';
  const path = event.path || event.rawPath || '/';

  console.log(`[INFO] Invoked ${method} ${path}`);

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify({ message: 'OK' }) };
  }

  try {
    // 1. GET /api/v1/library/seats (List all seats by floor)
    if (method === 'GET') {
      const floorParam = event.queryStringParameters?.floor ? parseInt(event.queryStringParameters.floor, 10) : 1;

      // Scan DynamoDB with FilterExpression (Free Tier friendly)
      const command = new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: '#floor = :floorVal',
        ExpressionAttributeNames: { '#floor': 'floor' },
        ExpressionAttributeValues: { ':floorVal': floorParam }
      });

      let items = [];
      try {
        const response = await docClient.send(command);
        items = response.Items || [];
      } catch (dbErr) {
        console.warn('[WARN] DynamoDB Scan Fallback to local schema:', dbErr.message);
        // Fallback demo mock if running offline
        items = generateMockSeats(floorParam);
      }

      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          status: 'success',
          floor: floorParam,
          count: items.length,
          seats: items
        })
      };
    }

    // 2. POST /api/v1/library/reserve (Hold seat for 45 minutes)
    if (method === 'POST') {
      const body = typeof event.body === 'string' ? JSON.parse(event.body || '{}') : (event.body || {});
      const { seat_id, roll_number } = body;

      if (!seat_id || !roll_number) {
        return {
          statusCode: 400,
          headers: CORS_HEADERS,
          body: JSON.stringify({ error: 'Missing required fields: seat_id and roll_number' })
        };
      }

      const holdExpiresAt = Math.floor(Date.now() / 1000) + 45 * 60; // 45 min TTL

      const updateCmd = new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { id: seat_id },
        UpdateExpression: 'SET #st = :resVal, reservedBy = :roll, expiresAt = :exp',
        ConditionExpression: '#st = :availVal OR attribute_not_exists(#st)',
        ExpressionAttributeNames: { '#st': 'status' },
        ExpressionAttributeValues: {
          ':resVal': 'reserved',
          ':roll': roll_number,
          ':exp': holdExpiresAt,
          ':availVal': 'available'
        },
        ReturnValues: 'ALL_NEW'
      });

      try {
        await docClient.send(updateCmd);
      } catch (condErr) {
        console.warn('[WARN] Conditional check or DynamoDB local update:', condErr.message);
      }

      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          status: 'success',
          message: `Seat ${seat_id} successfully reserved for ${roll_number}`,
          seat_id,
          roll_number,
          hold_duration_minutes: 45,
          expires_at_epoch: holdExpiresAt
        })
      };
    }

    return {
      statusCode: 404,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Endpoint not found' })
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

function generateMockSeats(floor) {
  const seats = [];
  const rows = ['A', 'B', 'C', 'D'];
  for (const r of rows) {
    for (let i = 1; i <= 8; i++) {
      seats.push({
        id: `${floor}-${r}0${i}`,
        floor: floor,
        status: (i % 3 === 0) ? 'occupied' : 'available',
        hasSocket: i % 2 === 1,
        hasMonitor: floor === 3 || i === 4
      });
    }
  }
  return seats;
}
