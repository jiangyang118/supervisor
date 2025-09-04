#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../../../');
const SPEC = process.env.TRUSTIVS_OPENAPI_PATH || path.join(ROOT, 'prompt/bright/trustivs_openapi_3_1.json');
const OUT_DIR = path.join(__dirname, '..', 'src', 'vendor', 'trustivs');

function pascal(str) {
  return String(str).replace(/[^a-zA-Z0-9]+/g, ' ').split(' ').filter(Boolean).map(s => s[0].toUpperCase() + s.slice(1)).join('');
}

function methodName(httpMethod, p) {
  const name = p.replace(/^\//, '').replace(/\{([^}]+)\}/g, 'By_$1').replace(/[^a-zA-Z0-9]+/g, '_');
  return httpMethod.toLowerCase() + '_' + (name || 'root');
}

function generateService(spec) {
  const lines = [];
  lines.push(`import { TrustIVSService } from './trustivs.service';`);
  lines.push('');
  lines.push(`export class TrustIVSGeneratedService extends TrustIVSService {`);
  const paths = spec.paths || {};
  for (const p of Object.keys(paths)) {
    const item = paths[p];
    for (const m of Object.keys(item)) {
      const op = item[m];
      const params = (op.parameters || item.parameters || []).filter(p => p.in === 'path').map(p => p.name);
      const mName = methodName(m, p);
      const paramList = params.map(n => `${n}: string`).join(', ');
      const callPath = '`' + p.replace(/\\{([^}]+)\\}/g, '${$1}') + '`';
      lines.push('');
      lines.push(`  async ${mName}(${paramList}${paramList? ', ' : ''}q?: Record<string, any>, body?: any, headers?: Record<string,string>) {`);
      lines.push(`    const path = ${callPath} + (q && Object.keys(q).length ? ('?' + new URLSearchParams(Object.entries(q).flatMap(([k,v]) => Array.isArray(v)? v.map(x=>[k,x]): [[k, v]] )).toString()) : '');`);
      lines.push(`    return this.request('${m.toUpperCase()}', path, { headers, body });`);
      lines.push(`  }`);
    }
  }
  lines.push('}');
  return lines.join('\n');
}

function generateController(spec) {
  const lines = [];
  lines.push(`import { Controller, Req, Body, Headers, Query, Param, Get, Post, Put, Patch, Delete } from '@nestjs/common';`);
  lines.push(`import { Request } from 'express';`);
  lines.push(`import { TrustIVSGeneratedService } from './trustivs.generated.service';`);
  lines.push('');
  lines.push(`@Controller('trustivs')`);
  lines.push(`export class TrustIVSGeneratedController {`);
  lines.push(`  private readonly svc = new TrustIVSGeneratedService();`);

  const paths = spec.paths || {};
  for (const p of Object.keys(paths)) {
    const item = paths[p];
    for (const m of Object.keys(item)) {
      const op = item[m];
      const params = (op.parameters || item.parameters || []).filter(p => p.in === 'path').map(p => p.name);
      const mapDeco = { get: 'Get', post: 'Post', put: 'Put', patch: 'Patch', delete: 'Delete' };
      const httpDecorator = mapDeco[m.toLowerCase()] || 'Post';
      const mName = methodName(m, p);
      const route = p.replace(/^\//, '');
      const paramList = params.map(n => `@Param('${n}') ${n}: string`).join(', ');
      const callPath = '`' + p.replace(/\{([^}]+)\}/g, '${$1}') + '`';
      lines.push('');
      lines.push(`  @${httpDecorator}('${route}')`);
      lines.push(`  async ${mName}(${paramList}${paramList ? ', ' : ''}@Query() q: Record<string, any>, @Body() body: any, @Headers() headers: Record<string, any>, @Req() req: Request) {`);
      lines.push(`    const path = ${callPath} + (Object.keys(q || {}).length ? ('?' + new URLSearchParams(Object.entries(q).flatMap(([k,v]) => Array.isArray(v)? v.map(x=>[k,x]): [[k, v]] )).toString()) : '');`);
      lines.push(`    return (await this.svc.${mName}(${params.join(', ')}${params.length? ', ' : ''}q, body, headers)).data;`);
      lines.push(`  }`);
    }
  }

  lines.push('}');
  return lines.join('\n');
}

function main() {
  if (!fs.existsSync(SPEC)) {
    console.error('OpenAPI spec not found:', SPEC);
    process.exit(1);
  }
  const spec = JSON.parse(fs.readFileSync(SPEC, 'utf8'));
  const code = generateController(spec);
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const outFile = path.join(OUT_DIR, 'trustivs.generated.controller.ts');
  fs.writeFileSync(outFile, code, 'utf8');
  console.log('Generated controller at', path.relative(ROOT, outFile));
}

main();
