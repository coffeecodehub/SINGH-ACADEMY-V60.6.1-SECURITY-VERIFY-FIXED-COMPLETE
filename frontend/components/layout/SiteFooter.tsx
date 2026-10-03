'use client';
import {useWebsiteContent,websiteText} from "../WebsiteContent";
import AcademyImage from '../AcademyImage';
import {socialIcons} from '../cms/socialIcons';
import {useEffect,useState} from 'react';
import {getPublicSiteContent} from '../../lib/publicSiteContent';

const labels:any={instagram:'Instagram',facebook:'Facebook',linkedin:'LinkedIn',youtube:'YouTube',x:'X',tiktok:'TikTok',whatsapp:'WhatsApp',threads:'Threads',pinterest:'Pinterest'};
const telHref=(value:string)=>'tel:'+value.replace(/[^+\d]/g,'');
const mapHref=(location:string,configured:string)=>{try{if(configured){const u=new URL(configured);if(['http:','https:'].includes(u.protocol)&&!u.username&&!u.password)return u.href;}}catch{}return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;};
const Icon=({name}:any)=>{const icon=socialIcons[name];return icon?<svg width="18" height="18" viewBox={`0 0 ${icon.width} ${icon.height}`} fill="currentColor" aria-hidden="true">{(Array.isArray(icon.path)?icon.path:[icon.path]).map((d,i)=><path key={i} d={d}/>)}</svg>:null};

export default function SiteFooter(){
 const website=useWebsiteContent();
 const[social,setSocial]=useState<any>({});
 useEffect(()=>{let active=true;getPublicSiteContent().then(content=>{if(active)setSocial(content.footerSocial||{})}).catch(()=>{});return()=>{active=false}},[]);
 const email=websiteText(website,'contact-009','singh@singhacademy.com');
 const phone=websiteText(website,'contact-010','+1 (559) 308 1249');
 const location=websiteText(website,'contact-011','By appointment · USA');
 const configuredMap=websiteText(website,'contact-012','');
 return <footer className="footer">
  <div className="footerTop">
   <div className="brand footerBrand">
    <AcademyImage src="/singh-academy-logo-clean.png" alt={websiteText(website,"footer-001","Singh Academy")}/>
    <div>
     <strong>{websiteText(website,"footer-002","SINGH ACADEMY")}</strong>
     <p>{websiteText(website,"footer-003","Transforming conflict into connection and negotiation into opportunity.")}</p>
     <div className="footerSocial">{Object.entries(social).filter(([k,v])=>socialIcons[k]&&typeof v==='string'&&/^https?:\/\//i.test(v)).map(([k,v]:any)=><a key={k} href={v} target="_blank" rel="noreferrer" aria-label={labels[k]||k} title={labels[k]||k}><Icon name={k}/></a>)}</div>
    </div>
   </div>
   <div>
    <b>{websiteText(website,"footer-004","Explore")}</b>
    <a href="/about">{websiteText(website,"footer-005","About")}</a>
    <a href="/academy">{websiteText(website,"footer-006","Academy")}</a>
    <a href="/team">{websiteText(website,"footer-007","Team")}</a>
    <a href="/reviews">{websiteText(website,"footer-008","Reviews")}</a>
   </div>
   <div>
    <b>{websiteText(website,"footer-009","Learn")}</b>
    <a href="/events">{websiteText(website,"footer-010","Events")}</a>
    <a href="/courses">{websiteText(website,"footer-011","Courses")}</a>
   </div>
   <div className="footerContactColumn">
    <b>{websiteText(website,"footer-012","Contact")}</b>
    <a className="footerContactLine" href={`mailto:${email}`}>{email}</a>
    <a className="footerContactLine" href={telHref(phone)}>{phone}</a>
    <a className="footerContactLine footerLocation" href={mapHref(location,configuredMap)} target="_blank" rel="noopener noreferrer">{location}</a>
   </div>
   <div>
    <b>{websiteText(website,"footer-013","Account")}</b>
    <a href="/login">{websiteText(website,"footer-014","Sign In")}</a>
    <a href="/register">{websiteText(website,"footer-015","Get Started")}</a>
    <a href="/terms">{websiteText(website,"footer-016","Terms")}</a>
    <a href="/privacy">{websiteText(website,"footer-017","Privacy")}</a>
   </div>
  </div>
  <div className="footerBottom">
   <span>{websiteText(website,"footer-018","© 2026 Singh Academy. All rights reserved.")}</span>
   <span>{websiteText(website,"footer-019","Negotiation • Mediation • Leadership • Cross-Cultural Communication")}</span>
   <a className="footerDeveloper" href="https://www.coffecodehub.com/" target="_blank" rel="noopener noreferrer">{websiteText(website,'footer-020','Developed by coffeeCODEhub')}</a>
  </div>
 </footer>;
}
