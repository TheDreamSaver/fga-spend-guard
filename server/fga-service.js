import { createFgaClient } from '../fga-config.js';

export class FgaService {
  constructor(prefix = '', client = createFgaClient(prefix)) {
    this.client = client;
    this.isInitialized = false;
  }
  async initialize() {
    this.isInitialized = false;
    if (!this.client) return false;
    try {
      await this.client.readAuthorizationModel();
      this.isInitialized = true;
      return true;
    } catch { return false; }
  }
  ready() { if (!this.isInitialized) throw new Error('OpenFGA is unavailable.'); }
  async check(user, relation, object) {
    this.ready();
    return (await this.client.check({ user, relation, object })).allowed === true;
  }
  async listObjects(user, relation, type) {
    this.ready();
    return (await this.client.listObjects({ user, relation, type })).objects || [];
  }
  async addRelationship(user, relation, object) {
    this.ready();
    await this.client.write({ writes: [{ user, relation, object }] });
    return true;
  }
  async removeRelationship(user, relation, object) {
    this.ready();
    await this.client.write({ deletes: [{ user, relation, object }] });
    return true;
  }
  async removeAllExpenseTuples(expenseId) {
    this.ready();
    const object = `expense:${expenseId}`;
    const deletes = [];
    let continuationToken;
    do {
      const page = await this.client.read({ object }, { pageSize: 100, continuationToken });
      deletes.push(...(page.tuples || []).filter(tuple => tuple.key.object === object).map(tuple => ({ user: tuple.key.user, relation: tuple.key.relation, object })));
      continuationToken = page.continuation_token || undefined;
    } while (continuationToken);
    if (deletes.length) await this.client.write({ deletes });
    return true;
  }
  getStatus() { return { initialized: this.isInitialized }; }
}
