#!/usr/bin/env node

/**
 * Documentation Generator
 * Generates API documentation from source code and JSDoc comments
 */

import { readdir, readFile, writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const libDir = join(rootDir, 'lib');
const docsDir = join(rootDir, 'docs', 'api');

console.log('📚 Generating API Documentation...\n');

async function main() {
  // Ensure docs directory exists
  await mkdir(docsDir, { recursive: true });

  // Get all source files
  const files = await readdir(libDir);
  const jsFiles = files.filter(f => f.endsWith('.js'));

  console.log(`Found ${jsFiles.length} source files\n`);

  const documentation = {
    modules: [],
    functions: [],
    classes: [],
    types: []
  };

  // Parse each file
  for (const file of jsFiles) {
    console.log(`📖 Parsing ${file}...`);
    const content = await readFile(join(libDir, file), 'utf-8');
    const parsed = parseFile(content, file);
    
    documentation.modules.push({
      name: file.replace('.js', ''),
      ...parsed
    });
  }

  // Generate markdown documentation
  const markdown = generateMarkdown(documentation);
  await writeFile(join(docsDir, 'API.md'), markdown);

  // Generate JSON documentation
  await writeFile(
    join(docsDir, 'api.json'),
    JSON.stringify(documentation, null, 2)
  );

  console.log('\n✅ Documentation generated successfully!');
  console.log(`   📄 ${join(docsDir, 'API.md')}`);
  console.log(`   📄 ${join(docsDir, 'api.json')}\n`);
}

function parseFile(content, filename) {
  const result = {
    functions: [],
    classes: [],
    exports: []
  };

  // Extract JSDoc comments
  const jsdocPattern = /\/\*\*[\s\S]*?\*\//g;
  const jsdocs = content.match(jsdocPattern) || [];

  // Extract function exports
  const functionPattern = /export\s+(async\s+)?function\s+(\w+)/g;
  let match;
  while ((match = functionPattern.exec(content)) !== null) {
    result.functions.push({
      name: match[2],
      async: !!match[1],
      description: findJSDocFor(content, match.index)
    });
  }

  // Extract class exports
  const classPattern = /export\s+class\s+(\w+)/g;
  while ((match = classPattern.exec(content)) !== null) {
    result.classes.push({
      name: match[1],
      description: findJSDocFor(content, match.index)
    });
  }

  // Extract named exports
  const namedExportPattern = /export\s+{\s*([^}]+)\s*}/g;
  while ((match = namedExportPattern.exec(content)) !== null) {
    const exports = match[1].split(',').map(e => e.trim());
    result.exports.push(...exports);
  }

  return result;
}

function findJSDocFor(content, index) {
  // Find the JSDoc comment immediately before this position
  const before = content.substring(0, index);
  const jsdocMatch = before.match(/\/\*\*([\s\S]*?)\*\/\s*$/);
  
  if (!jsdocMatch) return null;

  const jsdoc = jsdocMatch[1];
  
  // Parse JSDoc
  const description = jsdoc
    .split('\n')
    .map(line => line.trim().replace(/^\*\s*/, ''))
    .filter(line => !line.startsWith('@'))
    .join(' ')
    .trim();

  const params = [];
  const paramPattern = /@param\s+{([^}]+)}\s+(\w+)\s+(.+)/g;
  let match;
  while ((match = paramPattern.exec(jsdoc)) !== null) {
    params.push({
      type: match[1],
      name: match[2],
      description: match[3]
    });
  }

  const returnMatch = jsdoc.match(/@returns?\s+{([^}]+)}\s+(.+)/);
  const returns = returnMatch ? {
    type: returnMatch[1],
    description: returnMatch[2]
  } : null;

  return {
    description,
    params,
    returns
  };
}

function generateMarkdown(docs) {
  let md = '# Triva API Documentation\n\n';
  md += `Generated: ${new Date().toISOString()}\n\n`;
  md += '## Table of Contents\n\n';

  // Table of contents
  docs.modules.forEach(module => {
    md += `- [${module.name}](#${module.name.toLowerCase()})\n`;
  });

  md += '\n---\n\n';

  // Module documentation
  docs.modules.forEach(module => {
    md += `## ${module.name}\n\n`;

    // Functions
    if (module.functions.length > 0) {
      md += '### Functions\n\n';
      module.functions.forEach(fn => {
        md += `#### ${fn.name}${fn.async ? ' (async)' : ''}\n\n`;
        
        if (fn.description?.description) {
          md += `${fn.description.description}\n\n`;
        }

        if (fn.description?.params?.length > 0) {
          md += '**Parameters:**\n\n';
          fn.description.params.forEach(param => {
            md += `- \`${param.name}\` (${param.type}): ${param.description}\n`;
          });
          md += '\n';
        }

        if (fn.description?.returns) {
          md += `**Returns:** \`${fn.description.returns.type}\` - ${fn.description.returns.description}\n\n`;
        }

        md += '---\n\n';
      });
    }

    // Classes
    if (module.classes.length > 0) {
      md += '### Classes\n\n';
      module.classes.forEach(cls => {
        md += `#### ${cls.name}\n\n`;
        
        if (cls.description?.description) {
          md += `${cls.description.description}\n\n`;
        }

        md += '---\n\n';
      });
    }

    // Exports
    if (module.exports.length > 0) {
      md += '### Exports\n\n';
      module.exports.forEach(exp => {
        md += `- \`${exp}\`\n`;
      });
      md += '\n';
    }
  });

  return md;
}

main().catch((err) => {
  console.error('❌ Documentation generation failed:', err);
  process.exit(1);
});
