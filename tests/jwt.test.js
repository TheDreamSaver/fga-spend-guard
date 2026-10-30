import {test} from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPair,exportJWK,createLocalJWKSet,SignJWT} from 'jose';
import {tokenVerifier} from '../server/access.js';
test('JWT verifier enforces signature, issuer, audience and expiry',async()=>{
 const {privateKey,publicKey}=await generateKeyPair('RS256');
 const jwk={...await exportJWK(publicKey),kid:'test'};
 const verify=tokenVerifier({AUTH0_ISSUER_BASE_URL:'https://auth.example/',AUTH0_AUDIENCE:'smartspend'},createLocalJWKSet({keys:[jwk]}));
 const sign=({iss='https://auth.example/',aud='smartspend',exp='2m',key=privateKey}={})=>new SignJWT({sub:'verified-user'}).setProtectedHeader({alg:'RS256',kid:'test'}).setIssuer(iss).setAudience(aud).setIssuedAt().setExpirationTime(exp).sign(key);
 assert.equal((await verify(await sign())).sub,'verified-user');
 await assert.rejects(()=>sign({aud:'other'}).then(verify));
 await assert.rejects(()=>sign({iss:'https://other.example/'}).then(verify));
 await assert.rejects(()=>sign({exp:'-1s'}).then(verify));
 const other=await generateKeyPair('RS256');
 await assert.rejects(()=>sign({key:other.privateKey}).then(verify));
});
