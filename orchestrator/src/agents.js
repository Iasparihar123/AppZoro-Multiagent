// For now, these are MOCK implementations.
// Later we’ll replace them with real OpenAI calls.

export async function callPmAgent(feature) {
  // In the real version, we’ll use the "feature" text.
  // For now we return a canned but realistic response.
  return {
    title: 'Add health endpoint',
    userStories: [
      'Given the service is running, When a client requests GET /health, Then the service responds 200 with { status: "ok", version: "<package.json version>" }'
    ],
    acceptanceCriteria: [
      'GET /health returns HTTP 200',
      'Response JSON contains keys: status, version',
      'status is exactly "ok"',
      'version value matches the version field in package.json',
      'Unit test exists that validates status and version'
    ],
    rawFeatureRequest: feature
  };
}

export async function callTechAgent(pmOutput) {
  // Again, mocked but shaped like the real thing.
  return {
    tasks: [
      {
        id: 'task-1',
        description: 'Implement GET /health route that returns { status: "ok", version: "<package.json version>" }',
        files: [
          'sample-app/src/routes/health.js',
          'sample-app/src/app.js'
        ],
        tests: [
          'sample-app/test/health.test.js'
        ],
        dbChanges: 'none'
      }
    ],
    basedOn: {
      title: pmOutput.title,
      acceptanceCriteria: pmOutput.acceptanceCriteria
    }
  };
}

export async function callDevAgent(task, context) {
  // For now we return a REAL git diff patch for the /health endpoint,
  // still without calling an LLM. Later we’ll swap this to OpenAI.
  const patch = `
diff --git a/sample-app/src/app.js b/sample-app/src/app.js
index 1111111..2222222 100644
--- a/sample-app/src/app.js
+++ b/sample-app/src/app.js
@@ -1,9 +1,13 @@
-import express from 'express';
-
-const app = express();
-
-// For now, just a simple root route
-app.get('/', (req, res) => {
-  res.json({ status: 'running' });
-});
-
-export default app;
+import express from 'express';
+import { router as healthRouter } from './routes/health.js';
+
+const app = express();
+
+// For now, just a simple root route
+app.get('/', (req, res) => {
+  res.json({ status: 'running' });
+});
+
+app.use('/health', healthRouter);
+
+export default app;
diff --git a/sample-app/src/routes/health.js b/sample-app/src/routes/health.js
new file mode 100644
index 0000000..1111111
--- /dev/null
+++ b/sample-app/src/routes/health.js
@@ -0,0 +1,18 @@
+import { Router } from 'express';
+import pkg from '../../package.json' assert { type: 'json' };
+
+const router = Router();
+
+router.get('/', (req, res) => {
+  res.json({
+    status: 'ok',
+    version: pkg.version
+  });
+});
+
+export { router };
diff --git a/sample-app/test/health.test.js b/sample-app/test/health.test.js
new file mode 100644
index 0000000..1111111
--- /dev/null
+++ b/sample-app/test/health.test.js
@@ -0,0 +1,21 @@
+import request from 'supertest';
+import app from '../src/app.js';
+import pkg from '../package.json' assert { type: 'json' };
+
+describe('GET /health', () => {
+  it('returns status ok and version', async () => {
+    const res = await request(app).get('/health');
+    expect(res.statusCode).toBe(200);
+    expect(res.body).toHaveProperty('status', 'ok');
+    expect(res.body).toHaveProperty('version', pkg.version);
+  });
+});
  `;

  return {
    patch,
    commitMessage: 'feat(health): add GET /health endpoint and tests',
    notes: 'Hardcoded developer output for health endpoint; later this will come from the LLM.'
  };
}
