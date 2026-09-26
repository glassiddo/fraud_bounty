import { useEffect, useState } from 'react'
import { Hunter, LoadState } from './Hunter'
import { TransactionPreview } from './TransactionPreview'
import { type Investigation, type Evaluation, useResource } from './bountyClient'
import './bounty.css'

const chapters = ['challenge', 'invitation', 'investigation', 'responses', 'methodology'] as const
type Chapter = typeof chapters[number] | 'hunter'
const titles = ['Why now?', 'What hunters find', 'The platform', 'Company value', 'Potential & limits']
function chapterFromHash(): Chapter {
 const hash = location.hash.slice(1)
 if (hash === 'hunter') return hash
 if (hash === 'finding') return 'responses'
 return chapters.includes(hash as typeof chapters[number]) ? hash as Chapter : 'challenge'
}

export function BountyApp() {
 const [chapter, setChapter] = useState<Chapter>(chapterFromHash)
 const [informed, setInformed] = useState(() => localStorage.getItem('northstar-informed') === 'yes')
 const index = chapter === 'hunter' ? 1 : chapters.indexOf(chapter)
 useEffect(() => {
  const sync = () => { if (location.hash !== '#case-content') setChapter(chapterFromHash()) }
  addEventListener('hashchange', sync)
  return () => removeEventListener('hashchange', sync)
 }, [])
 function go(next: Chapter) { setChapter(next); location.hash = next; window.scrollTo?.({ top: 0, behavior: 'instant' }) }
 function reveal() { setInformed(true); localStorage.setItem('northstar-informed', 'yes') }
 return <div className="bounty concise-case platform-case">
  <a className="skip-link" href="#case-content">Skip to case content</a>
  <div className="b-layout">
   <aside className="b-sidebar"><p className="b-kicker">THE QUESTION</p>
    <nav aria-label="Case chapters">{chapters.map((c, i) => <button key={c} aria-label={`${String(i + 1).padStart(2, '0')} ${titles[i]}`} aria-current={chapter === c ? 'step' : undefined} className={chapter === c ? 'active' : ''} onClick={() => go(c)}><span>{String(i + 1).padStart(2, '0')}</span>{titles[i]}<span className="nav-arrow">↗</span></button>)}</nav>
   </aside>
   <main id="case-content" className="b-content">
    <div className="perspective"><span>{chapter === 'hunter' ? 'HUNTER · CUSTOMER VIEW' : 'EXPLORING THE PROPOSAL'}</span><span>{index + 1} / 5</span></div>
    <section key={chapter} className="b-page">
     {chapter === 'challenge' && <Idea next={() => go('invitation')} />}
     {chapter === 'invitation' && <Invitation play={() => go('hunter')} />}
     {chapter === 'hunter' && <><button className="b-text" onClick={() => go('invitation')}>← Back to the proposal</button><p className="b-caption">This small synthetic exercise illustrates one sequence. It does not implement the broader, open-ended search platform proposed here.</p><Hunter informed={informed} /></>}
     {chapter === 'investigation' && <Platform />}
     {chapter === 'responses' && <CompanyValue informed={informed} reveal={reveal} />}
     {chapter === 'methodology' && <Takeaway />}
    </section>
    <footer className="b-footer"><button disabled={index === 0} onClick={() => go(chapters[index - 1])}>← Previous</button><span>{index + 1} / 5</span><button disabled={index === 4} onClick={() => go(chapters[index + 1])}>{index === 4 ? 'End of story' : `Next: ${titles[index + 1]} →`}</button></footer>
   </main>
  </div>
 </div>
}

function Idea({ next }: { next: () => void }) {
 return <><div className="hero"><h1>Could bounty hunting work for <em>fraud prevention?</em></h1><p className="b-lead">If AI makes root-cause analysis easier, could discovering unknown fraud paths become a more important bottleneck?</p></div>
  <div className="hypothesis"><p className="b-kicker">MY WORKING HYPOTHESIS</p><p>My sense is that fraud teams probably already had plenty of leads. The issue was more understanding what happened and what to do about it.</p><p>If AI makes that easier, some of the bottleneck could move to finding gaps the team has not seen yet.</p></div>
  <p className="story-bottom">This is where I think bounty hunters could be useful. Give them transactions and limited feedback, let them try different approaches, and reward gaps the company can reproduce.</p>
  <button className="b-primary" onClick={next}>Explore the idea →</button>
  <p className="b-caption">AI could make this more useful. Independent testing could still be worth trying without that shift.</p>
 </>
}

function Invitation({ play }: { play: () => void }) {
 return <><div className="b-heading"><p className="b-kicker">WHAT THE HUNTER DOES</p><h1>Try transactions. See what comes back.</h1><p className="b-lead">The idea is that hunters work with transactions and receive some details akin to what a fraudster would see. They use that feedback to decide what to try next.</p></div>
  <div className="sequence-strip" aria-label="Transaction feedback loop"><span>Attempt a transaction</span><b>→</b><span>See the response</span><b>→</b><span>Adjust the next attempt</span></div>
  <p className="story-bottom">A transaction might be accepted, declined, or require verification. Other outcomes arrive later. The hunter knows what they submitted and what happened from their side, but cannot see the rule or risk score behind it.</p>
  <div className="b-split"><article className="b-card"><h2>What they are looking for</h2><p>A sequence that lets them commit simulated fraud and come out ahead. Earlier activity and timing affect later transactions, so the gap may only appear across several attempts.</p></article><article className="b-card"><h2>What earns the bounty</h2><p>A gap the company can reproduce and validate. The simulated money gives the search an objective. The bounty is a separate reward for finding the weakness.</p></article></div>
  <details><summary>What would they be allowed to try?</summary><p>The company sets the permitted accounts, actions, time, and budget. Hunters could work manually or use scripts and agents. The environment would need to preserve the effects of earlier attempts while keeping real customer data and systems out of scope.</p><p>The optional exercise is much smaller: one synthetic account and order. It shows restricted feedback and delayed outcomes, but does not implement the broader search or calculate attacker profit.</p></details>
  <button className="b-text optional-link" onClick={play}>Try the optional challenge</button>
 </>
}

function Platform() {
 return <><div className="b-heading"><p className="b-kicker">WHY A PLATFORM WOULD MATTER</p><h1>What should the hunter be able to see?</h1><p className="b-lead">The company needs a way to share enough transaction information for this to work, without exposing details a fraudster would not normally have.</p></div>
  <TransactionPreview />
  <p className="story-bottom">I think this is a large part of the platform question. It needs to make that boundary easy to configure while preserving account history, shared entities, and the effects of earlier transactions. Otherwise hunters could find gaps in the simulation rather than in the controls.</p>
  <details><summary>What this would require in practice</summary><p>The company would choose the permitted actions and feedback. The platform would keep budgets and state across attempts, use coherent synthetic histories, and retain full logs for private validation and replay. A reset should not erase an attempt's consequences for free.</p><p>A production version would also need isolation and access controls. This local demo has separate hunter and company views, but someone inspecting the source or calling the API directly can bypass that separation.</p></details>
 </>
}

function CompanyValue({ informed, reveal }: { informed: boolean; reveal: () => void }) {
 const [inspect, setInspect] = useState(false)
 return <><div className="b-heading"><p className="b-kicker">VALUE FOR THE FRAUD-PREVENTION COMPANY</p><h1>Find gaps the company has not tested.</h1><p className="b-lead">The value would be finding sequences the internal team missed, with enough detail to reproduce them and understand where the controls failed.</p></div>
  <div className="b-split"><article className="b-card"><h2>Different people try different things</h2><p>The company could run its own agents. The case for inviting hunters is that their methods and reward incentives might lead them to different gaps. Whether that adds useful coverage is still an open question.</p></article><article className="b-card"><h2>The company can keep the test</h2><p>A validated sequence can be replayed after controls change. It also gives the team a starting point for investigating related gaps.</p></article></div>
  <p className="story-bottom">The company would still need to check the finding and assess the cost of a response to legitimate customers. AI could help with that investigation, but this proposal does not depend on building a complete root-cause system into the bounty platform.</p>
  <button className="b-text optional-link" onClick={() => setInspect(value => !value)} aria-expanded={inspect}>{inspect ? 'Close the illustration' : 'Inspect one simulated finding'}</button>
  {inspect && (informed ? <Evidence /> : <div className="b-card"><h2>Cross the information boundary</h2><p>This opens private evidence from the synthetic example. Subsequent play is informed exploration, not blind discovery.</p><button className="b-primary" onClick={reveal}>Reveal merchant evidence</button></div>)}
 </>
}

function Evidence() {
 const { data, error, reload } = useResource<Investigation>('/merchant/investigation')
 const evaluation = useResource<Evaluation>('/evaluator?completion=80&attacker_completion=0')
 if (!data) return <LoadState error={error} reload={reload} />
 return <div className="evidence-inset"><p className="b-kicker">SCRIPTED EXAMPLE · PRIVATE MERCHANT EVIDENCE</p><p>A trusted account changes its destination and orders goods. One path reaches dispatch before an owner report confirms unauthorized use. Another is cancelled by a later destination check. Only the first qualifies.</p><p>The reusable finding: device trust survives a context change. The early approval alone would not have established it.</p>
  <p className="b-kicker">EVALUATOR-ONLY · CONSTRUCTED CUSTOMER POPULATION</p>
  {evaluation.data ? <div className="b-table"><table><thead><tr><th>Replay</th><th>Recorded path</th><th>Friction / 100 legitimate customers</th></tr></thead><tbody>{evaluation.data.policies.map((policy, i) => <tr key={policy.policy}><th>{['Current policy', 'Block new destinations', 'Targeted verification'][i]}</th><td>{policy.replay.status}</td><td>{policy.legit_declines} declines · {policy.legit_challenges} challenges</td></tr>)}</tbody></table></div> : <LoadState error={evaluation.error} reload={evaluation.reload} />}
  <p className="b-caption">Targeted verification interrupts this path with less widespread friction, but waiting out its short window still bypasses it. This is a regression result, not adaptive resistance or an estimate of production savings. Challenge prevention assumes the hunter cannot verify.</p><code>{data.analysis.formula}</code>
 </div>
}

function Takeaway() {
 return <><div className="b-heading"><p className="b-kicker">POTENTIAL & LIMITS</p><h1>Would the extra findings be worth it?</h1><p className="b-lead">I think there is a case for trying this. Whether it works depends on what hunters find beyond existing testing, and how much work it takes to turn those findings into useful changes.</p></div>
  <div className="story-flow"><div><span>INCREMENTAL VALUE</span><h2>New to the company?</h2><p>Compare validated findings with internal testing under matched scope and resources. Count duplicates and already-known weaknesses separately.</p></div><div><span>SIMULATION FIDELITY</span><h2>Real gap or artifact?</h2><p>Check whether the discovered path survives private reproduction in a representative environment.</p></div><div><span>ECONOMICS</span><h2>Worth the effort?</h2><p>Measure rewards, triage and remediation costs alongside useful coverage and customer consequences.</p></div></div>
  <p className="story-bottom">The first question for a pilot is whether hunters bring useful findings beyond the company's existing tests. AI could make those findings cheaper to investigate, but the value of independent search needs to stand on its own.</p>
  <details><summary>Methodology & related work</summary><p>All implemented accounts, orders, rewards and outcomes are synthetic. The example is scripted, not agent-discovered. It preserves a small stateful sequence; it does not demonstrate open-ended economic attacks or a production platform.</p><p>Play and replay share executable controls. Reputation, fulfillment and owner reports are simulated; later evidence is not used in earlier decisions. Selected cases do not establish fraud prevalence, profit or real-world savings.</p><p>Automated fraud red-teaming already exists, including <a href="https://www.darwinium.com/beagle" target="_blank" rel="noreferrer">Darwinium Beagle</a>. This proposal explores independent participation, controlled access and rewards for validated findings, without claiming unique automated capabilities.</p><p>Reproduce the example with <code>py -3.12 -m app.bounty_analysis</code> from the backend folder. Detailed controls, costs and tests remain in the repository.</p></details>
 </>
}
