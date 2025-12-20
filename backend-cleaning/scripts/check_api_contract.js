const fs = require('fs');
const path = require('path');

const REPORT_PATH = path.resolve(__dirname, '..', 'backend_report.json');

function loadReport() {
  if (!fs.existsSync(REPORT_PATH)) {
    throw new Error(`Report not found at ${REPORT_PATH}`);
  }
  const raw = fs.readFileSync(REPORT_PATH, 'utf-8');
  return JSON.parse(raw);
}

function main() {
  const report = loadReport();
  const routes = Array.isArray(report.routes) ? report.routes : [];

  const errors = [];
  const duplicates = new Map();

  routes.forEach((route) => {
    const key = `${route.http || 'UNDEFINED'} ${route.path || 'UNDEFINED'}`;
    duplicates.set(key, (duplicates.get(key) || 0) + 1);

    if (!route.handler || !route.handler.trim()) {
      errors.push(
        `Route ${route.http} ${route.path} is missing handler metadata and cannot be audited.`,
      );
    }

  });

  Array.from(duplicates.entries())
    .filter(([, count]) => count > 1)
    .forEach(([route, count]) => {
      errors.push(
        `Found ${count} definitions for ${route} (duplicate path/method) in the report.`,
      );
    });

  if (errors.length) {
    console.error('API contract verification failed:');
    errors.forEach((error) => console.error(`- ${error}`));
    process.exit(1);
  }

  console.log('API contract verification passed (report metadata is consistent).');
}

try {
  main();
} catch (error) {
  console.error('Unable to verify API contract:', error.message);
  process.exit(1);
}
