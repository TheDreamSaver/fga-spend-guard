// A browser-only illustration of model.fga, not an OpenFGA client or security boundary.
export const PEOPLE = {
  dina_dev: { name: 'Dina Dev', role: 'Software engineer', department: 'Engineering', limit: 0, manager: 'raj_manager', note: 'Can see her own expenses. Her manager approves them.' },
  raj_manager: { name: 'Raj Manager', role: 'Engineering manager', department: 'Engineering', limit: 500, manager: 'chen_vp', note: 'Can see his own and Dina’s expenses. Approves Dina’s requests up to $500.' },
  chen_vp: { name: 'Chen VP', role: 'VP of Engineering', department: 'Engineering', limit: 5000, note: 'Can see expenses across his reporting chain. Approves others’ requests up to $5,000.' },
  frank_finance: { name: 'Frank Finance', role: 'Finance analyst', department: 'Finance', limit: 0, note: 'Can see all expenses for auditing. Cannot approve or deny requests.' },
}

export const SEED = [
  { id: 'exp_101', description: 'Laptop accessories', amount: 150, submittedBy: 'dina_dev', category: 'Equipment' },
  { id: 'exp_102', description: 'Conference registration', amount: 900, submittedBy: 'dina_dev', category: 'Training' },
  { id: 'exp_201', description: 'Team lunch', amount: 200, submittedBy: 'raj_manager', category: 'Meals' },
  { id: 'exp_202', description: 'Team training', amount: 6000, submittedBy: 'raj_manager', category: 'Training' },
  { id: 'exp_301', description: 'Software licenses', amount: 1200, submittedBy: 'chen_vp', category: 'Software' },
  { id: 'exp_401', description: 'Audit tools', amount: 500, submittedBy: 'frank_finance', category: 'Tools' },
].map(expense => ({ ...expense, department: PEOPLE[expense.submittedBy].department, date: '2026-10-31', status: 'Pending' }))

export const freshExpenses = () => structuredClone(SEED)
export const money = amount => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(amount)

export function manages(actor, owner) {
  const visited = new Set()
  let manager = PEOPLE[owner]?.manager
  while (manager && !visited.has(manager)) {
    if (manager === actor) return true
    visited.add(manager)
    manager = PEOPLE[manager]?.manager
  }
  return false
}

export const visibleTo = (actor, expense) => Boolean(PEOPLE[actor]) && (actor === 'frank_finance' || expense.submittedBy === actor || manages(actor, expense.submittedBy))

export function approvalReason(actor, expense) {
  if (expense.submittedBy === actor) return 'You cannot approve your own expense.'
  if (!manages(actor, expense.submittedBy)) return 'This expense is outside your reporting chain.'
  if (expense.status !== 'Pending') return 'This expense already has a decision.'
  if (expense.amount > PEOPLE[actor].limit) return `Above your ${money(PEOPLE[actor].limit)} approval limit.`
  return ''
}

export function decide(expenses, actor, id, action) {
  const expense = expenses.find(item => item.id === id)
  const fail = message => ({ ok: false, expenses, message })
  if (!expense || !visibleTo(actor, expense)) return fail('This expense is not available to this role.')
  const manager = manages(actor, expense.submittedBy)
  if (action === 'approve') {
    const reason = approvalReason(actor, expense)
    if (reason) return fail(reason)
  } else if (action === 'deny') {
    if (!manager || expense.status !== 'Pending') return fail('Only a manager in the reporting chain can deny a pending request.')
  } else if (action === 'reset') {
    if (expense.status === 'Pending' || !(manager || expense.submittedBy === actor && expense.status === 'Denied')) return fail('This role cannot reset that expense.')
  } else if (action === 'delete') {
    if (expense.submittedBy !== actor || expense.status === 'Approved') return fail('Only the owner can remove an unapproved request.')
    return { ok: true, expenses: expenses.filter(item => item.id !== id), message: `${id} removed from this demo.` }
  } else return fail('Unknown action.')
  const status = { approve: 'Approved', deny: 'Denied', reset: 'Pending' }[action]
  const updated = { ...expense, status, decidedBy: status === 'Pending' ? undefined : actor }
  return { ok: true, expenses: expenses.map(item => item.id === id ? updated : item), message: `${id}: ${status.toLowerCase()}.` }
}

export function addExpense(expenses, actor, input, id) {
  const amount = Number(input.amount)
  if (!PEOPLE[actor] || !input.description?.trim() || input.description.length > 120 || !Number.isFinite(amount) || amount < 0.01 || amount > 1000000 || expenses.length >= 100 || expenses.some(item => item.id === id)) return { ok: false, expenses, message: 'Enter a description and an amount between $0.01 and $1,000,000 (up to 100 demo expenses).' }
  const expense = { id, description: input.description.trim(), amount: Math.round(amount * 100) / 100, category: 'Other', submittedBy: actor, department: PEOPLE[actor].department, status: 'Pending', date: new Date().toISOString().slice(0, 10) }
  return { ok: true, expenses: [...expenses, expense], message: `${id} added for ${PEOPLE[actor].name}.` }
}

export function answer(expenses, actor, question) {
  const visible = expenses.filter(expense => visibleTo(actor, expense))
  const command = question.trim().match(/^(approve|deny|reject|reset)\s+(?:expense\s+)?(exp_[a-z0-9_-]+)[.!?]?$/i)
  if (command) return decide(expenses, actor, command[2].toLowerCase(), command[1].toLowerCase() === 'reject' ? 'deny' : command[1].toLowerCase())
  const text = question.toLowerCase()
  let selected = visible
  let introduction = 'Expenses visible to this role:'
  if (/what.*approv|can i approv|need.*approv/.test(text)) {
    selected = visible.filter(expense => !approvalReason(actor, expense))
    introduction = 'Pending expenses you can approve:'
  } else if (/my expenses|submitted by me/.test(text)) {
    selected = visible.filter(expense => expense.submittedBy === actor)
    introduction = 'Your submitted expenses:'
  } else if (/pending/.test(text)) {
    selected = visible.filter(expense => expense.status === 'Pending')
    introduction = 'Visible pending expenses:'
  } else if (/limit|permission|role/.test(text)) return { ok: true, expenses, message: PEOPLE[actor].note }
  else if (!/expenses|show|summary/.test(text)) return { ok: true, expenses, message: 'This is a scripted demo. Try “What can I approve?”, “Show my expenses”, or an exact command such as “Approve exp_101”.' }
  const lines = selected.map(expense => `${expense.id} · ${expense.description} · ${money(expense.amount)} · ${expense.status}`)
  return { ok: true, expenses, message: introduction + '\n' + (lines.join('\n') || 'None for this role.') }
}
