const assert = require('node:assert/strict')
const fs = require('node:fs')
const ts = require('typescript')
const vm = require('node:vm')
const code = ts.transpileModule(fs.readFileSync('src/lib/admin-types.ts','utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText
const context={exports:{}}
vm.runInNewContext(code,context)
const { tally }=context.exports
const category={nominees:[{id:'a'},{id:'b'},{id:'c'},{id:'d'}]}
const empty=tally(category,{})
assert.equal(empty.total,0);assert.equal(empty.leaders.length,0);assert.equal(empty.percent('a'),0)
const winner=tally(category,{a:6,b:2,c:1,d:1,otherCategory:999})
assert.equal(winner.total,10);assert.equal(winner.percent('a'),60);assert.equal(winner.leaders[0].id,'a')
const tied=tally(category,{a:5,b:5,c:0,d:0})
assert.equal(tied.leaders.length,2);assert.equal(tied.percent('b'),50)
const large=tally(category,{a:1500,b:500})
assert.equal(large.total,2000);assert.equal(large.percent('a'),75)
console.log('PASS: zero votes, winner, tie, category denominator, counts over 1000')
