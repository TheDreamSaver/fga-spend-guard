import { useEffect, useState } from 'react'
import { ArrowUpRight, Check, RotateCcw, Send, ShieldCheck, X } from 'lucide-react'
import { PEOPLE, freshExpenses, money, visibleTo, manages, approvalReason, decide, addExpense, answer } from './model.mjs'

const STORAGE_KEY = 'smartspend-sample-v1'
const button = 'inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 disabled:cursor-not-allowed disabled:opacity-40'
const panel = 'rounded-2xl border border-slate-200 bg-white shadow-sm'
const field = 'min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base focus:outline-2 focus:outline-emerald-700'

function loadExpenses() {
  try {
    const data = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || 'null')
    if (Array.isArray(data) && data.length <= 100 && data.every(item => item && typeof item.id === 'string' && typeof item.description === 'string' && Number.isFinite(item.amount) && item.amount > 0 && PEOPLE[item.submittedBy] && ['Pending', 'Approved', 'Denied'].includes(item.status))) return data
  } catch { /* Storage can be unavailable in private browsing. */ }
  return freshExpenses()
}

export default function StandaloneApp() {
  const [actor, setActor] = useState('raj_manager')
  const [expenses, setExpenses] = useState(loadExpenses)
  const [notice, setNotice] = useState('')
  const [storageAvailable, setStorageAvailable] = useState(true)
  const [query, setQuery] = useState('')
  const [messages, setMessages] = useState<{ role: string; text: string }[]>([])
  const [adding, setAdding] = useState(false)
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const person = PEOPLE[actor]
  const visible = expenses.filter(expense => visibleTo(actor, expense))
  const approvable = visible.filter(expense => !approvalReason(actor, expense))

  useEffect(() => {
    document.title = 'SmartSpend · Expense approval demo'
    for (const selector of ['meta[name="description"]', 'meta[property="og:description"]']) document.querySelector(selector)?.setAttribute('content', 'An interactive sample-data demonstration of expense visibility, reporting chains and approval limits. Built by Ashish Jha.')
    document.querySelector('meta[property="og:title"]')?.setAttribute('content', 'SmartSpend · Expense approval demo')
  }, [])

  useEffect(() => {
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(expenses)) }
    catch { setStorageAvailable(false) }
  }, [expenses])

  function changeRole(value: string) {
    setActor(value)
    setMessages([])
    setNotice('')
    setQuery('')
    setAdding(false)
  }

  function act(id: string, action: string) {
    const result = decide(expenses, actor, id, action)
    if (result.ok) setExpenses(result.expenses)
    setNotice(result.message)
  }

  function ask(question: string) {
    if (!question.trim()) return
    const result = answer(expenses, actor, question)
    if (result.ok && result.expenses !== expenses) setExpenses(result.expenses)
    setMessages(previous => [...previous, { role: 'You', text: question }, { role: 'Demo assistant', text: result.message }].slice(-12))
    setQuery('')
  }

  function submitExpense(event: React.FormEvent) {
    event.preventDefault()
    const result = addExpense(expenses, actor, { description, amount }, `exp_${crypto.randomUUID().slice(0, 8)}`)
    if (result.ok) { setExpenses(result.expenses); setAdding(false); setDescription(''); setAmount('') }
    setNotice(result.message)
  }

  function reset() {
    setExpenses(freshExpenses())
    setMessages([])
    setAdding(false)
    setNotice('Sample data restored.')
  }

  return <div className="min-h-screen bg-slate-50 text-slate-900">
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-5 sm:px-6">
        <a href="/" className="flex items-center gap-3 text-xl font-bold tracking-tight"><span className="rounded-xl bg-emerald-700 p-2 text-white"><ShieldCheck aria-hidden="true" size={22} /></span>SmartSpend</a>
        <a className="inline-flex min-h-10 items-center gap-1 text-sm text-slate-600 hover:text-emerald-800" href="https://ashishjha.ai/work">Built by Ashish Jha <ArrowUpRight aria-hidden="true" size={16} /></a>
      </div>
    </header>
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div className="max-w-2xl space-y-3"><span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-900">Interactive sample-data demo</span>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Who can approve this expense?</h1>
          <p className="text-base leading-relaxed text-slate-600">Switch roles to explore ownership, reporting chains and spending limits. This simulation runs entirely in your browser; changes stay in this tab.</p>
        </div>
        <button type="button" className={button} onClick={reset}><RotateCcw aria-hidden="true" size={16} />Reset demo</button>
      </div>
      {!storageAvailable && <p role="status" className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">Browser storage is unavailable. You can still try the demo; refreshing will reset your changes.</p>}
      <section aria-label="Choose a role" className={`${panel} grid gap-5 p-5 sm:grid-cols-[minmax(220px,1fr)_2fr] sm:p-6`}>
        <div><label htmlFor="persona" className="mb-2 block text-sm font-semibold">Try a different role</label>
          <select id="persona" value={actor} onChange={event => changeRole(event.target.value)} className={field}>
            {Object.entries(PEOPLE).map(([id, value]: [string, any]) => <option key={id} value={id}>{value.name} · {value.role}</option>)}
          </select>
        </div>
        <div className="space-y-2"><p className="font-semibold">{person.role} · {person.department}</p><p className="text-sm leading-relaxed text-slate-600">{person.note}</p><p className="text-xs leading-relaxed text-slate-500">Reporting chain: Dina → Raj → Chen. Finance can view every request for auditing.</p></div>
      </section>
      <div className="grid grid-cols-3 gap-3 sm:gap-5">
        {[[visible.length, 'Visible requests'], [approvable.length, 'Ready for your approval'], [person.limit ? money(person.limit) : 'View only', 'Approval limit']].map(([value, label]) => <div key={label} className={`${panel} p-3 sm:p-5`}><p className="text-lg font-semibold tabular-nums sm:text-2xl">{value}</p><p className="mt-1 text-xs leading-relaxed text-slate-500 sm:text-sm">{label}</p></div>)}
      </div>
      <p role="status" className="min-h-6 text-sm font-medium text-emerald-800">{notice}</p>
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.8fr)_minmax(300px,1fr)]">
        <section aria-labelledby="expenses-title" className={`${panel} min-w-0 overflow-hidden`}>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-5"><div><h2 id="expenses-title" className="text-lg font-semibold">Expense requests</h2><p className="mt-1 text-sm text-slate-500">Showing what {person.name.split(' ')[0]} can see.</p><p className="mt-1 text-xs text-slate-500 sm:hidden">Swipe the table to see actions →</p></div><button type="button" aria-expanded={adding} className={button} onClick={() => setAdding(!adding)}>Add expense</button></div>
          {adding && <form onSubmit={submitExpense} className="space-y-3 border-b border-slate-200 bg-slate-50 p-5">
            <p className="text-sm font-medium">Submit as {person.name}</p>
            <div><label htmlFor="description" className="mb-1 block text-sm">Description</label><input id="description" required maxLength={120} value={description} onChange={event => setDescription(event.target.value)} className={field} placeholder="e.g. Train to a client meeting" /></div>
            <div><label htmlFor="amount" className="mb-1 block text-sm">Amount (USD)</label><input id="amount" required type="number" min="0.01" max="1000000" step="0.01" value={amount} onChange={event => setAmount(event.target.value)} className={field} /></div>
            <div className="flex gap-2"><button className={`${button} !border-emerald-700 !bg-emerald-700 !text-white`} type="submit">Submit request</button><button type="button" className={button} onClick={() => setAdding(false)}>Cancel</button></div>
          </form>}
          <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Expense table; scroll horizontally on small screens">
            <table className="w-full min-w-[610px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="p-4" scope="col">Request</th><th className="p-4" scope="col">Amount</th><th className="p-4" scope="col">Status</th><th className="p-4" scope="col">Action</th></tr></thead>
              <tbody>{visible.map(expense => {
                const manager = manages(actor, expense.submittedBy)
                const reason = approvalReason(actor, expense)
                return <tr key={expense.id} data-expense={expense.id} className="border-t border-slate-100 align-top"><td className="p-4"><p className="font-medium">{expense.description}</p><p className="mt-1 text-xs text-slate-500">{PEOPLE[expense.submittedBy].name}</p><p className="mt-1 font-mono text-xs text-slate-400">{expense.id}</p></td><td className="whitespace-nowrap p-4 font-medium">{money(expense.amount)}</td><td className="p-4"><span className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${expense.status === 'Approved' ? 'bg-emerald-50 text-emerald-800' : expense.status === 'Denied' ? 'bg-rose-50 text-rose-800' : 'bg-amber-50 text-amber-800'}`}>{expense.status}</span></td><td className="max-w-[230px] p-4">
                  {manager && expense.status === 'Pending' && <><div className="flex gap-2"><button className={`${button} !border-emerald-700 !bg-emerald-700 !text-white`} disabled={Boolean(reason)} title={reason || 'Approve this request'} onClick={() => act(expense.id, 'approve')}><Check aria-hidden="true" size={14} />Approve</button><button className={button} onClick={() => act(expense.id, 'deny')}><X aria-hidden="true" size={14} />Deny</button></div>{reason && <p className="mt-2 text-xs leading-relaxed text-amber-800">{reason}</p>}</>}
                  {expense.status !== 'Pending' && (manager || expense.submittedBy === actor && expense.status === 'Denied') && <button className={button} onClick={() => act(expense.id, 'reset')}>{manager ? 'Reset to pending' : 'Resubmit'}</button>}
                  {expense.submittedBy === actor && <p className="mb-2 text-xs text-slate-500">Your request · needs another approver</p>}
                  {expense.submittedBy === actor && expense.status !== 'Approved' && <button className={`${button} text-xs`} onClick={() => act(expense.id, 'delete')}>Remove</button>}
                  {!manager && expense.submittedBy !== actor && <span className="text-xs text-slate-500">Audit access · view only</span>}
                </td></tr>
              })}</tbody>
            </table>
            {!visible.length && <p className="p-6 text-sm text-slate-500">No requests for this role. Add one or reset the demo.</p>}
          </div>
        </section>
        <aside className={`${panel} min-w-0 p-5`} aria-labelledby="assistant-title">
          <div className="space-y-2"><h2 id="assistant-title" className="text-lg font-semibold">Demo assistant</h2><p className="text-sm leading-relaxed text-slate-500">Scripted responses using the selected role’s permissions. Try an approval command to see the same rules apply.</p></div>
          <div className="my-4 flex flex-wrap gap-2">{['What can I approve?', 'Show my expenses', 'Approve exp_101'].map(text => <button key={text} className={`${button} text-xs`} onClick={() => ask(text)}>{text}</button>)}</div>
          <div role="log" aria-label="Demo conversation" aria-live="polite" className="max-h-80 space-y-3 overflow-y-auto rounded-lg bg-slate-50 p-3">
            {!messages.length && <p className="text-sm leading-relaxed text-slate-500">You’re trying the demo as {person.name}. Ask about the visible requests, or enter an exact command such as “Approve exp_101”.</p>}
            {messages.map((message, index) => <div key={index} className={`rounded-lg p-3 text-sm ${message.role === 'You' ? 'bg-slate-200' : 'border border-slate-200 bg-white'}`}><p className="mb-1 text-xs font-semibold text-slate-500">{message.role}</p><p className="whitespace-pre-wrap break-words leading-relaxed">{message.text}</p></div>)}
          </div>
          <form onSubmit={event => { event.preventDefault(); ask(query) }} className="mt-4 flex gap-2"><label className="sr-only" htmlFor="query">Message the demo assistant</label><input id="query" className={`${field} min-w-0`} value={query} onChange={event => setQuery(event.target.value)} maxLength={300} placeholder="Ask about an expense…" /><button className={button} disabled={!query.trim()} aria-label="Send message"><Send aria-hidden="true" size={17} /></button></form>
        </aside>
      </div>
      <footer className="space-y-2 border-t border-slate-200 pt-6 text-sm leading-relaxed text-slate-500"><p>This browser simulation illustrates the SmartSpend permission model. The full implementation uses server-side OpenFGA checks and verified identity. No live OpenFGA service or language model is used here.</p><a className="inline-flex min-h-10 items-center gap-1 text-emerald-800 underline underline-offset-4" href="https://dev.to/thedreamsaver/smartspend-agentic-expense-management-with-auth0-fga-4ejf">Read the original project write-up <ArrowUpRight aria-hidden="true" size={14} /></a></footer>
    </main>
  </div>
}
