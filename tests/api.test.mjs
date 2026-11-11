import {test} from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/claude.js';
const response=()=>({headers:{},setHeader(k,v){this.headers[k]=v},status(n){this.code=n;return this},json(d){this.data=d;return this}});
test('rejects non-POST',async()=>{const r=response();await handler({method:'GET'},r);assert.equal(r.code,405)});
test('rejects cross-origin',async()=>{const r=response();await handler({method:'POST',headers:{origin:'https://evil.test',host:'app.test'}},r);assert.equal(r.code,403)});
test('reports missing configuration without exposing credentials',async()=>{const old=process.env.ANTHROPIC_API_KEY;delete process.env.ANTHROPIC_API_KEY;const r=response();await handler({method:'POST',headers:{}},r);assert.equal(r.code,503);if(old)process.env.ANTHROPIC_API_KEY=old});
