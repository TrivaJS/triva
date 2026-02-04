/**
 * Logs Commands
 * Manage request logs via CLI
 */

import { Command } from '../command.js';

export class LogCommands extends Command {
  static async handle(subcommand, options) {
    const config = await this.loadConfig(options.config);

    // Import Triva log module
    const { build, log } = await import('triva');
    await build(config);

    switch (subcommand) {
      case 'list':
        await this.list(options);
        break;
      
      case 'get':
        await this.get(options);
        break;
      
      case 'export':
        await this.export(options);
        break;
      
      case 'clear':
        await this.clear(options);
        break;
      
      case 'filter':
        await this.filter(options);
        break;
      
      default:
        this.error(`Unknown logs subcommand: ${subcommand}`);
        this.info('Available: list, get, export, clear, filter');
        process.exit(1);
    }
  }

  static async list(options) {
    const { log } = await import('triva');
    
    const limit = parseInt(options.limit) || 50;
    const since = this.parseTimeRange(options.since);

    this.info(`Fetching last ${limit} logs...`);

    const logs = await log.get({ limit });

    if (!logs || logs.length === 0) {
      this.warn('No logs found');
      return;
    }

    // Filter by time if specified
    let filtered = logs;
    if (since) {
      filtered = logs.filter(l => new Date(l.timestamp).getTime() > since);
    }

    // Format for display
    const formatted = filtered.map(l => ({
      id: l.id?.substring(0, 8) || 'N/A',
      timestamp: new Date(l.timestamp).toLocaleString(),
      method: l.method,
      path: l.pathname,
      status: l.statusCode,
      duration: `${l.responseTime}ms`,
      ip: l.ip
    }));

    console.log('\n' + this.formatOutput(formatted, options.format));
    this.success(`Found ${filtered.length} logs`);
  }

  static async get(options) {
    const { log } = await import('triva');
    const id = options._?.[0];

    if (!id) {
      this.error('Log ID required');
      this.info('Usage: triva logs get <id>');
      process.exit(1);
    }

    this.info(`Fetching log ${id}...`);

    const logs = await log.get({ limit: 1000 });
    const entry = logs.find(l => l.id?.startsWith(id));

    if (!entry) {
      this.error(`Log ${id} not found`);
      process.exit(1);
    }

    console.log('\n' + JSON.stringify(entry, null, 2));
    this.success('Log retrieved');
  }

  static async export(options) {
    const { log } = await import('triva');
    
    const limit = parseInt(options.limit) || 1000;
    const output = options.output || `logs-${Date.now()}.json`;

    this.info(`Exporting ${limit} logs to ${output}...`);

    const result = await log.export({ 
      limit,
      severity: options.severity
    });

    if (options.format === 'csv') {
      const logs = await log.get({ limit });
      const csv = this.toCSV(logs);
      await this.writeOutput(csv, output, 'csv');
    } else {
      await this.writeOutput(result, output, 'json');
    }

    this.success(`Exported ${result.count || 0} logs to ${output}`);
  }

  static async clear(options) {
    const { log } = await import('triva');
    
    const since = this.parseTimeRange(options.since);

    if (since) {
      this.info(`Clearing logs older than ${options.since}...`);
    } else {
      this.warn('This will clear ALL logs!');
      this.info('Use --since <time> to clear only old logs');
      
      // Simple confirmation (in production, you might want better confirmation)
      if (!options.force && !options.yes) {
        this.error('Add --force to confirm');
        process.exit(1);
      }
    }

    await log.clear(since ? { before: since } : {});
    this.success('Logs cleared');
  }

  static async filter(options) {
    const { log } = await import('triva');
    
    const filters = {
      limit: parseInt(options.limit) || 100,
      severity: options.severity,
      method: options.method,
      status: options.status ? parseInt(options.status) : undefined
    };

    this.info('Filtering logs...');

    const logs = await log.get(filters);

    if (!logs || logs.length === 0) {
      this.warn('No logs match filters');
      return;
    }

    // Apply additional filters
    let filtered = logs;

    if (options.path) {
      filtered = filtered.filter(l => l.pathname?.includes(options.path));
    }

    if (options.ip) {
      filtered = filtered.filter(l => l.ip === options.ip);
    }

    const formatted = filtered.map(l => ({
      timestamp: new Date(l.timestamp).toLocaleString(),
      method: l.method,
      path: l.pathname,
      status: l.statusCode,
      ip: l.ip
    }));

    console.log('\n' + this.formatOutput(formatted, options.format));
    this.success(`Found ${filtered.length} matching logs`);
  }
}
