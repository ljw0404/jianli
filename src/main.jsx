import React from 'react';
import {createRoot} from 'react-dom/client';
import dataRaw from '../data.json?raw';
import './styles.css';
import './refinements.css';

const escPath = () => window.location.pathname.toLowerCase().startsWith('/en') ? 'en' : 'zh';
const ADMIN_KEY = import.meta.env.VITE_ADMIN_KEY || 'change-me';
const DATA_STORAGE_KEY = 'resume-data-v1';
function parseJsonc(source){
 let output='', quote=false, escaped=false, lineComment=false, blockComment=false;
 for(let i=0;i<source.length;i++){
  const ch=source[i], next=source[i+1];
  if(lineComment){if(ch==='\n'){lineComment=false;output+=ch}continue}
  if(blockComment){if(ch==='*'&&next==='/'){blockComment=false;i++}continue}
  if(quote){output+=ch;if(escaped)escaped=false;else if(ch==='\\')escaped=true;else if(ch==='"')quote=false;continue}
  if(ch==='"'){quote=true;output+=ch;continue}
  if(ch==='/'&&next==='/'){lineComment=true;i++;continue}
  if(ch==='/'&&next==='*'){blockComment=true;i++;continue}
  output+=ch;
 }
 return JSON.parse(output);
}
const data = parseJsonc(dataRaw);
function readResumeData(){try{const saved=localStorage.getItem(DATA_STORAGE_KEY);return saved?parseJsonc(saved):data}catch{return data}}
function Link({href, children, externalArrow=false}){return href?<a href={href} target="_blank" rel="noreferrer">{children}{externalArrow?' ↗':''}</a>:<>{children}</>}
function Section({title,label,children}){return <section><h2><span aria-hidden="true"/>{title}<small>{label}</small><i aria-hidden="true"/></h2>{children}</section>}
function App(){
 const [resumeData,setResumeData]=React.useState(readResumeData); const [lang,setLang]=React.useState(escPath()); const d=resumeData[lang];
 if(window.location.pathname.toLowerCase().startsWith('/admin')) return <Admin data={resumeData} onSave={setResumeData}/>;
 const switchLang=(e)=>{e.preventDefault();const next=lang==='zh'?'en':'zh';setLang(next);history.pushState({},'',`/${next}`);document.documentElement.lang=next==='zh'?'zh-CN':'en';document.title=resumeData[next].pageTitle};
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
function Admin({data:initialData,onSave}){
 const [authed,setAuthed]=React.useState(()=>sessionStorage.getItem('resume-admin-auth')==='1');
 const [key,setKey]=React.useState(''); const [draft,setDraft]=React.useState(()=>JSON.stringify(initialData,null,2)); const [status,setStatus]=React.useState('');
 React.useEffect(()=>{document.title='简历管理后台';document.documentElement.lang='zh-CN'},[]);
 const login=(e)=>{e.preventDefault();if(key===ADMIN_KEY&&ADMIN_KEY!=='change-me'){sessionStorage.setItem('resume-admin-auth','1');setAuthed(true);setStatus('')}else setStatus(ADMIN_KEY==='change-me'?'请先在 .env 配置 VITE_ADMIN_KEY':'密钥不正确')};
 const save=()=>{try{const parsed=parseJsonc(draft);if(!parsed.zh||!parsed.en)throw new Error('需要同时保留 zh 和 en 节点');localStorage.setItem(DATA_STORAGE_KEY,JSON.stringify(parsed));onSave(parsed);setStatus('已保存，公开页面刷新后即可看到最新内容')}catch(e){setStatus(`保存失败：${e.message}`)}};
 const reset=()=>{setDraft(JSON.stringify(initialData,null,2));setStatus('已恢复当前页面数据，尚未保存')};
 if(!authed)return <div className="admin-shell"><form className="login-card" onSubmit={login}><div className="admin-kicker">RESUME ADMIN</div><h1>管理后台</h1><p>请输入访问密钥以编辑简历数据。</p><label>访问密钥<input autoFocus type="password" value={key} onChange={e=>setKey(e.target.value)} placeholder="VITE_ADMIN_KEY"/></label><button className="primary" type="submit">进入管理后台</button>{status&&<div className="admin-status error">{status}</div>}</form></div>;
 return <div className="admin-shell"><header className="admin-header"><div><div className="admin-kicker">RESUME ADMIN</div><h1>简历内容管理</h1><p>编辑下方 JSON，可配置 data.json 中的全部字段。</p></div><div className="admin-actions"><button onClick={reset}>重置</button><button onClick={()=>{sessionStorage.removeItem('resume-admin-auth');setAuthed(false)}}>退出</button><button className="primary" onClick={save}>保存更改</button></div></header><main className="editor-card"><div className="editor-meta"><span>zh / en · JSON</span><span>保存位置：当前浏览器</span></div><textarea spellCheck="false" value={draft} onChange={e=>setDraft(e.target.value)} aria-label="简历数据 JSON 编辑器" />{status&&<div className={`admin-status ${status.startsWith('保存失败')?'error':'success'}`}>{status}</div>}</main></div>;
}
createRoot(document.getElementById('root')).render(<App/>);
