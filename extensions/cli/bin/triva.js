#!/usr/bin/env node

/**
 * @trivajs/cli
 * Command-line interface for managing Triva applications
 */

import { Command } from './lib/command.js';
import { LogCommands } from './lib/commands/logs.js';
import { ErrorCommands } from './lib/commands/errors.js';
import { CacheCommands } from './lib/commands/cache.js';
import { StatsCommands } from './lib/commands/stats.js';
import { ServerCommands } from './lib/commands/server.js';

const version = '1.0.0';

// Parse arguments
const args = process.argv.slice(2);

if (args.length === 0 || args[0] === 'help' || args[0] === '--help' || args[0] === '-h') {
  showHelp();
  process.exit(0);
}

if (args[0] === 'version' || args[0] === '--version' || args[0] === '-v') {
  console.log(`@trivajs/cli v${version}`);
  process.exit(0);
}

// Main command router
async function main() {
  const command = args[0];
  const subcommand = args[1];
  const options = parseOptions(args.slice(2));

  try {
    switch (command) {
      case 'logs':
        await LogCommands.handle(subcommand, options);
        break;
      
      case 'errors':
        await ErrorCommands.handle(subcommand, options);
        break;
      
      case 'cache':
        await CacheCommands.handle(subcommand, options);
        break;
      
      case 'stats':
        await StatsCommands.handle(subcommand, options);
        break;
      
      case 'server':
        await ServerCommands.handle(subcommand, options);
        break;
      
      default:
        console.error(`❌ Unknown command: ${command}`);
        console.log('Run "triva help" for usage information\n');
        process.exit(1);
    }
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

function parseOptions(args) {
  const options = {};
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const nextArg = args[i + 1];
      
      if (nextArg && !nextArg.startsWith('--')) {
        options[key] = nextArg;
        i++;
      } else {
        options[key] = true;
      }
    } else if (arg.startsWith('-')) {
      const key = arg.slice(1);
      options[key] = true;
    }
  }
  
  return options;
}

function showHelp() {
  console.log(`
⚡ Triva CLI - Command-line interface for Triva applications

Usage: triva <command> [subcommand] [options]

Commands:

  logs <subcommand>        Manage request logs
    list                   List recent logs
    get <id>              Get specific log entry
    export                Export logs to file
    clear                 Clear all logs
    filter                Filter logs by criteria

  errors <subcommand>      Manage error tracking
    list                   List recent errors
    get <id>              Get specific error
    resolve <id>          Mark error as resolved
    clear                 Clear all errors
    stats                 Show error statistics

  cache <subcommand>       Manage cache
    list                   List cache keys
    get <key>             Get cache value
    set <key> <value>     Set cache value
    delete <key>          Delete cache key
    clear                 Clear all cache
    stats                 Show cache statistics

  stats                    Show application statistics
    requests              Request statistics
    performance           Performance metrics
    health                Health check

  server <subcommand>      Server management
    start                 Start Triva server
    stop                  Stop running server
    restart               Restart server
    status                Check server status

Options:

  --config <path>         Path to Triva config file (default: triva.config.js)
  --format <type>         Output format: json, table, csv (default: table)
  --limit <number>        Limit results (default: 50)
  --output <file>         Output to file
  --severity <level>      Filter by severity: info, warn, error
  --since <time>          Filter by time: 1h, 24h, 7d
  --help, -h              Show help
  --version, -v           Show version

Examples:

  # List recent logs
  triva logs list --limit 100

  # Export logs to JSON
  triva logs export --format json --output logs.json

  # Clear old logs
  triva logs clear --since 7d

  # List errors
  triva errors list --severity error

  # Resolve an error
  triva errors resolve abc123

  # Get cache value
  triva cache get user:123

  # Clear cache pattern
  triva cache delete "users:*"

  # Show stats
  triva stats requests

Documentation: https://github.com/yourusername/triva/extensions/cli
`);
}

main();
