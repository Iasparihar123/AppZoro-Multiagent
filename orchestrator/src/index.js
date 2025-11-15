import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import { callPmAgent, callTechAgent, callDevAgent } from './agents.js';
import { logStep } from './logger.js';

dotenv.config();

const app = express();
app.use(bodyParser.json());

const PORT = process.env.ORCHESTRATOR_PORT || 3000;

// Simple health check for the orchestrator itself
app.get('/', (req, res) => {
  res.json({ status: 'orchestrator_running' });
});

// 1) PM agent endpoint
app.post('/agent/pm', async (req, res) => {
  try {
    const { feature } = req.body;
    const pmOutput = await callPmAgent(feature);
    logStep('pm', { input: { feature }, output: pmOutput });
    res.json(pmOutput);
  } catch (err) {
    console.error('PM agent error:', err);
    res.status(500).json({ error: 'PM agent failed', details: err.message });
  }
});

// 2) Tech Lead agent endpoint
app.post('/agent/tech', async (req, res) => {
  try {
    const { pmOutput } = req.body;
    const techOutput = await callTechAgent(pmOutput);
    logStep('tech', { input: { pmOutput }, output: techOutput });
    res.json(techOutput);
  } catch (err) {
    console.error('Tech agent error:', err);
    res.status(500).json({ error: 'Tech agent failed', details: err.message });
  }
});

// 3) Developer agent endpoint
app.post('/agent/dev', async (req, res) => {
  try {
    const { task, context } = req.body;
    const devOutput = await callDevAgent(task, context);
    logStep('dev', { input: { task, context }, output: devOutput });
    res.json(devOutput);
  } catch (err) {
    console.error('Dev agent error:', err);
    res.status(500).json({ error: 'Dev agent failed', details: err.message });
  }
});

// 4) Orchestrated flow: PM -> Tech -> Dev
app.post('/run', async (req, res) => {
  try {
    const { feature } = req.body;

    // Step 1: PM
    const pmOutput = await callPmAgent(feature);
    logStep('pm', { input: { feature }, output: pmOutput });

    // Step 2: Tech
    const techOutput = await callTechAgent(pmOutput);
    logStep('tech', { input: { pmOutput }, output: techOutput });

    // For MVP, just take the first task
    const firstTask = techOutput.tasks[0];

    // Minimal context for now
    const context = {
      appPath: 'sample-app',
      repoRoot: '..'
    };

    // Step 3: Dev
    const devOutput = await callDevAgent(firstTask, context);
    logStep('dev', { input: { task: firstTask, context }, output: devOutput });

    // For now, we do NOT apply git patch or create PR yet.
    // Just return all three outputs.
    res.json({
      status: 'ok',
      feature,
      pmOutput,
      techOutput,
      devOutput
    });
  } catch (err) {
    console.error('Run flow error:', err);
    res.status(500).json({ error: 'Run flow failed', details: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Orchestrator listening on http://localhost:${PORT}`);
});
