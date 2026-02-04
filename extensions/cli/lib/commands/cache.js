/**
 * Cache Commands
 * Manage cache via CLI
 */

import { Command } from '../command.js';

export class CacheCommands extends Command {
  static async handle(subcommand, options) {
    const config = await this.loadConfig(options.config);

    const { build, cache } = await import('triva');
    await build(config);

    switch (subcommand) {
      case 'list':
        await this.list(options);
        break;
      
      case 'get':
        await this.get(options);
        break;
      
      case 'set':
        await this.set(options);
        break;
      
      case 'delete':
        await this.delete(options);
        break;
      
      case 'clear':
        await this.clear(options);
        break;
      
      case 'stats':
        await this.stats(options);
        break;
      
      default:
        this.error(`Unknown cache subcommand: ${subcommand}`);
        this.info('Available: list, get, set, delete, clear, stats');
        process.exit(1);
    }
  }

  static async list(options) {
    const { cache } = await import('triva');
    
    this.info('Listing cache keys...');

    const pattern = options.pattern || '*';
    const keys = await cache.list(pattern);

    if (!keys || keys.length === 0) {
      this.warn('No cache keys found');
      return;
    }

    const limit = parseInt(options.limit) || keys.length;
    const limited = keys.slice(0, limit);

    limited.forEach(key => console.log(`  ${key}`));
    
    if (keys.length > limit) {
      this.info(`Showing ${limit} of ${keys.length} keys`);
    }

    this.success(`Found ${keys.length} cache keys`);
  }

  static async get(options) {
    const { cache } = await import('triva');
    const key = options._?.[0];

    if (!key) {
      this.error('Cache key required');
      this.info('Usage: triva cache get <key>');
      process.exit(1);
    }

    this.info(`Fetching cache key: ${key}...`);

    const value = await cache.get(key);

    if (value === null || value === undefined) {
      this.warn(`Key "${key}" not found in cache`);
      return;
    }

    console.log('\n' + JSON.stringify(value, null, 2));
    this.success('Value retrieved');
  }

  static async set(options) {
    const { cache } = await import('triva');
    const key = options._?.[0];
    const value = options._?.[1];

    if (!key || !value) {
      this.error('Key and value required');
      this.info('Usage: triva cache set <key> <value>');
      process.exit(1);
    }

    this.info(`Setting cache key: ${key}...`);

    // Try to parse as JSON, fallback to string
    let parsedValue;
    try {
      parsedValue = JSON.parse(value);
    } catch {
      parsedValue = value;
    }

    const ttl = options.ttl ? parseInt(options.ttl) : undefined;
    await cache.set(key, parsedValue, ttl);

    this.success(`Key "${key}" set successfully`);
    if (ttl) {
      this.info(`TTL: ${ttl}ms`);
    }
  }

  static async delete(options) {
    const { cache } = await import('triva');
    const key = options._?.[0];

    if (!key) {
      this.error('Cache key or pattern required');
      this.info('Usage: triva cache delete <key|pattern>');
      process.exit(1);
    }

    this.info(`Deleting cache key(s): ${key}...`);

    const deleted = await cache.delete(key);
    this.success(`Deleted ${deleted || 1} key(s)`);
  }

  static async clear(options) {
    const { cache } = await import('triva');
    
    this.warn('This will clear ALL cache!');
    
    if (!options.force && !options.yes) {
      this.error('Add --force to confirm');
      process.exit(1);
    }

    this.info('Clearing cache...');

    await cache.delete('*');
    this.success('Cache cleared');
  }

  static async stats(options) {
    const { cache } = await import('triva');
    
    this.info('Calculating cache statistics...');

    const keys = await cache.list('*');

    if (!keys || keys.length === 0) {
      this.warn('Cache is empty');
      return;
    }

    // Group keys by prefix
    const byPrefix = keys.reduce((acc, key) => {
      const prefix = key.split(':')[0];
      acc[prefix] = (acc[prefix] || 0) + 1;
      return acc;
    }, {});

    console.log('\n📊 Cache Statistics\n');
    console.log(`Total Keys: ${keys.length}`);
    
    console.log('\nBy Prefix:');
    Object.entries(byPrefix)
      .sort((a, b) => b[1] - a[1])
      .forEach(([prefix, count]) => {
        const percentage = Math.round(count / keys.length * 100);
        console.log(`  ${prefix}: ${count} (${percentage}%)`);
      });

    this.success('Statistics calculated');
  }
}
