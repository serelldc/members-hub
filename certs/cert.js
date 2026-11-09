/* SRDC certificate core: markup, rendering, security code. Needs qrcode.js and sig.js */
const SALT = 'SRDC-CERT-2026-v1';                       // keep identical in verify.html
const THEMES = {
  a: {label:'A · Midnight Gold',  ink:'#ffffff'},
  b: {label:'B · Ivory Executive', ink:'#0f2247'},
  c: {label:'C · Split Panel',     ink:'#0b1a3d'}
};
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const ordinal = n => { const s=['th','st','nd','rd'], v=n%100; return n+(s[(v-20)%10]||s[v]||s[0]); };
const fmtIssue = iso => { const [y,m,d]=iso.split('-').map(Number); return `${ordinal(d)} of ${MONTHS[m-1]} ${y}`; };
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

async function makeCode(serial,name,dates,issue){
  const data = [serial, name.trim().toLowerCase(), dates.trim().toLowerCase(), issue].join('|') + SALT;
  const h = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(data));
  const hex = [...new Uint8Array(h)].map(b=>b.toString(16).padStart(2,'0')).join('').toUpperCase();
  return `${hex.slice(0,4)}-${hex.slice(4,8)}-${hex.slice(8,12)}`;
}
function getSettings(){ try { return JSON.parse(localStorage.getItem('srdc_settings')) || {}; } catch { return {}; } }
const DEFAULT_VERIFY = 'https://srdc-certificate-verify-serelldc.vercel.app/verify.html';
function verifyBase(){ return getSettings().verifyBase || DEFAULT_VERIFY; }
function verifyUrl(serial,code){ return `${verifyBase()}?s=${encodeURIComponent(serial)}&c=${encodeURIComponent(code)}`; }

function tint(src,color){
  return new Promise(res => { const im=new Image(); im.onload=()=>{ const c=document.createElement('canvas'); c.width=im.width; c.height=im.height;
    const x=c.getContext('2d'); x.drawImage(im,0,0); x.globalCompositeOperation='source-in'; x.fillStyle=color; x.fillRect(0,0,c.width,c.height); res(c.toDataURL()); }; im.src=src; });
}

const CERT_HTML = `
  <div class="bgfx"></div>
  <img class="wm" src="logo.png" alt="">
  <div class="logo"><img src="logo.png" alt="SRDC"></div>
  <div class="serialtop"><small>CERTIFICATE NO.</small><span class="v-serial"></span></div>
  <div class="title"><span class="t1">CERTIFICATE</span><span class="t2">OF PARTICIPATION</span></div>
  <div class="certify">This is to certify that</div>
  <div class="name-wrap"><div class="name"></div></div>
  <div class="rule"><i></i></div>
  <div class="body"></div>
  <div class="given"></div>
  <div class="sig"><div class="img"><img alt=""></div><div class="ln"></div><div class="sn"></div><div class="st"></div></div>
  <div class="seal"></div>
  <div class="qrbox"><div class="qr"></div>
    <div class="meta"><small>Serial No.</small><b class="m-serial"></b><small>Security code</small><b class="m-code"></b><small>Scan to verify</small></div></div>
  <img class="sec" alt="">`;

let _uid = 0;
/* minimal digital border: neon line + a few circuit traces. Drawn as an <img> (SVG data-URL) so PDF export renders it reliably */
function buildSec(el){
  const W=1123,H=64, CY='#3ee6ff', BL='#5b9bf0', GD='#f2b44d';
  const main = `M0 16 H${W}`, outer = `M0 8 H${W}`;
  const trace = (d, x, y, c) => `<path d="${d}" fill="none" stroke="${c}" stroke-width="1.3" opacity=".95"/><circle cx="${x}" cy="${y}" r="3" fill="#060d22" stroke="${c}" stroke-width="1.3"/>`;
  const side = trace('M16 46 H78 L92 32 H170',170,32,CY) + trace('M44 56 H120 L132 46 H210',210,46,GD) + trace('M8 30 H44 L56 40 H96',96,40,CY);
  const t = 'SRDC OFFICIAL CERTIFICATE · STRATEGIC RESOURCE DIGITAL CREATORS · AUTHENTIC DOCUMENT · '.repeat(14);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <defs><filter id="gl" x="-5%" y="-80%" width="110%" height="260%"><feGaussianBlur stdDeviation="2.6"/></filter></defs>
    <rect width="${W}" height="${H}" fill="#060d22"/>
    <path d="${main}" fill="none" stroke="${CY}" stroke-width="7" opacity=".55" filter="url(#gl)"/>
    <path d="${main}" fill="none" stroke="${CY}" stroke-width="3" stroke-linejoin="round"/>
    <path d="${outer}" fill="none" stroke="${BL}" stroke-width="1.3" opacity=".9"/>
    <path d="M300 16 H${W-300}" stroke="#bff6ff" stroke-width="3.4" opacity=".9"/>
    <g>${side}</g><g transform="translate(${W},0) scale(-1,1)">${side}</g>
    <text x="${W/2}" y="40" text-anchor="middle" font-family="'Courier New',Courier,monospace" font-weight="700" font-size="12.5" letter-spacing="2.6" fill="#8ff2ff">DIGITALLY VERIFIED · SCAN QR TO AUTHENTICATE</text>
    <path d="M${W/2-210} 46 H${W/2+210}" stroke="${GD}" stroke-width="1" opacity=".6"/>
    <text x="4" y="${H-2}" font-family="Arial,Helvetica,sans-serif" font-size="4.8" fill="${BL}" opacity=".95" textLength="${W-8}" lengthAdjust="spacing">${t}</text>
  </svg>`;
  el.querySelector('.sec').src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}
function buildSeal(el){
  const id = 'u' + (++_uid);
  let pts=''; for (let i=0;i<=360;i+=2){ const a=i*Math.PI/180, r=58+3*Math.cos(a*30); pts += (i?'L':'M')+(r*Math.cos(a)).toFixed(2)+' '+(r*Math.sin(a)).toFixed(2); }
  el.querySelector('.seal').innerHTML = `<svg viewBox="-64 -64 128 128" width="128" height="128" xmlns="http://www.w3.org/2000/svg">
    <defs><radialGradient id="sg${id}" cx=".35" cy=".3" r=".9"><stop offset="0" stop-color="#fff0c4"/><stop offset=".45" stop-color="#f2b44d"/><stop offset="1" stop-color="#b87a10"/></radialGradient>
    <path id="sc${id}" d="M -41 0 A 41 41 0 1 1 41 0 A 41 41 0 1 1 -41 0"/></defs>
    <path d="${pts}Z" fill="url(#sg${id})" stroke="#8a5a08" stroke-width=".8"/>
    <circle r="49" fill="none" stroke="#8a5a08" stroke-width="1" opacity=".7"/>
    <circle r="31" fill="#0f2247" stroke="#ffe3a1" stroke-width="1.5"/>
    <text font-family="Inter,sans-serif" font-weight="700" font-size="6.2" fill="#3a2500" letter-spacing="1.6"><textPath href="#sc${id}">STRATEGIC RESOURCE · DIGITAL CREATORS · OFFICIAL ·</textPath></text>
    <text y="3" text-anchor="middle" font-family="Sora,Inter,sans-serif" font-weight="700" font-size="16" fill="#ffd98a" letter-spacing="1">SRDC</text>
    <text y="15" text-anchor="middle" font-family="Inter,sans-serif" font-weight="700" font-size="5.6" fill="#8fb8ff" letter-spacing="1.6">VERIFIED</text>
  </svg>`;
}

/* create a certificate element inside `host` using theme key 'a' | 'b' | 'c' */
function mountCert(host, theme){
  host.innerHTML = '';
  const el = document.createElement('div');
  el.className = 'cert t-' + theme; el.dataset.theme = theme; el.innerHTML = CERT_HTML;
  el.querySelectorAll('img.wm, .logo img').forEach(i => i.src = LOGO_DATA);   // data-URL so PDF export works from file://
  host.appendChild(el); buildSec(el); buildSeal(el);
  return el;
}

/* d = {name,event,dates,issue,serial,code,signName,signTitle,signImg?}  */
async function fillCert(el, d){
  const q = s => el.querySelector(s);
  q('.name').textContent = d.name || 'Participant Name';
  q('.body').innerHTML = `has participated in the Online Seminar/Orientation on <b>${esc(d.event)}</b>` + (d.dates ? ` held on <b>${esc(d.dates)}</b>` : '') + '.';
  q('.given').textContent = `Given this ${fmtIssue(d.issue)} online on the occasion of its regular Seminar/Orientation.`;
  el.querySelectorAll('.v-serial,.m-serial').forEach(n => n.textContent = d.serial);
  q('.m-code').textContent = d.code;
  q('.sn').textContent = d.signName || 'Authorized Signatory'; q('.st').textContent = d.signTitle || '';
  q('.qr').innerHTML = ''; new QRCode(q('.qr'), {text: verifyUrl(d.serial,d.code), width:240, height:240, correctLevel: QRCode.CorrectLevel.M});
  const ink = THEMES[el.dataset.theme].ink;
  const si = q('.sig img'); si.src = await tint(d.signImg || SIG_WHITE, ink);
  // shrink long names to fit their box
  const n = q('.name'), maxW = q('.name-wrap').clientWidth; let fs = parseFloat(getComputedStyle(n).fontSize) || 54; n.style.fontSize = '';
  fs = parseFloat(getComputedStyle(n).fontSize);
  while (n.scrollWidth > maxW && fs > 24){ fs -= 2; n.style.fontSize = fs + 'px'; }
}
