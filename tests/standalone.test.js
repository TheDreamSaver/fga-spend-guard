import { test } from 'node:test';
import assert from 'node:assert/strict';
import { freshExpenses, visibleTo, decide, addExpense, answer } from '../src/standalone/model.mjs';

test('sample roles illustrate ownership, transitive management and finance auditing', () => {
  const rows = freshExpenses();
  const ids = actor => rows.filter(row => visibleTo(actor, row)).map(row => row.id);
  assert.deepEqual(ids('dina_dev'), ['exp_101', 'exp_102']);
  assert.equal(ids('raj_manager').length, 4);
  assert.equal(ids('chen_vp').length, 5);
  assert.equal(ids('frank_finance').length, 6);
  assert.deepEqual(ids('unknown'), []);
});

test('demo decisions reject self-approval and spending limits but permit manager denial', () => {
  const rows = freshExpenses();
  assert.equal(decide(rows, 'dina_dev', 'exp_101', 'approve').ok, false);
  assert.equal(decide(rows, 'raj_manager', 'exp_102', 'approve').ok, false);
  assert.equal(decide(rows, 'chen_vp', 'exp_202', 'approve').ok, false);
  assert.equal(decide(rows, 'frank_finance', 'exp_101', 'approve').ok, false);
  assert.equal(decide(rows, 'chen_vp', 'exp_102', 'approve').ok, true);
  const denied = decide(rows, 'raj_manager', 'exp_102', 'deny');
  assert.equal(denied.ok, true);
  assert.equal(decide(denied.expenses, 'dina_dev', 'exp_102', 'reset').ok, true);
  assert.equal(rows[1].status, 'Pending');
});

test('scripted assistant only mutates on exact commands and applies the same rules', () => {
  const rows = freshExpenses();
  assert.equal(answer(rows, 'raj_manager', 'Approve exp_101').expenses[0].status, 'Approved');
  assert.equal(answer(rows, 'raj_manager', 'Approve exp_102').ok, false);
  assert.equal(answer(rows, 'dina_dev', 'Approve exp_201').ok, false);
  assert.equal(answer(rows, 'raj_manager', 'Do not approve exp_101').expenses[0].status, 'Pending');
  assert.match(answer(rows, 'raj_manager', 'What can I approve?').message, /exp_101/);
  assert.doesNotMatch(answer(rows, 'raj_manager', 'What can I approve?').message, /exp_102/);
});

test('new sample expenses use the chosen owner and reject invalid amounts', () => {
  const rows = freshExpenses();
  const result = addExpense(rows, 'frank_finance', { description: 'Train', amount: '25.50' }, 'exp_new');
  assert.equal(result.expenses.at(-1).submittedBy, 'frank_finance');
  assert.equal(result.expenses.at(-1).department, 'Finance');
  for (const amount of ['NaN', 'Infinity', '-1', '0.001']) assert.equal(addExpense(rows, 'dina_dev', { description: 'Test', amount }, 'exp_new').ok, false);
});
