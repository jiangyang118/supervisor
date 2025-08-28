// Lightweight TS path alias resolver for ts-node runtime (CommonJS preloader, no external deps)
// Reads tsconfig.base.json and maps `compilerOptions.paths` to absolute paths.
// Usage: add `-r ../../scripts/register-paths.js` to node/ts-node exec in service nodemon.json

const fs = require('fs');
const path = require('path');
const Module = require('module');

function loadTsPaths() {
  const repoRoot = path.resolve(__dirname, '..');
  const tsconfigPath = path.join(repoRoot, 'tsconfig.base.json');
  if (!fs.existsSync(tsconfigPath)) return null;
  const json = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
  const baseUrl = json?.compilerOptions?.baseUrl || '.';
  const paths = json?.compilerOptions?.paths || {};
  const absBase = path.resolve(repoRoot, baseUrl);

  const exact = new Map(); // alias -> abs target file/dir
  const wildcards = []; // { prefix, targetPrefix }

  for (const [alias, targets] of Object.entries(paths)) {
    if (!Array.isArray(targets) || targets.length === 0) continue;
    const first = targets[0];
    if (alias.endsWith('/*') && first.endsWith('/*')) {
      const prefix = alias.slice(0, -2);
      const targetPrefix = path.resolve(absBase, first.slice(0, -2));
      wildcards.push({ prefix, targetPrefix });
    } else {
      exact.set(alias, path.resolve(absBase, first));
    }
  }

  return { exact, wildcards };
}

const maps = loadTsPaths();
if (maps) {
  const originalResolve = Module._resolveFilename;
  Module._resolveFilename = function (request, parent, isMain, options) {
    if (maps.exact.has(request)) {
      request = maps.exact.get(request);
    } else if (typeof request === 'string') {
      for (const { prefix, targetPrefix } of maps.wildcards) {
        if (request.startsWith(prefix)) {
          const rest = request.slice(prefix.length);
          request = path.join(targetPrefix, rest);
          break;
        }
      }
    }
    return originalResolve.call(this, request, parent, isMain, options);
  };
}
