import {test} from 'node:test';
import assert from 'node:assert/strict';
import {FgaService} from '../server/fga-service.js';
test('failed model verification never marks a service initialized',async()=>{const service=new FgaService('',{readAuthorizationModel:async()=>{throw Error('down')}});assert.equal(await service.initialize(),false);await assert.rejects(()=>service.check('user:a','can_view','expense:x'))});
test('expense tuple cleanup scopes and paginates its reads',async()=>{
 const reads=[],writes=[];
 const client={readAuthorizationModel:async()=>({}),read:async(body,options)=>{reads.push([body,options]);return options.continuationToken ? {tuples:[{key:{user:'department:engineering',relation:'department',object:'expense:x'}}]} : {tuples:[{key:{user:'user:a',relation:'owner',object:'expense:x'}}],continuation_token:'next'}},write:async body=>writes.push(body)};
 const service=new FgaService('',client);await service.initialize();await service.removeAllExpenseTuples('x');
 assert.equal(reads.length,2);assert.ok(reads.every(([body])=>body.object==='expense:x'));assert.equal(writes[0].deletes.length,2);
});
