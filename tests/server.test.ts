import { test, describe } from 'node:test';
import assert from 'node:assert';
import { EventEmitter } from 'node:events';
import { HavenServer } from '../src/api/server.ts';

// Helper to create mock request and response
function createMockHttp(method: string, urlPath: string, bodyContent: string = '') {
  const req = new EventEmitter() as any;
  req.method = method;
  req.url = urlPath;
  req.headers = { host: 'localhost:3000' };

  const res = {
    statusCode: 200,
    headers: {} as Record<string, string>,
    body: '',
    setHeader(key: string, val: string) {
      this.headers[key.toLowerCase()] = val;
    },
    writeHead(code: number, headers?: Record<string, string>) {
      this.statusCode = code;
      if (headers) {
        Object.entries(headers).forEach(([k, v]) => this.setHeader(k, v));
      }
    },
    end(data?: string) {
      if (data) this.body += data;
      this.emit?.('finish');
    },
  } as any;

  // Queue body emission
  process.nextTick(() => {
    if (bodyContent) {
      req.emit('data', Buffer.from(bodyContent));
    }
    req.emit('end');
  });

  return { req, res };
}

describe('HavenServer HTTP API', () => {
  const server = new HavenServer();

  test('GET /api/health returns 200 with cluster status', async () => {
    const { req, res } = createMockHttp('GET', '/api/health');
    await server.handleRequest(req, res);

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.status, 'HEALTHY');
    assert.strictEqual(body.clusterBudget, '$0.00/mo');
    assert.strictEqual(body.providers.length, 3);
  });

  test('POST /api/events ingests review webhook and returns schema conforming response', async () => {
    const payload = {
      eventId: 'evt_http_01',
      eventType: 'REVIEW_EVENT',
      businessId: 'biz_http_01',
      businessName: 'Apex Dental Care',
      businessCategory: 'Dental Clinic',
      targetLocation: 'DHA Lahore',
      timestamp: new Date().toISOString(),
      reviewerName: 'Omar Farooq',
      starRating: 5,
      reviewText: 'Excellent service and state of the art equipment!',
      targetKeywords: ['emergency dentist in Lahore'],
    };

    const { req, res } = createMockHttp('POST', '/api/events', JSON.stringify(payload));
    await server.handleRequest(req, res);

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.actionType, 'REVIEW_REPLY');
    assert.strictEqual(body.safeToAutoPublish, true);
    assert.strictEqual(body.seoKeywordInjected, 'emergency dentist in Lahore');
  });

  test('GET /api/metrics reflects executions', async () => {
    const { req, res } = createMockHttp('GET', '/api/metrics');
    await server.handleRequest(req, res);

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.ok(body.totalExecutions >= 1);
  });

  test('GET / serves dashboard HTML', async () => {
    const { req, res } = createMockHttp('GET', '/');
    await server.handleRequest(req, res);

    assert.strictEqual(res.statusCode, 200);
    assert.ok(res.body.includes('HAVEN'));
    assert.ok(res.body.includes('Module A: Review Responder'));
  });
});
