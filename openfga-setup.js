import { OpenFgaClient } from '@openfga/sdk';
import { fgaConfig } from './fga-config.js';
import { readFile } from 'node:fs/promises';

export const model = { schema_version: '1.1', type_definitions: [
  { type:'user', relations:{manager:{this:{}},can_manage:{union:{child:[{computed_userset:{relation:'manager'}},{tuple_to_userset:{tupleset:{relation:'manager'},computed_userset:{relation:'can_manage'}}}]}}}, metadata:{relations:{manager:{directly_related_user_types:[{type:'user'}]}}} },
  { type:'department',relations:{finance_auditor:{this:{}},member:{this:{}}},metadata:{relations:{finance_auditor:{directly_related_user_types:[{type:'user'}]},member:{directly_related_user_types:[{type:'user'}]}}} },
  { type:'expense',relations:{owner:{this:{}},department:{this:{}},can_approve:{tuple_to_userset:{tupleset:{relation:'owner'},computed_userset:{relation:'can_manage'}}},can_view:{union:{child:[{computed_userset:{relation:'owner'}},{tuple_to_userset:{tupleset:{relation:'owner'},computed_userset:{relation:'can_manage'}}},{tuple_to_userset:{tupleset:{relation:'department'},computed_userset:{relation:'finance_auditor'}}}]}}},metadata:{relations:{owner:{directly_related_user_types:[{type:'user'}]},department:{directly_related_user_types:[{type:'department'}]}}} },
] };
export async function setup(env=process.env) {
  const client=new OpenFgaClient(fgaConfig('',env,true));
  const storeId=env.OPENFGA_STORE_ID || (await client.createStore({name:'SmartSpend local demo'})).id;
  const {authorization_model_id:modelId}=await client.writeAuthorizationModel(model,{storeId});
  const seed=JSON.parse(await readFile(new URL('./data/demo-expenses.json',import.meta.url),'utf8')).expenses;
  const tuples=[
    {user:'user:raj_manager',relation:'manager',object:'user:dina_dev'},
    {user:'user:chen_vp',relation:'manager',object:'user:raj_manager'},
    ...['engineering','finance'].map(department=>({user:'user:frank_finance',relation:'finance_auditor',object:`department:${department}`})),
    ...seed.flatMap(expense=>[{user:`user:${expense.submittedBy}`,relation:'owner',object:`expense:${expense.id}`},{user:`department:${expense.department.toLowerCase()}`,relation:'department',object:`expense:${expense.id}`}]),
  ];
  await client.write({writes:tuples},{storeId,authorizationModelId:modelId});
  console.log(`OPENFGA_STORE_ID=${storeId}\nOPENFGA_AUTHORIZATION_MODEL_ID=${modelId}`);
  return {storeId,modelId};
}
if(process.argv[1]?.endsWith('/openfga-setup.js')) setup().catch(error=>{console.error(error.message);process.exitCode=1});
