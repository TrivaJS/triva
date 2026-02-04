/**
 * Base Command class
 * Provides common functionality for all CLI commands
 */

import { readFile } from 'fs/promises';
import { resolve } from 'path';

export class Command {
  static async loadConfig(configPath) {
    const path = resolve(process.cwd(), configPath || 'triva.config.js');
    
    try {
      const config = await import(path);
      return config.default || config;
    } catch (err) {
      throw new Error(`Failed to load config from ${path}: ${err.message}`);
    }
  }

  static formatOutput(data, format = 'table') {
    switch (format) {
      case 'json':
        return JSON.stringify(data, null, 2);
      
      case 'csv':
        return this.toCSV(data);
      
      case 'table':
      default:
        return this.toTable(data);
    }
  }

  static toTable(data) {
    if (!Array.isArray(data) || data.length === 0) {
      return 'No data';
    }

    const keys = Object.keys(data[0]);
    const widths = keys.map(key => 
      Math.max(key.length, ...data.map(row => String(row[key] || '').length))
    );

    // Header
    let output = keys.map((key, i) => key.padEnd(widths[i])).join(' | ') + '\n';
    output += widths.map(w => '-'.repeat(w)).join('-+-') + '\n';

    // Rows
    data.forEach(row => {
      output += keys.map((key, i) => 
        String(row[key] || '').padEnd(widths[i])
      ).join(' | ') + '\n';
    });

    return output;
  }

  static toCSV(data) {
    if (!Array.isArray(data) || data.length === 0) {
      return '';
    }

    const keys = Object.keys(data[0]);
    let csv = keys.join(',') + '\n';

    data.forEach(row => {
      csv += keys.map(key => {
        const value = String(row[key] || '');
        return value.includes(',') ? `"${value}"` : value;
      }).join(',') + '\n';
    });

    return csv;
  }

  static parseTimeRange(timeStr) {
    if (!timeStr) return null;

    const match = timeStr.match(/^(\d+)(h|d|w|m)$/);
    if (!match) return null;

    const [, amount, unit] = match;
    const num = parseInt(amount);

    const multipliers = {
      h: 3600000,      // hours
      d: 86400000,     // days
      w: 604800000,    // weeks
      m: 2592000000    // months (30 days)
    };

    return Date.now() - (num * multipliers[unit]);
  }

  static async writeOutput(data, filepath, format = 'json') {
    const { writeFile } = await import('fs/promises');
    const content = format === 'json' 
      ? JSON.stringify(data, null, 2)
      : data;
    
    await writeFile(filepath, content, 'utf-8');
  }

  static success(message) {
    console.log(`✅ ${message}`);
  }

  static error(message) {
    console.error(`❌ ${message}`);
  }

  static info(message) {
    console.log(`ℹ️  ${message}`);
  }

  static warn(message) {
    console.log(`⚠️  ${message}`);
  }
}
