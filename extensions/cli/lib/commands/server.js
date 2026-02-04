/**
 * Server Commands
 * Manage Triva server
 */

import { Command } from '../command.js';
import { spawn } from 'child_process';
import { writeFile, readFile, unlink } from 'fs/promises';
import { existsSync } from 'fs';

export class ServerCommands extends Command {
  static PID_FILE = '.triva.pid';

  static async handle(subcommand, options) {
    switch (subcommand) {
      case 'start':
        await this.start(options);
        break;
      
      case 'stop':
        await this.stop(options);
        break;
      
      case 'restart':
        await this.restart(options);
        break;
      
      case 'status':
        await this.status(options);
        break;
      
      default:
        this.error(`Unknown server subcommand: ${subcommand}`);
        this.info('Available: start, stop, restart, status');
        process.exit(1);
    }
  }

  static async start(options) {
    const pidFile = options.pidFile || this.PID_FILE;

    // Check if already running
    if (existsSync(pidFile)) {
      const pid = parseInt(await readFile(pidFile, 'utf-8'));
      
      if (this.isProcessRunning(pid)) {
        this.warn(`Server already running (PID: ${pid})`);
        return;
      } else {
        // Stale PID file
        await unlink(pidFile);
      }
    }

    const entry = options.entry || options.file || 'index.js';
    
    this.info(`Starting Triva server from ${entry}...`);

    const child = spawn('node', [entry], {
      detached: true,
      stdio: options.daemon ? 'ignore' : 'inherit'
    });

    if (options.daemon) {
      child.unref();
      await writeFile(pidFile, child.pid.toString());
      this.success(`Server started in background (PID: ${child.pid})`);
      this.info(`To stop: triva server stop`);
    } else {
      this.success('Server started');
    }
  }

  static async stop(options) {
    const pidFile = options.pidFile || this.PID_FILE;

    if (!existsSync(pidFile)) {
      this.error('No PID file found. Is the server running?');
      process.exit(1);
    }

    const pid = parseInt(await readFile(pidFile, 'utf-8'));

    if (!this.isProcessRunning(pid)) {
      this.warn('Server is not running');
      await unlink(pidFile);
      return;
    }

    this.info(`Stopping server (PID: ${pid})...`);

    try {
      process.kill(pid, 'SIGTERM');
      
      // Wait for process to stop
      let attempts = 0;
      while (this.isProcessRunning(pid) && attempts < 30) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }

      if (this.isProcessRunning(pid)) {
        this.warn('Server did not stop gracefully, forcing...');
        process.kill(pid, 'SIGKILL');
      }

      await unlink(pidFile);
      this.success('Server stopped');
    } catch (err) {
      this.error(`Failed to stop server: ${err.message}`);
      process.exit(1);
    }
  }

  static async restart(options) {
    this.info('Restarting server...');
    
    try {
      await this.stop(options);
    } catch (err) {
      // Server might not be running
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
    await this.start(options);
  }

  static async status(options) {
    const pidFile = options.pidFile || this.PID_FILE;

    if (!existsSync(pidFile)) {
      console.log('Status: ❌ Not running');
      return;
    }

    const pid = parseInt(await readFile(pidFile, 'utf-8'));

    if (!this.isProcessRunning(pid)) {
      console.log('Status: ❌ Not running (stale PID file)');
      await unlink(pidFile);
      return;
    }

    console.log('Status: ✅ Running');
    console.log(`PID: ${pid}`);
    
    // Get process info
    try {
      const mem = process.memoryUsage();
      console.log(`Memory: ${Math.round(mem.heapUsed / 1024 / 1024)}MB`);
      
      const uptime = process.uptime();
      const hours = Math.floor(uptime / 3600);
      const minutes = Math.floor((uptime % 3600) / 60);
      console.log(`Uptime: ${hours}h ${minutes}m`);
    } catch (err) {
      // Can't get process info
    }

    this.success('Server is running');
  }

  static isProcessRunning(pid) {
    try {
      process.kill(pid, 0);
      return true;
    } catch {
      return false;
    }
  }
}
