'use client';
import {useEffect,useMemo,useState} from 'react';
import {useWebsiteContent,websiteText} from '../../components/WebsiteContent';
import {coursePrice} from '../../lib/money';
import AcademyImage from '../../components/AcademyImage';
import {apiFetch} from '../../lib/api';
import {useAuth} from '../../components/auth/AuthProvider';
import SiteHeader from '../../components/SiteHeader';
import SiteFooter from '../../components/layout/SiteFooter';
import BackButton from '../../components/layout/BackButton';

const fallbackImage='/images/courses/cross-cultural-community.png';

export default function CoursesPage(){
 const website=useWebsiteContent();
 const {user,ready}=useAuth();
 const [courses,setCourses]=useState<any[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState('');
 const [membershipSlugs,setMembershipSlugs]=useState<Set<string>>(new Set());
 useEffect(()=>{setLoading(true);setError('');apiFetch('/courses').then(d=>setCourses(d.courses||[])).catch(e=>setError(e.message)).finally(()=>setLoading(false));},[]);
 useEffect(()=>{
  if(!ready||user?.role!=='student'){setMembershipSlugs(new Set());return;}
  let live=true;
  apiFetch('/courses/enrolled/mine').then(d=>{
   if(!live)return;
   const slugs=d.membershipActive?(d.courses||[]).map((c:any)=>String(c.slug)):(d.courses||[]).filter((c:any)=>c?.membershipAccess===true||c?.enrollment?.source==='membership').map((c:any)=>String(c.slug));
   setMembershipSlugs(new Set(slugs));
  }).catch(()=>{if(live)setMembershipSlugs(new Set());});
  return ()=>{live=false;};
 },[ready,user]);
 const decorated=useMemo(()=>courses.map(c=>({...c,membershipCovered:membershipSlugs.has(String(c.slug))})),[courses,membershipSlugs]);
 const accessLabel=(course:any)=>course.membershipCovered?'Membership access':course.accessType==='membership'?'Membership access':course.pricing?.[0]?.durationMonths?`${course.pricing[0].durationMonths} month${course.pricing[0].durationMonths===1?'':'s'} access`:`${course.accessMonths||1} month${(course.accessMonths||1)===1?'':'s'} access`;
 return <main><SiteHeader/><section className="innerHero"><BackButton label="Back"/><span className="kicker">{websiteText(website,'courses-001','COURSES')}</span><h1>{websiteText(website,'courses-002','Professional learning, organized around practical outcomes.')}</h1><p>{websiteText(website,'courses-003','Open a course to review curriculum, modules, lessons, resources, access period and enrollment options.')}</p></section><section className="contentWrap">{loading?<div className="emptyState"><b>{websiteText(website,'courses-004','Loading courses…')}</b></div>:decorated.length?<div className="courseVisualGrid">{decorated.map(c=><article className="courseVisualCard" key={c._id||c.slug}><AcademyImage style={{objectFit:c.thumbnailFit||'cover',objectPosition:`${c.thumbnailPositionX??50}% ${c.thumbnailPositionY??50}%`,transform:`scale(${c.thumbnailZoom||1})`}} src={c.thumbnail||fallbackImage} onError={e=>{e.currentTarget.src=fallbackImage}} alt={c.title}/><div className="courseCardBody"><span className="instructorBadge">{c.instructor||'Singh Academy Faculty'}</span><h3>{c.title}</h3><p>{c.shortDescription||c.description||'Professional Singh Academy course.'}</p><div className="courseMeta"><b>{c.membershipCovered?'Membership Access':coursePrice(c)}</b><span>{c.membershipCovered?'Included in your active Academy membership':accessLabel(c)}</span></div><a className="button courseEnroll" href={`/courses/${c.slug}`}>{websiteText(website,'courses-005','View Course →')}</a></div></article>)}</div>:<div className="emptyState"><b>{websiteText(website,'courses-006','Courses coming soon.')}</b><p>{websiteText(website,'courses-007','No published course data is available yet. Run the backend seed command or publish courses from the admin system.')}</p></div>}{error&&<div className="authError" role="alert">{error}</div>}</section><SiteFooter/></main>;
}
