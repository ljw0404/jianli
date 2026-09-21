import React from 'react';
import {createRoot} from 'react-dom/client';
import data from '../data.json';
import './styles.css';
import './refinements.css';

const escPath = () => window.location.pathname.toLowerCase().startsWith('/en') ? 'en' : 'zh';
function Link({href, children, externalArrow=false}){return href?<a href={href} target="_blank" rel="noreferrer">{children}{externalArrow?' ↗':''}</a>:<>{children}</>}
function Section({title,label,children}){return <section><h2><span aria-hidden="true"/>{title}<small>{label}</small><i aria-hidden="true"/></h2>{children}</section>}
function App(){
 const [lang,setLang]=React.useState(escPath()); const d=data[lang];
 const switchLang=(e)=>{e.preventDefault();const next=lang==='zh'?'en':'zh';setLang(next);history.pushState({},'',`/${next}`);document.documentElement.lang=next==='zh'?'zh-CN':'en';document.title=data[next].pageTitle};
 React.useEffect(()=>{document.documentElement.lang=lang==='zh'?'zh-CN':'en';document.title=d.pageTitle;const fn=()=>setLang(escPath()); addEventListener('popstate',fn); return()=>removeEventListener('popstate',fn)},[lang,d.pageTitle]);
 return <main className="page"><nav className="no-print"><a href={lang==='zh'?'/en':'/zh'} onClick={switchLang}>{d.navLanguage}</a><button onClick={()=>window.print()}>{d.print}</button></nav>
  <header><div className="latin">{d.nameLatin}</div><h1>{d.name}</h1><p className="title">{d.title}</p><div className="contact">{d.contact.map(([label,value,href])=><div key={label}><b>{label}</b>{href?<Link href={href}>{value}</Link>:<span>{value}</span>}</div>)}</div></header>
  <Section title={d.sections.summary} label={d.sectionLabels.summary}><p className="summary">{d.summary}</p></Section>
  <Section title={d.sections.skills} label={d.sectionLabels.skills}><div className="skills">{d.skills.map(([k,v])=><div className="skill" key={k}><h3>{k}</h3><p>{v}</p></div>)}</div></Section>
  <Section title={d.sections.experience} label={d.sectionLabels.experience}><div className="timeline">{d.experience.map((e,i)=><article className="entry" key={i}><div className="meta"><strong>{e.company}</strong><time>{e.period}</time><em>{e.role}</em></div>{e.items?e.items.map((it,j)=><div className="subentry" key={j}><h3><Link href={it.link} externalArrow>{it.name}</Link><small>{it.tag}</small></h3><p>{it.desc}</p>{it.bullets&&<ul>{it.bullets.map(x=><li key={x}>{x}</li>)}</ul>}<div className="tech">{d.techLabel} · {it.tech}</div></div>):<><p>{e.desc}</p>{e.bullets&&<ul>{e.bullets.map(x=><li key={x}>{x}</li>)}</ul>}</>}</article>)}</div></Section>
  <Section title={d.sections.projects} label={d.sectionLabels.projects}><div className="cards">{d.projects.map((p,i)=>{const [name,role,desc]=Array.isArray(p)?p:[p.name,p.role,p.desc];return <article key={i}><h3>{name}</h3><small>{role}</small><p>{desc}</p>{p.bullets&&<ul>{p.bullets.map(x=><li key={x}>{x}</li>)}</ul>}{p.tech&&<div className="tech">{d.techLabel} · {p.tech}</div>}</article>})}</div></Section>
  {d.side?.length>0&&<Section title={d.sections.side} label={d.sectionLabels.side}><div className="cards">{d.side.map((p,i)=><article key={i}><h3><Link href={p.link} externalArrow>{p.name}</Link></h3><small>{p.tag}</small><p>{p.desc}</p>{p.bullets&&<ul>{p.bullets.map(x=><li key={x}>{x}</li>)}</ul>}<div className="tech">{d.techLabel} · {p.tech}</div></article>)}</div></Section>}
  {d.open?.length>0&&<Section title={d.sections.open} label={d.sectionLabels.open}><div className="open-grid">{d.open.map(([name,desc,href])=><a href={href} target="_blank" rel="noreferrer" key={name}><strong>{name} ↗</strong><span>{desc}</span></a>)}</div></Section>}
  <Section title={d.sections.strengths} label={d.sectionLabels.strengths}><ul className="strengths">{d.strengths.map(x=><li key={x}>{x}</li>)}</ul></Section>
  <Section title={d.sections.education} label={d.sectionLabels.education}><div className="education">{d.education.map(([school,degree,major,period])=><div key={school}><strong>{school}</strong><span>{degree} · {major}</span><time>{period}</time></div>)}</div></Section>
 </main>
}
createRoot(document.getElementById('root')).render(<App/>);
