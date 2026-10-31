import { useEffect, useState } from 'react'
import { ArrowUpRight, Bot, Check, Plus, RotateCcw, Send, ShieldCheck, Users, X } from 'lucide-react'
import { PEOPLE, freshExpenses, money, visibleTo, manages, approvalReason, decide, addExpense, answer } from './model.mjs'

const STORAGE_KEY = 'smartspend-sample-v1'
const button = 'inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 disabled:cursor-not-allowed disabled:opacity-40'
const panel = 'rounded-2xl border border-slate-200 bg-white shadow-sm'
const field = 'min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base focus:outline-2 focus:outline-blue-700'
const avatars = { dina_dev: '👩‍💻', raj_manager: '👨‍💼', chen_vp: '👩‍💼', frank_finance: '📊' }

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

  return <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 text-slate-900">
    <header>
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
        <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/80 px-3 py-1.5 text-xs font-semibold text-blue-800"><ShieldCheck aria-hidden="true" size={15} />Demo mode · sample data</span>
        <a className="inline-flex min-h-10 items-center gap-1 text-sm text-slate-600 hover:text-blue-800" href="https://ashishjha.ai/work">Built by Ashish Jha <ArrowUpRight aria-hidden="true" size={16} /></a>
      </div>
    </header>
    <main className="mx-auto max-w-7xl space-y-6 px-4 pb-8 pt-3 sm:px-6 sm:pb-10">
      <div className="mx-auto max-w-3xl space-y-3 pb-2 text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">SmartSpend</h1>
          <p className="text-lg font-medium text-slate-700 sm:text-xl">Expense management with fine-grained authorization</p>
          <p className="text-sm leading-relaxed text-slate-600 sm:text-base">Switch roles, submit a request and see how the approval rules change.</p>
        </div>
      {!storageAvailable && <p role="status" className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">Browser storage is unavailable. You can still try the demo; refreshing will reset your changes.</p>}
      <section aria-label="Choose a role" className={`${panel} flex flex-wrap items-end justify-between gap-4 p-5 sm:p-6`}>
        <div className="w-full max-w-md"><label htmlFor="persona" className="mb-2 flex items-center gap-2 font-semibold"><Users aria-hidden="true" size={19} />Persona selector</label>
          <select id="persona" value={actor} onChange={event => changeRole(event.target.value)} className={field}>
            {Object.entries(PEOPLE).map(([id, value]: [string, any]) => <option key={id} value={id}>{value.name} · {value.role}</option>)}
          </select>
        </div>
        <button type="button" className={button} onClick={reset}><RotateCcw aria-hidden="true" size={16} />Reset demo</button>
      </section>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)]">
      <div className="min-w-0 space-y-6">
      <section aria-label="Current role" className={`${panel} space-y-4 p-5 sm:p-6`}>
        <div className="flex items-start gap-3"><span className="rounded-xl bg-blue-50 p-3 text-2xl" aria-hidden="true">{avatars[actor]}</span><div><h2 className="text-xl font-semibold">{person.name}</h2><p className="text-sm font-medium text-blue-700">{person.role} · {person.department}</p><p className="mt-2 text-sm leading-relaxed text-slate-600">{person.note}</p></div></div>
        <p className="rounded-lg bg-blue-50 px-3 py-2 text-xs leading-relaxed text-blue-900">Reporting chain: Dina → Raj → Chen. Finance can view every request for auditing.</p>
        <div className="grid grid-cols-3 gap-3 border-t border-slate-100 pt-4">
        {[[visible.length, 'Visible requests'], [approvable.length, 'Ready for your approval'], [person.limit ? money(person.limit) : 'View only', 'Approval limit']].map(([value, label]) => <div key={label} className={`${panel} p-3 sm:p-5`}><p className="text-lg font-semibold tabular-nums sm:text-2xl">{value}</p><p className="mt-1 text-xs leading-relaxed text-slate-500 sm:text-sm">{label}</p></div>)}
        </div>
      </section>
      <p role="status" className={notice ? 'rounded-lg border border-blue-200 bg-white px-4 py-3 text-sm font-medium text-blue-900' : 'sr-only'}>{notice}</p>
        <section aria-labelledby="expenses-title" className={`${panel} min-w-0 overflow-hidden`}>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-5"><div><h2 id="expenses-title" className="text-lg font-semibold">Expense reports</h2><p className="mt-1 text-sm text-slate-500">Showing what {person.name.split(' ')[0]} can see.</p><p className="mt-1 text-xs text-slate-500 sm:hidden">Swipe the table to see actions →</p></div><button type="button" aria-expanded={adding} className={`${button} !border-blue-600 !bg-gradient-to-r from-blue-600 to-emerald-600 !text-white`} onClick={() => setAdding(!adding)}><Plus aria-hidden="true" size={16} />Add expense</button></div>
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
        </div>
        <aside className={`${panel} min-w-0 p-5 lg:sticky lg:top-6`} aria-labelledby="assistant-title">
          <div className="space-y-3"><div className="flex items-center gap-3"><span className="rounded-xl bg-blue-100 p-2.5 text-blue-700"><Bot aria-hidden="true" size={24} /></span><div><h2 id="assistant-title" className="text-lg font-semibold">Expense assistant</h2><p className="text-xs text-slate-500">Acting as {person.name}</p></div></div><p className="text-sm leading-relaxed text-slate-500">Explore what this role can see and approve. This demo uses scripted responses.</p></div>
          <div className="my-4 flex flex-wrap gap-2">{['What can I approve?', 'Show my expenses', 'Approve exp_101'].map(text => <button key={text} className={`${button} text-xs`} onClick={() => ask(text)}>{text}</button>)}</div>
          <div role="log" aria-label="Demo conversation" aria-live="polite" className="max-h-80 space-y-3 overflow-y-auto rounded-lg bg-slate-50 p-3">
            {!messages.length && <p className="text-sm leading-relaxed text-slate-500">You’re trying the demo as {person.name}. Ask about the visible requests, or enter an exact command such as “Approve exp_101”.</p>}
            {messages.map((message, index) => <div key={index} className={`rounded-lg p-3 text-sm ${message.role === 'You' ? 'bg-slate-200' : 'border border-slate-200 bg-white'}`}><p className="mb-1 text-xs font-semibold text-slate-500">{message.role}</p><p className="whitespace-pre-wrap break-words leading-relaxed">{message.text}</p></div>)}
          </div>
          <form onSubmit={event => { event.preventDefault(); ask(query) }} className="mt-4 flex gap-2"><label className="sr-only" htmlFor="query">Message the demo assistant</label><input id="query" className={`${field} min-w-0`} value={query} onChange={event => setQuery(event.target.value)} maxLength={300} placeholder="Ask about an expense…" /><button className={button} disabled={!query.trim()} aria-label="Send message"><Send aria-hidden="true" size={17} /></button></form>
        </aside>
      </div>
      <footer className="space-y-2 border-t border-blue-200 pt-6 text-sm leading-relaxed text-slate-600"><p>This browser simulation uses sample data; changes stay in this tab. The full implementation uses server-side OpenFGA checks and verified identity. No live OpenFGA service or language model is used here.</p><div className="flex flex-wrap gap-x-6"><a className="inline-flex min-h-10 items-center gap-1 text-blue-800 underline underline-offset-4" href="https://dev.to/thedreamsaver/smartspend-agentic-expense-management-with-auth0-fga-4ejf">Read the project write-up <ArrowUpRight aria-hidden="true" size={14} /></a><a className="inline-flex min-h-10 items-center gap-1 text-blue-800 underline underline-offset-4" href="https://github.com/TheDreamSaver/fga-spend-guard">View the source <ArrowUpRight aria-hidden="true" size={14} /></a></div></footer>
    </main>
  </div>
}
