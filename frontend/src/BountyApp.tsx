import { useEffect, useRef, useState, type MouseEvent } from 'react'
import { Hunter } from './Hunter'
import { TransactionPreview } from './TransactionPreview'
import './bounty.css'

const chapters = ['challenge', 'invitation', 'investigation', 'methodology'] as const
type Chapter = typeof chapters[number] | 'hunter'
const titles = ['The idea', 'The bounty environment', 'A possible setup', 'Privacy & realism']
function chapterFromHash(): Chapter {
 const hash = location.hash.slice(1)
 if (hash === 'hunter') return hash
 if (hash === 'finding' || hash === 'responses') return 'challenge'
 return chapters.includes(hash as typeof chapters[number]) ? hash as Chapter : 'challenge'
}

export function BountyApp() {
 const [chapter, setChapter] = useState<Chapter>(chapterFromHash)
 const [informed] = useState(() => localStorage.getItem('northstar-informed') === 'yes')
 const pageRef = useRef<HTMLElement>(null)
 const previousChapter = useRef(chapter)
 const index = chapter === 'hunter' ? chapters.indexOf('invitation') : chapters.indexOf(chapter)
 useEffect(() => {
  const sync = () => { if (location.hash !== '#case-content') setChapter(chapterFromHash()) }
  addEventListener('hashchange', sync)
  return () => removeEventListener('hashchange', sync)
 }, [])
 useEffect(() => {
  if (previousChapter.current === chapter) return
  previousChapter.current = chapter
  const heading = pageRef.current?.querySelector('h1')
  if (heading) { heading.tabIndex = -1; heading.focus({ preventScroll: true }) }
  window.scrollTo?.({ top: 0, behavior: 'instant' })
 }, [chapter])
 function go(next: Chapter) { setChapter(next); location.hash = next }
 function navigate(event: MouseEvent<HTMLAnchorElement>, next: Chapter) {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
  event.preventDefault()
  go(next)
 }
 return <div className="bounty concise-case platform-case">
  <a className="skip-link" href="#case-content">Skip to case content</a>
  <div className="b-layout">
   <aside className="b-sidebar"><p className="b-kicker">THE QUESTION</p>
    <nav aria-label="Case chapters">{chapters.map((c, i) => <a href={`#${c}`} key={c} aria-label={`${String(i + 1).padStart(2, '0')} ${titles[i]}`} aria-current={chapter === c ? 'step' : undefined} className={chapter === c ? 'active' : ''} onClick={event => navigate(event, c)}><span>{String(i + 1).padStart(2, '0')}</span>{titles[i]}<span className="nav-arrow" aria-hidden="true">↗</span></a>)}</nav>
   </aside>
   <main id="case-content" className="b-content">
    <div className="perspective"><span>{chapter === 'hunter' ? 'HUNTER · CUSTOMER VIEW' : 'A THOUGHT EXPERIMENT'}</span><span>{index + 1} / {chapters.length}</span></div>
    <section key={chapter} ref={pageRef} className="b-page">
     {chapter === 'challenge' && <><Idea /><CompanyValue /></>}
     {chapter === 'invitation' && <Invitation />}
     {chapter === 'hunter' && <><button className="b-text" onClick={() => go('invitation')}>← Back to the proposal</button><Hunter informed={informed} /></>}
     {chapter === 'investigation' && <Platform />}
     {chapter === 'methodology' && <Takeaway />}
    </section>
    <footer className="b-footer">{index > 0 ? <a href={`#${chapters[index - 1]}`} onClick={event => navigate(event, chapters[index - 1])}>← Previous</a> : <span />}<span>{index + 1} / {chapters.length}</span>{index < chapters.length - 1 && <a href={`#${chapters[index + 1]}`} onClick={event => navigate(event, chapters[index + 1])}>Next: {titles[index + 1]} →</a>}</footer>
   </main>
  </div>
 </div>
}

function Idea() {
 return <><div className="hero"><h1>Could bounty hunting work for <em>fraud prevention?</em></h1><p className="b-lead">The idea borrows from cybersecurity bug bounties: pay independent people to find weaknesses. A merchant or fraud provider would give approved hunters test data resembling information a fraudster could obtain. Hunters would use it in a controlled shop connected to the company’s fraud decision system, trying to maximize simulated profit.</p></div>
  <section className="essay-section"><h2>Why bounty hunting in fraud?</h2><p>People differ in their ability to spot and exploit fraud gaps. Some may be very good at it, but unwilling to commit fraud because of moral objections, criminality, or personal risk. A paid, authorized environment could draw those people into finding weaknesses, which could help a company recognize unknown vulnerabilities to fraud.</p><p>Fraud prevention teams can build internal test tools and scenarios and replay past transactions. Commercial tools include <a href="https://www.sardine.ai/rules-engine" target="_blank" rel="noreferrer">Sardine’s historical backtesting and shadow testing</a> and <a href="https://www.darwinium.com/beagle" target="_blank" rel="noreferrer">Darwinium Beagle’s AI agents for fraud simulation</a>.</p><p>However, internal testing may be constrained by team time, competing priorities, scenarios based on known attacks, or assumptions shared by the people who built the system. Outsiders could bring different experience and try approaches the team has not considered. As with bug bounties, the proposed benefit is finding gaps alongside the company’s existing testing.</p></section>
  <section className="essay-section"><h2>Are bounties still relevant with AI?</h2><p>In cybersecurity, AI can already find complex vulnerabilities (see <a href="https://www.hackerone.com/blog/project-glasswing-frontier-model-h1" target="_blank" rel="noreferrer">HackerOne's blog</a>), potentially reducing the value of outside hunters. AI also makes bounty reporting faster, creating more material to check, with <a href="https://github.blog/security/next-chapter-restructuring-githubs-bug-bounty-program/" target="_blank" rel="noreferrer">GitHub changing its bounty program in response to low-quality submissions</a>.</p><p>Bounties could still be useful if they bring in people whose experience and ideas lead to discoveries beyond the company’s own AI-assisted testing. AI makes investigation tools more widely available; it does not establish that everyone will pursue the same leads. The case for a bounty therefore rests on the additional findings that independent participation produces. Whether those findings justify the cost in fraud prevention remains to be tested.</p></section>

 </>
}

function Invitation() {
 return <><div className="b-heading"><p className="b-kicker">THE ENVIRONMENT</p><h1>What could hunters see?</h1><p className="b-lead">Hunters would receive test resources and access to a simplified shopping website with a catalog, cart, and checkout. They would use them to try to earn simulated proceeds from fraud.</p></div>
  <section className="essay-section"><h2>What could the company provide?</h2><p>The data provided to registered hunters should resemble the kind of information a fraudster might acquire, while protecting real customers. This could include test account details, shipping addresses, cards, and past orders. The hunter could see this package first, then choose recipients, destinations, products, and sequences of purchases.</p><p>The test accounts need a history for the decision system to evaluate: for example, whether a delivery address has been used before. That history can stay inside the company’s test environment, with only the usual account information visible to hunters. </p><p> How to provide representative data safely is a central open question.</p></section>
  <section className="essay-section"><h2>Who runs what?</h2><p>The company supplies the data and decision system, validates findings, and decides how to respond. A fraud provider may need merchant cooperation or a representative simulation for parts of the shopping journey it does not control.</p><p>The platform gives hunters access to the test shop and records their attempts and simulated outcomes.</p></section>
  <section className="hypothesis"><p className="b-kicker">SIMULATED OUTCOMES · OPEN QUESTION</p><h2>When has the hunter actually obtained value?</h2><p>Obtaining a usable gift card could be enough; physical goods also need to reach a place where the hunter could collect them. How should simulated delivery reflect that? One option is to designate destinations the hunter is assumed to control, but this assumption could make a path appear successful even when it would fail in practice.</p></section>
  <section className="essay-section"><h2>The hunter’s experience</h2><p>Registered, approved hunters receive separate test customer accounts. They can combine products and supplied cards, choose recipients and destinations, and follow up with further purchases or account changes.</p><p>The company could collect its usual cookies and background signals, while keeping internal assessments private. Attempts could be declined or referred to a bank, whose eventual response the environment cannot reproduce on its own. Such referrals may reveal useful decision behavior, but do not establish successful fraud; any associated costs or friction would need to be assessed with the company.</p></section>
  <section className="hypothesis"><p className="b-kicker">REWARD · OPEN QUESTION</p><h2>Link the reward to simulated earnings?</h2><p>One possibility is to reward the value a hunter manages to obtain after later outcomes are accounted for. </p><p>Another option is to reward useful, reproducible gaps. The company and hunter could disagree about a finding’s value, and the company may have an incentive to understate it. How could the platform verify that value and resolve disputes?</p></section>
 </>
}

function Platform() {
 return <><div className="b-heading"><p className="b-kicker">A POSSIBLE SETUP</p><h1>A simplified shop connected to a fraud decision system</h1><p className="b-lead">The company supplies the starting data and private histories. The platform passes shopping activity and collected background signals to the decision system, and records how it responds.</p></div>
  <TransactionPreview />

  <section className="hypothesis"><p className="b-kicker">INTEGRATION · OPEN QUESTION</p><h2>How would test data enter the company’s systems?</h2><p>The attempts need to affect the test’s decisions without filling live customer records or training data with fictional activity. A starting point could be the company’s existing testing infrastructure, using its way of passing test transactions through the decision system and keeping their history separate.</p><p>Whether that infrastructure can support persistent, linked activity from outside hunters remains to be established. The integration would need to preserve relevant behavior across databases, caches, and connected services while keeping test writes out of production.</p></section>
 </>
}

function CompanyValue() {
 return <section className="essay-section"><h2>What would the company learn?</h2><p>The main output would be an exposed fraud gap: a reproducible sequence showing how the hunter obtained simulated value, together with the choices that are associated with it. The sequence would give the company a concrete weakness to investigate, even if its root cause remains unclear. </p><p> Fixing the root cause of the weakness might lead to rejections of legitimate customers; deciding how to handle that tradeoff belongs to the company or fraud provider’s policy, and falls outside the task of demonstrating the gap.</p>
  <section className="hypothesis"><p className="b-kicker">WORKING HYPOTHESIS</p><h2>If AI makes gaps easier to explain, finding them becomes more valuable.</h2><p>Even with machine learning to flag risk, analysts still need to trace why fraud got through or legitimate customers were rejected. When investigation and fixes absorb most of a team’s capacity, there may be little time to search for unfamiliar weaknesses.</p><p>Better AI models, and agents that can query data and follow an investigation, could automate or speed up root-cause analysis and implementation of fixes. Vendors are beginning to offer tools for this work (<a href="https://www.sardine.ai/agentic-ai-for-fraud" target="_blank" rel="noreferrer">Sardine</a>; <a href="https://sift.com/platform/new-releases/" target="_blank" rel="noreferrer">Sift</a>).</p><p>If investigation becomes less of a constraint, finding previously unknown gaps could become more valuable. Analysts would still need to verify explanations and assess fixes; whether AI frees enough capacity to change those priorities remains to be tested.</p></section>
 </section>
}

function Takeaway() {
 return <><div className="b-heading"><p className="b-kicker">PRIVACY & REALISM</p><h1>Can the environment be safe and representative?</h1><p className="b-lead">The central difficulty is giving hunters a meaningful test without exposing customers, confidential data, or a route into live systems. A convincing shopping screen is only a small part of that problem.</p></div>
  <section className="essay-section"><h2>What could the environment leak?</h2><p>The boundary must cover APIs, logs, errors, and connected services as well as the visible website. Each company’s environment needs isolation from other companies and from production. Test transactions must not trigger real payments, deliveries, or changes to customer records.</p><p>Repeated queries create another exposure: order responses, timing, or differences between accounts might reveal private histories or let a hunter infer sensitive facts. Hiding database fields alone would not address that. The platform would need to test what can be inferred across attempts and limit access and query volume accordingly.</p><p>Some learning about how the checks behave is the point of the exercise. The unresolved boundary is which feedback supports useful testing and which could expose customer information or transferable details about live defenses. A pilot would need explicit disclosure limits and a separate review of the environment’s own isolation and leakage risks.</p></section>
  <section className="essay-section"><p className="b-kicker">CENTRAL OPEN QUESTION</p><h2>Can data be de-identified without changing the test?</h2><p>This remains a central open question. Changing names or addresses can alter matches, distances, and links to earlier activity, potentially removing the very gap being tested. Consistent substitutions preserve some relationships, but do not guarantee either privacy or representative decisions.</p><p>The company could use synthetic data or transform linked records together, then check both whether the same fraud paths remain possible and whether private information can be recovered. Similar overall approval rates would not be enough. Signals that cannot be represented safely and faithfully would need private validation or an explicit limit on the test. <a href="https://csrc.nist.gov/pubs/sp/800/188/final" target="_blank" rel="noreferrer">NIST’s guidance</a> discusses the tradeoffs between privacy and data usefulness.</p></section>
  <p className="story-bottom">A pilot would test whether hunters uncover additional gaps, whether those gaps survive realistic reproduction, and whether the findings justify the effort.</p>

 </>
}
