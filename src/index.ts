import { jobs } from './config/jobs.ts';
import { env } from './config/env.ts';
import { runJob } from './core/run-job.ts';

function formatInterval(ms: number): string {
  const minutes = Math.round(ms / 60_000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const rem = minutes % 60;
  return rem ? `${hours}h${rem}m` : `${hours}h`;
}

// Schedule all jobs
const jobEntries = Object.entries(jobs);

if (jobEntries.length === 0) {
  console.warn('No jobs configured. Add jobs in src/config/jobs.ts');
} else {
  for (const [name, config] of jobEntries) {
    console.log(`Scheduling "${name}" every ${formatInterval(config.intervalMs)}`);

    // Run immediately on startup
    runJob(name, config).catch((err) => {
      console.error(`[${name}] Failed:`, err);
    });

    // Then on interval
    setInterval(() => {
      runJob(name, config).catch((err) => {
        console.error(`[${name}] Failed:`, err);
      });
    }, config.intervalMs);
  }
}

// Health check / future webhook server
const port = env.PORT;

Bun.serve({
  port,
  fetch(req) {
    const url = new URL(req.url);

    switch (url.pathname) {
      case '/health':
        const jobs = jobEntries.map(([name]) => name);
        return Response.json({ status: 'ok', jobs });
      default:
        return new Response('Not found', { status: 404 });
    }
  },
});

console.log(`Server listening on port ${port}`);
