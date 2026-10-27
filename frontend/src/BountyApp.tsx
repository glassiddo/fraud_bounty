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
     {chapter === 'challenge' && <><Idea /><OrganizationValue /><AIRelevance /></>}
     {chapter === 'invitation' && <Invitation />}
     {chapter === 'hunter' && <><button className="b-text" onClick={() => go('invitation')}>← Back to the proposal</button><Hunter informed={informed} /></>}
     {chapter === 'investigation' && <Platform />}
     {chapter === 'methodology' && <Takeaway />}
    </section>
    <footer className="b-footer">{index > 0 ? <a href={`#${chapters[index - 1]}`} onClick={event => navigate(event, chapters[index - 1])}>← Previous</a> : <span />}<span>{index + 1} / {chapters.length}</span>{index < chapters.length - 1 && <a href={`#${chapters[index + 1]}`} onClick={event => navigate(event, chapters[index + 1])}>Next: {titles[index + 1]} →</a>}</footer>
    <p className="creator-credit">Created by Iddo Glass</p>
   </main>
  </div>
 </div>
}

function Idea() {
 return <><div className="hero"><h1>Could bounty hunting work for <em>fraud prevention?</em></h1><p className="b-lead">The idea borrows from cybersecurity bug bounties: pay independent people to find weaknesses. The participating organization—the merchant or fraud-prevention provider whose decision system is being tested—would give approved hunters test data resembling information a fraudster could obtain. Hunters would use it in a controlled “shop” connected to the organization’s fraud decision system, trying to maximize simulated profit.</p></div>
  <section className="essay-section"><h2>Why bounty hunting in fraud?</h2><p>People differ in their ability to spot and exploit fraud gaps. Some may be very good at it but unwilling to commit fraud because of moral objections, criminal liability, or personal risk. An authorized environment could allow these people to expose vulnerabilities to fraud.</p><p>Fraud prevention teams can use internal or commercial tools to test new transactions and replay past ones. Yet outsiders could bring different experience and try approaches the team has not considered. As with bug bounties, the proposed benefit is finding gaps alongside the organization’s existing testing.</p></section>
 </>
}

function AIRelevance() {
 return <section className="essay-section"><h2>Are bounties still relevant with AI?</h2><p>In cybersecurity, <a href="https://www.hackerone.com/blog/project-glasswing-frontier-model-h1" target="_blank" rel="noreferrer">AI can already find complex vulnerabilities</a>. AI also makes bounty reporting faster, creating more submissions to check, <a href="https://github.blog/security/next-chapter-restructuring-githubs-bug-bounty-program/" target="_blank" rel="noreferrer">some of which may be lower quality</a>. In fraud prevention, commercial tools such as <a href="https://www.darwinium.com/beagle" target="_blank" rel="noreferrer">Darwinium Beagle</a> use AI agents to simulate attacks.</p><p>Bounties may still be useful if they bring in people whose experience and ideas produce findings beyond the organization’s internal testing and AI-powered simulations. Whether those additional findings justify the setup and review costs remains to be tested.</p></section>
}

function Invitation() {
 return <><div className="b-heading"><p className="b-kicker">THE ENVIRONMENT</p><h1>What could hunters see?</h1><p className="b-lead">A fraud bounty hunting platform could provide approved hunters with test resources and access to simplified shopping environments that resemble real ones. The hunters would then try to earn simulated proceeds from fraud.</p></div>
  <section className="essay-section"><h2>What could the organization provide?</h2><p>The data provided to registered hunters should resemble the kind of information a fraudster might acquire, while protecting real customers. This could include de-identified account details, shipping addresses, cards, and past orders.</p><p>How to provide representative data safely is a central open question.</p></section>
  <section className="essay-section"><h2>Who runs what?</h2><p>The organization supplies the test data and decision system, validates findings, and decides how to respond. The platform gives approved hunters access to the test shop and records their attempts and simulated outcomes.</p><p>Some parts of a real transaction sit outside either party’s control. A fraud provider may need merchant cooperation, and a bank may decline, refer, or require customer verification. The environment cannot fully reproduce those decisions, which may limit what a successful test attempt establishes.</p></section>
  <section className="hypothesis"><p className="b-kicker">SIMULATED OUTCOMES · OPEN QUESTION</p><h2>When has the hunter obtained value?</h2><p>Replicating the real-world constraints of committing fraud is required for this idea. This depends on the type of fraud and the items involved: obtaining a usable gift card could be enough, while physical goods also need to reach a place where fraudsters could collect them.</p><p>How simulated delivery should reflect that remains an open question. One possible approach is to designate addresses the hunter is assumed to control.</p></section>
  <section className="essay-section"><h2>The hunter’s experience</h2><p>Approved hunters receive test data. They can combine products and supplied cards, choose recipients and destinations, and follow up with further purchases or account changes.</p><p>Whether they would know immediately that a fraud attempt has succeeded or learn the outcome after a delay, similar to delivery time, is a design choice.</p><p>The organization could collect its usual cookies and background signals, some of which may be observable to the hunter.</p></section>
  <section className="hypothesis"><p className="b-kicker">REWARD · OPEN QUESTION</p><h2>Link the reward to simulated earnings?</h2><p>How bounty hunters would get paid is an open question.</p><p>One possibility is to pay hunters a share of the simulated value they manage to obtain. Rewarding “useful” gaps is another, but leaves room for disagreement over the value of exposed gaps and gives the organization an incentive to understate it.</p></section>
 </>
}

function Platform() {
 return <><div className="b-heading"><p className="b-kicker">A POSSIBLE SETUP</p><h1>A simplified shop connected to a fraud decision system</h1><p className="b-lead">The organization supplies the starting data and private histories. The platform passes shopping activity and collected background signals to the decision system, and records how it responds.</p></div>
  <TransactionPreview />

  <section className="hypothesis"><p className="b-kicker">INTEGRATION · OPEN QUESTION</p><h2>How would test data enter the organization’s systems?</h2><p>The attempts need to affect the test’s decisions without filling live customer records or training data with fictional activity. This could follow the organization’s existing testing infrastructure, using its way of passing test transactions through the decision system while keeping the history separate.</p><p>Whether that infrastructure can support persistent, linked activity from outside hunters remains to be established. The integration would need to preserve relevant behavior across databases, caches, and connected services while keeping test writes out of production.</p></section>
 </>
}

function OrganizationValue() {
 return <section className="essay-section"><h2>What would the organization learn?</h2><p>The main output would be an exposed fraud gap: a reproducible sequence showing how the hunter obtained simulated value, together with the choices associated with it. The sequence would give the organization a concrete weakness to investigate, even if its root cause remains unclear.</p><p>Deciding how to balance closing fraud gaps against rejecting legitimate customers is a policy decision for the organization.</p>
  <section className="hypothesis working-hypothesis"><p className="b-kicker">WORKING HYPOTHESIS</p><h2>If AI makes gaps easier to explain, finding them may become more valuable</h2><p>Fraud teams spend a lot of time on root-cause analysis and implementing solutions. Better AI models and agents could automate or speed up those activities, increasing the relative value of finding previously unknown gaps.</p><p>Analysts would still need to verify explanations and assess fixes; whether AI frees enough capacity to change those priorities remains to be tested.</p></section>
 </section>
}

function Takeaway() {
 return <><div className="b-heading"><p className="b-kicker">PRIVACY & REALISM</p><h1>Can the environment be safe and representative?</h1><p className="b-lead">The central difficulty is giving hunters a meaningful test without exposing customers, confidential data, or a route into live systems.</p></div>
  <section className="essay-section"><h2>What could the environment leak?</h2><p>The boundary must cover APIs, logs, errors, and connected services as well as the visible website. Each organization’s environment needs isolation from other organizations and from production, and test transactions must never trigger real payments, deliveries, or customer-record changes.</p><p>Repeated attempts create a subtler risk: differences in responses or timing could reveal private histories or details about live defenses. Some feedback is necessary for useful testing, so the platform would need to test what hunters can infer and set explicit limits on access, query volume, and disclosure.</p></section>
  <section className="essay-section"><p className="b-kicker">CENTRAL OPEN QUESTION</p><h2>Can data be de-identified without changing the test?</h2><p>This remains a central open question. Changing names or addresses can alter matches, distances, and links to earlier activity, potentially removing the very gap being tested. Consistent substitutions preserve some relationships, but do not guarantee either privacy or representative decisions.</p><p>The organization could use synthetic data or transform linked records together, then check both whether the same fraud paths remain possible and whether private information can be recovered. Signals that cannot be represented safely and faithfully would need private validation or an explicit limit on the test.</p></section>
 </>
}
