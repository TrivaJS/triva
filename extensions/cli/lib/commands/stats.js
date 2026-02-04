/**
 * Stats Commands
 * Show application statistics
 */

import { Command } from '../command.js';

export class StatsCommands extends Command {
  static async handle(subcommand, options) {
    const config = await this.loadConfig(options.config);

    const { build, log, errorTracker, cache } = await import('triva');
    await build(config);

    switch (subcommand) {
      case 'requests':
      case null:
      case undefined:
        await this.requests(options);
        break;
      
      case 'performance':
        await this.performance(options);
        break;
      
      case 'health':
        await this.health(options);
        break;
      
      default:
        this.error(`Unknown stats subcommand: ${subcommand}`);
        this.info('Available: requests, performance, health');
        process.exit(1);
    }
  }

  static async requests(options) {
    const { log } = await import('triva');
    
    this.info('Calculating request statistics...');

    const limit = parseInt(options.limit) || 1000;
    const logs = await log.get({ limit });

    if (!logs || logs.length === 0) {
      this.warn('No request logs found');
      return;
    }

    // Calculate stats
    const total = logs.length;
    
    const byMethod = logs.reduce((acc, l) => {
      acc[l.method] = (acc[l.method] || 0) + 1;
      return acc;
    }, {});

    const byStatus = logs.reduce((acc, l) => {
      const code = l.statusCode;
      const category = Math.floor(code / 100) + 'xx';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});

    const byPath = logs.reduce((acc, l) => {
      acc[l.pathname] = (acc[l.pathname] || 0) + 1;
      return acc;
    }, {});

    const topPaths = Object.entries(byPath)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    console.log('\n📊 Request Statistics\n');
    console.log(`Total Requests: ${total}`);
    
    console.log('\nBy Method:');
    Object.entries(byMethod).forEach(([method, count]) => {
      console.log(`  ${method}: ${count}`);
    });

    console.log('\nBy Status:');
    Object.entries(byStatus).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });

    console.log('\nTop 10 Paths:');
    topPaths.forEach(([path, count], i) => {
      console.log(`  ${i+1}. ${path}: ${count}`);
    });

    this.success('Statistics calculated');
  }

  static async performance(options) {
    const { log } = await import('triva');
    
    this.info('Calculating performance metrics...');

    const limit = parseInt(options.limit) || 1000;
    const logs = await log.get({ limit });

    if (!logs || logs.length === 0) {
      this.warn('No request logs found');
      return;
    }

    // Calculate response times
    const times = logs
      .filter(l => l.responseTime)
      .map(l => l.responseTime)
      .sort((a, b) => a - b);

    if (times.length === 0) {
      this.warn('No response time data available');
      return;
    }

    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const min = times[0];
    const max = times[times.length - 1];
    const p50 = times[Math.floor(times.length * 0.5)];
    const p95 = times[Math.floor(times.length * 0.95)];
    const p99 = times[Math.floor(times.length * 0.99)];

    // Calculate by path
    const byPath = logs.reduce((acc, l) => {
      if (!l.responseTime) return acc;
      
      if (!acc[l.pathname]) {
        acc[l.pathname] = [];
      }
      acc[l.pathname].push(l.responseTime);
      return acc;
    }, {});

    const pathPerformance = Object.entries(byPath)
      .map(([path, times]) => ({
        path,
        avg: times.reduce((a, b) => a + b, 0) / times.length,
        count: times.length
      }))
      .sort((a, b) => b.avg - a.avg)
      .slice(0, 10);

    console.log('\n⚡ Performance Metrics\n');
    console.log(`Requests Analyzed: ${times.length}`);
    console.log(`Average: ${avg.toFixed(2)}ms`);
    console.log(`Min: ${min.toFixed(2)}ms`);
    console.log(`Max: ${max.toFixed(2)}ms`);
    console.log(`P50: ${p50.toFixed(2)}ms`);
    console.log(`P95: ${p95.toFixed(2)}ms`);
    console.log(`P99: ${p99.toFixed(2)}ms`);

    console.log('\nSlowest Paths:');
    pathPerformance.forEach((p, i) => {
      console.log(`  ${i+1}. ${p.path}: ${p.avg.toFixed(2)}ms (${p.count} requests)`);
    });

    this.success('Performance metrics calculated');
  }

  static async health(options) {
    const { log, errorTracker, cache } = await import('triva');
    
    this.info('Checking application health...');

    // Check logs
    const recentLogs = await log.get({ limit: 100 });
    const logsHealth = recentLogs && recentLogs.length > 0;

    // Check errors
    const recentErrors = await errorTracker.get({ limit: 100, resolved: false });
    const unresolvedErrors = recentErrors?.length || 0;
    const errorsHealth = unresolvedErrors < 10; // Threshold

    // Check cache
    const cacheKeys = await cache.list('*');
    const cacheHealth = Array.isArray(cacheKeys);

    // Overall health
    const isHealthy = logsHealth && errorsHealth && cacheHealth;

    console.log('\n🏥 Health Check\n');
    
    console.log(`Overall Status: ${isHealthy ? '✅ Healthy' : '❌ Unhealthy'}`);
    console.log('');
    console.log(`Logging: ${logsHealth ? '✅' : '❌'} (${recentLogs?.length || 0} recent logs)`);
    console.log(`Errors: ${errorsHealth ? '✅' : '⚠️'} (${unresolvedErrors} unresolved)`);
    console.log(`Cache: ${cacheHealth ? '✅' : '❌'} (${cacheKeys?.length || 0} keys)`);

    // Uptime
    const uptime = process.uptime();
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    console.log(`Uptime: ${hours}h ${minutes}m`);

    // Memory
    const mem = process.memoryUsage();
    console.log(`Memory: ${Math.round(mem.heapUsed / 1024 / 1024)}MB / ${Math.round(mem.heapTotal / 1024 / 1024)}MB`);

    if (isHealthy) {
      this.success('All systems operational');
    } else {
      this.warn('Some issues detected');
    }
  }
}
