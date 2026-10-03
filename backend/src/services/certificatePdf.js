import fs from 'node:fs';
import {businessError} from '../utils/business.js';
import {assemblePdf,pdfStream} from '../utils/pdfWriter.js';
const widths=JSON.parse(fs.readFileSync(new URL('../assets/certificate-widths.json',import.meta.url),'utf8'));
const logoSize=JSON.parse(fs.readFileSync(new URL('../assets/certificate-logo-original.json',import.meta.url),'utf8'));
const logo=fs.readFileSync(new URL('../assets/certificate-logo-original.rgb.deflate',import.meta.url));
const alpha=fs.readFileSync(new URL('../assets/certificate-logo-original.alpha.deflate',import.meta.url));
const signatureSize=JSON.parse(fs.readFileSync(new URL('../assets/certificate-signature.json',import.meta.url),'utf8'));
const signature=fs.readFileSync(new URL('../assets/certificate-signature.rgb.deflate',import.meta.url));
const signatureAlpha=fs.readFileSync(new URL('../assets/certificate-signature.alpha.deflate',import.meta.url));
const extras=new Map([['€',128],['‚',130],['ƒ',131],['„',132],['…',133],['†',134],['‡',135],['ˆ',136],['‰',137],['Š',138],['‹',139],['Œ',140],['Ž',142],['‘',145],['’',146],['“',147],['”',148],['•',149],['–',150],['—',151],['˜',152],['™',153],['š',154],['›',155],['œ',156],['ž',158],['Ÿ',159]]);
export function certificateText(value,label='Certificate text'){
 if(typeof value!=='string'||!value.trim()||value.length>250||/[\x00-\x1f\x7f]/.test(value))throw businessError(`${label} is missing or too long.`,400);
 const text=value.trim().normalize('NFC'),bytes=[];for(const char of text){const code=char.codePointAt(0);if((code>=32&&code<=126)||(code>=160&&code<=255))bytes.push(code);else if(extras.has(char))bytes.push(extras.get(char));else throw businessError(`${label} contains characters this certificate font cannot print. Enter an approved Latin-script display spelling; do not change the student account name.`,400);}return {text,bytes:Buffer.from(bytes)};
}
function literal(value){return '('+[...certificateText(value).bytes].map(b=>b===40||b===41||b===92?'\\'+String.fromCharCode(b):b>=128?'\\'+b.toString(8).padStart(3,'0'):String.fromCharCode(b)).join('')+')';}
const width=(text,font,size)=>[...certificateText(text).bytes].reduce((n,b)=>n+(widths[font]?.[String(b)]||600),0)/1000*size;
function fitted(text,font,maxSize,maxWidth,minSize=10){let size=maxSize;while(size>minSize&&width(text,font,size)>maxWidth)size-=.5;if(width(text,font,size)>maxWidth)throw businessError('Certificate text is too wide. Use a shorter approved display title.',400);return size;}
function wrap(text,font,size,maxWidth){const lines=[];let line='';for(const word of text.split(/\s+/)){const candidate=line?line+' '+word:word;if(width(candidate,font,size)>maxWidth&&line){lines.push(line);line=word;}else line=candidate;}if(line)lines.push(line);return lines;}

/** A4 landscape certificate matching the approved Singh Academy theme with refined layout and a professional gold seal for all courses. */
export function createCertificatePdf({studentName,courseTitle,completedAt,issuedAt,issuedBy,number,verificationUrl,sample=false}){
 for(const [label,value] of Object.entries({studentName,courseTitle,issuedBy,number}))certificateText(value,label);
 const url=new URL(verificationUrl);if(!['http:','https:'].includes(url.protocol)||url.username||url.password)throw businessError('Invalid certificate verification URL.');
 const date=value=>{const d=new Date(value);if(!Number.isFinite(d.getTime()))throw businessError('Certificate date is invalid.');return d.toLocaleDateString('en-US',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'});};
 const W=841.89,H=595.28,ops=[];
 const text=(t,x,y,size=12,font='Helvetica',fill='0.13 0.12 0.10 rg')=>ops.push(`BT ${fill} /${font==='Helvetica'?'F1':font==='Helvetica-Bold'?'F2':'F3'} ${size} Tf 1 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)} Tm ${literal(t)} Tj ET`);
 const center=(t,y,size=12,font='Helvetica',fill)=>text(t,(W-width(t,font,size))/2,y,size,font,fill);
 const circle=(cx,cy,r,fill,stroke)=>{const k=.5522847498*r;ops.push(`${fill} rg ${stroke} RG 1 w ${cx+r} ${cy} m ${cx+r} ${cy+k} ${cx+k} ${cy+r} ${cx} ${cy+r} c ${cx-k} ${cy+r} ${cx-r} ${cy+k} ${cx-r} ${cy} c ${cx-r} ${cy-k} ${cx-k} ${cy-r} ${cx} ${cy-r} c ${cx+k} ${cy-r} ${cx+r} ${cy-k} ${cx+r} ${cy} c B`);};
 const starSeal=(cx,cy,outerR,innerR,points,fill,stroke)=>{
  const coords=[];
  for(let i=0;i<points*2;i++){
   const angle=-Math.PI/2 + i*Math.PI/points;
   const r=i%2===0?outerR:innerR;
   coords.push([cx+Math.cos(angle)*r,cy+Math.sin(angle)*r]);
  }
  const [sx,sy]=coords[0];
  ops.push(`${fill} rg ${stroke} RG 1 w ${sx.toFixed(2)} ${sy.toFixed(2)} m ${coords.slice(1).map(([x,y])=>`${x.toFixed(2)} ${y.toFixed(2)} l`).join(' ')} h B`);
 };

 // Paper and frame.
 ops.push(
  '0.962 0.949 0.914 rg 0 0 841.89 595.28 re f',
  '0.37 0.24 0.14 RG 4 w 16 16 809.89 563.28 re S',
  '0.63 0.44 0.25 RG 1.4 w 25 25 791.89 545.28 re S',
  '0.84 0.72 0.55 RG .55 w 32 32 777.89 531.28 re S'
 );

 // Watermarks.
 const centerH=165,centerW=centerH*logoSize.width/logoSize.height;
 ops.push(`q /WM2 gs ${centerW.toFixed(2)} 0 0 ${centerH} ${(W-centerW)/2} 205 cm /Logo Do Q`);
 const marks=[[96,388,60],[216,425,50],[610,420,50],[724,470,64],[56,216,58],[704,208,58],[230,94,54],[612,116,54]];
 for(const [x,y,h] of marks){const w=h*logoSize.width/logoSize.height;ops.push(`q /WM gs ${w.toFixed(2)} 0 0 ${h} ${x} ${y} cm /Logo Do Q`);}

 // Main shield logo.
 const mainH=92,mainW=mainH*logoSize.width/logoSize.height;
 ops.push(`q ${mainW.toFixed(2)} 0 0 ${mainH} 58 456 cm /Logo Do Q`);

 center('SINGH ACADEMY',498,13,'Helvetica-Bold','0.23 0.19 0.15 rg');
 center('CERTIFICATE OF COMPLETION',454,28,'Times-Roman','0.14 0.12 0.10 rg');
 center('This certificate is proudly presented to',408,10.5,'Helvetica','0.42 0.37 0.31 rg');
 const ns=fitted(studentName,'Times-Roman',34,520,18);center(studentName,355,ns,'Times-Roman','0.13 0.12 0.10 rg');
 ops.push('0.43 0.31 0.20 RG 1 w 170 340 m 672 340 l S');
 center('for completing the required lessons in',314,10.5,'Helvetica','0.42 0.37 0.31 rg');
 let ts=23,lines=wrap(courseTitle,'Helvetica-Bold',ts,470);while((lines.length>2||lines.some(line=>width(line,'Helvetica-Bold',ts)>470))&&ts>16){ts-=.5;lines=wrap(courseTitle,'Helvetica-Bold',ts,470);}if(lines.length>2)throw businessError('Course title is too long for the certificate. Use a shorter approved display title.',400);
 const firstY=lines.length===1?272:283;for(const [i,line] of lines.entries())center(line,firstY-i*(ts*1.22),fitted(line,'Helvetica-Bold',ts,470,15),'Helvetica-Bold','0.10 0.10 0.10 rg');
 center('Completion acknowledged and certificate issued by Singh Academy.',213,10,'Helvetica','0.35 0.32 0.28 rg');

 // Footer details.
 text('COMPLETED',86,150,8,'Helvetica-Bold','0.43 0.31 0.20 rg');
 text(date(completedAt),86,130,10,'Helvetica');
 text('ISSUED',334,150,8,'Helvetica-Bold','0.43 0.31 0.20 rg');
 text(date(issuedAt),334,130,10,'Helvetica');
 text('AUTHORIZED BY',545,150,8,'Helvetica-Bold','0.43 0.31 0.20 rg');
 const sigH=56,sigW=sigH*signatureSize.width/signatureSize.height;
 ops.push(`q ${sigW.toFixed(2)} 0 0 ${sigH} 548 96 cm /Signature Do Q`,'0.58 0.49 0.39 RG .65 w 545 103 m 690 103 l S');
 text('Authorized Signature - Singh Academy',545,82,8,'Helvetica','0.35 0.31 0.27 rg');
 text('CERTIFICATE NO.',86,103,7,'Helvetica-Bold','0.43 0.31 0.20 rg');
 text(number,86,83,9,'Helvetica-Bold');
 text('Verify certificate online',334,83,8,'Helvetica','0.35 0.31 0.27 rg');

 // Professional gold seal matching the approved theme more closely.
 starSeal(W/2,49,35,30,24,'0.83 0.60 0.21','0.65 0.43 0.13');
 starSeal(W/2,49,31,27,24,'0.90 0.69 0.28','0.76 0.52 0.17');
 circle(W/2,49,25,'0.91 0.73 0.34','0.76 0.54 0.17');
 circle(W/2,49,20.5,'0.95 0.79 0.40','0.80 0.56 0.18');
 circle(W/2,49,18.25,'0.90 0.71 0.31','0.77 0.54 0.17');
 center('SA',42,13,'Times-Roman','0.48 0.31 0.11 rg');
 if(sample)center('SAMPLE - NOT AN ISSUED CERTIFICATE',19,8,'Helvetica-Bold','0.58 0.16 0.12 rg');

 const stream=Buffer.from(ops.join('\n'),'ascii');
 return assemblePdf([
  '<< /Type /Catalog /Pages 2 0 R >>','<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
  `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << /F1 4 0 R /F2 5 0 R /F3 6 0 R >> /XObject << /Logo 7 0 R /Signature 9 0 R >> /ExtGState << /WM 11 0 R /WM2 12 0 R >> >> /Contents 13 0 R /Annots [14 0 R] >>`,
  '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>','<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>','<< /Type /Font /Subtype /Type1 /BaseFont /Times-Roman /Encoding /WinAnsiEncoding >>',
  pdfStream(logo,`/Type /XObject /Subtype /Image /Width ${logoSize.width} /Height ${logoSize.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /FlateDecode /SMask 8 0 R`),
  pdfStream(alpha,`/Type /XObject /Subtype /Image /Width ${logoSize.width} /Height ${logoSize.height} /ColorSpace /DeviceGray /BitsPerComponent 8 /Filter /FlateDecode`),
  pdfStream(signature,`/Type /XObject /Subtype /Image /Width ${signatureSize.width} /Height ${signatureSize.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /FlateDecode /SMask 10 0 R`),
  pdfStream(signatureAlpha,`/Type /XObject /Subtype /Image /Width ${signatureSize.width} /Height ${signatureSize.height} /ColorSpace /DeviceGray /BitsPerComponent 8 /Filter /FlateDecode`),
  '<< /Type /ExtGState /ca .08 /CA .08 >>','<< /Type /ExtGState /ca .14 /CA .14 >>',pdfStream(stream),
  `<< /Type /Annot /Subtype /Link /Rect [328 76 506 98] /Border [0 0 0] /A << /S /URI /URI ${literal(url.href)} >> >>`,
  `<< /Title ${literal('Certificate of Completion - '+number)} /Author (Singh Academy) /Producer (Singh Academy Certificate Service V60.6.1) >>`
 ]);
}
