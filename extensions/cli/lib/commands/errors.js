/**
 * Errors Commands
 * Manage error tracking via CLI
 */

import { Command } from '../command.js';

export class ErrorCommands extends Command {
  static async handle(subcommand, options) {
    const config = await this.loadConfig(options.config);

    const { build, errorTracker } = await import('triva');
    await build(config);

    switch (subcommand) {
      case 'list':
        await this.list(options);
        break;
      
      case 'get':
        await this.get(options);
        break;
      
      case 'resolve':
        await this.resolve(options);
        break;
      
      case 'clear':
        await this.clear(options);
        break;
      
      case 'stats':
        await this.stats(options);
        break;
      
      default:
        this.error(`Unknown errors subcommand: ${subcommand}`);
        this.info('Available: list, get, resolve, clear, stats');
        process.exit(1);
    }
  }

  static async list(options) {
    const { errorTracker } = await import('triva');
    
    const limit = parseInt(options.limit) || 50;
    const resolved = options.resolved === 'true';

    this.info(`Fetching ${resolved ? 'resolved' : 'unresolved'} errors...`);

    const errors = await errorTracker.get({ 
      limit,
      severity: options.severity,
      resolved
    });

    if (!errors || errors.length === 0) {
      this.warn('No errors found');
      return;
    }

    const formatted = errors.map(e => ({
      id: e.id?.substring(0, 8) || 'N/A',
      timestamp: new Date(e.timestamp).toLocaleString(),
      severity: e.severity,
      message: e.message?.substring(0, 50) || 'N/A',
      path: e.request?.pathname || 'N/A',
      resolved: e.resolved ? '✓' : '✗'
    }));

    console.log('\n' + this.formatOutput(formatted, options.format));
    this.success(`Found ${errors.length} errors`);
  }

  static async get(options) {
    const { errorTracker } = await import('triva');
    const id = options._?.[0];

    if (!id) {
      this.error('Error ID required');
      this.info('Usage: triva errors get <id>');
      process.exit(1);
    }

    this.info(`Fetching error ${id}...`);

    const errors = await errorTracker.get({ limit: 1000 });
    const error = errors.find(e => e.id?.startsWith(id));

    if (!error) {
      this.error(`Error ${id} not found`);
      process.exit(1);
    }

    console.log('\n' + JSON.stringify(error, null, 2));
    this.success('Error retrieved');
  }

  static async resolve(options) {
    const { errorTracker } = await import('triva');
    const id = options._?.[0];

    if (!id) {
      this.error('Error ID required');
      this.info('Usage: triva errors resolve <id>');
      process.exit(1);
    }

    this.info(`Resolving error ${id}...`);

    await errorTracker.resolve(id);
    this.success(`Error ${id} marked as resolved`);
  }

  static async clear(options) {
    const { errorTracker } = await import('triva');
    
    if (options.resolved) {
      this.info('Clearing resolved errors...');
      await errorTracker.clear({ resolved: true });
      this.success('Resolved errors cleared');
    } else {
      this.warn('This will clear ALL errors!');
      
      if (!options.force && !options.yes) {
        this.error('Add --force to confirm');
        process.exit(1);
      }

      await errorTracker.clear();
      this.success('All errors cleared');
    }
  }

  static async stats(options) {
    const { errorTracker } = await import('triva');
    
    this.info('Calculating error statistics...');

    const errors = await errorTracker.get({ limit: 10000 });

    if (!errors || errors.length === 0) {
      this.warn('No errors to analyze');
      return;
    }

    // Calculate stats
    const total = errors.length;
    const resolved = errors.filter(e => e.resolved).length;
    const unresolved = total - resolved;

    const bySeverity = errors.reduce((acc, e) => {
      acc[e.severity] = (acc[e.severity] || 0) + 1;
      return acc;
    }, {});

    const byPath = errors.reduce((acc, e) => {
      const path = e.request?.pathname || 'unknown';
      acc[path] = (acc[path] || 0) + 1;
      return acc;
    }, {});

    const topPaths = Object.entries(byPath)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    console.log('\n📊 Error Statistics\n');
    console.log(`Total Errors: ${total}`);
    console.log(`Resolved: ${resolved} (${Math.round(resolved/total*100)}%)`);
    console.log(`Unresolved: ${unresolved} (${Math.round(unresolved/total*100)}%)`);
    
    console.log('\nBy Severity:');
    Object.entries(bySeverity).forEach(([severity, count]) => {
      console.log(`  ${severity}: ${count}`);
    });

    console.log('\nTop 10 Error Paths:');
    topPaths.forEach(([path, count], i) => {
      console.log(`  ${i+1}. ${path}: ${count}`);
    });

    this.success('Statistics calculated');
  }
}
