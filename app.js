"use strict";
const $=id=>document.getElementById(id),GRADE="Grade 12",SECTION="HUMSS",DEFAULT_DL=Date.UTC(2026,10,5,4,0);
let DL=DEFAULT_DL,FILES=[];
function esc(s){return String(s).replace(/[&<>"]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[m]))}
function norm(s){return String(s||"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim()}
function fmt(ms){return new Date(ms).toLocaleString("en-PH",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Manila"})}
function get(q){const c=new AbortController(),t=setTimeout(()=>c.abort(),15000);return fetch(API_URL+"?"+q,{cache:"no-store",signal:c.signal}).then(r=>r.json()).finally(()=>clearTimeout(t))}
function post(o){return fetch(API_URL,{method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify(o)}).then(r=>r.json())}
function shrink(file){return new Promise((ok,no)=>{const im=new Image(),u=URL.createObjectURL(file);im.onload=()=>{const M=1600,r=Math.min(1,M/Math.max(im.width,im.height)),c=document.createElement("canvas");
 c.width=Math.round(im.width*r);c.height=Math.round(im.height*r);c.getContext("2d").drawImage(im,0,0,c.width,c.height);URL.revokeObjectURL(u);ok(c.toDataURL("image/jpeg",0.7).split(",")[1])};im.onerror=()=>no(new Error("bad image"));im.src=u})}
function closed(){return Date.now()>DL}
function showClosed(){$("form").style.display="none";$("closedbox").style.display="block";$("hcd").style.display="none"}
function tick(){if(closed()){showClosed();return}const m=Math.ceil((DL-Date.now())/60000);$("hcd").style.display="block";$("hcd").textContent="⏳ "+(Math.floor(m/60)?Math.floor(m/60)+"h ":"")+(m%60)+"m left to submit"}
function name(){return $("nm").value==="__other"?$("other").value.trim():$("nm").value}
function receipt(r){$("receipt").innerHTML='<div class="card score"><div class="cel">✅</div><div class="msg">Submitted!</div><div class="row"><b style="font-size:1.1rem;display:inline">'+esc(r.name)+'</b></div><div class="row">'+esc(r.grade+" — "+r.section)+'</div><div class="row">'+r.count+' photo(s)</div><div class="row">'+esc(fmt(r.time))+'</div><p class="note">Take a screenshot of this receipt.</p></div>'}
function mine(){try{return JSON.parse(localStorage.getItem("nsed2026")||"null")}catch(e){return null}}
let chk=0;
async function pick(){const n=name(),me=++chk;$("dupmsg").style.display="none";$("up").style.display="none";$("receipt").innerHTML="";
 if(!n)return;const m=mine();if(m&&norm(m.name)===norm(n)){receipt(m);$("dupmsg").style.display="block";return}
 try{const r=await get("action=nsedCheck&name="+encodeURIComponent(n));if(me!==chk)return;if(r.exists){$("dupmsg").style.display="block";return}}catch(e){}
 if(!closed())$("up").style.display="block"}
$("nm").onchange=()=>{$("otherwrap").style.display=$("nm").value==="__other"?"block":"none";pick()};
let tmr;$("other").oninput=()=>{clearTimeout(tmr);tmr=setTimeout(pick,600)};
$("ph").onchange=()=>{FILES=[...$("ph").files].slice(0,5);$("msg").textContent=$("ph").files.length>5?"Only the first 5 photos will be sent.":"";
 $("th").innerHTML="";FILES.forEach(f=>{const i=document.createElement("img");i.src=URL.createObjectURL(f);$("th").appendChild(i)})};
$("go").onclick=async()=>{const n=name(),b=$("go");$("msg").textContent="";
 if(closed()){showClosed();return}if(!n){$("msg").textContent="Please choose or type your name.";return}
 if(!FILES.length){$("msg").textContent="Please add 1 to 5 photos.";return}
 b.disabled=true;b.textContent="Sending…";
 try{const photos=[];for(const f of FILES)photos.push(await shrink(f));
  const r=await post({action:"nsed",grade:GRADE,section:SECTION,name:n,photos});
  if(r.ok){const rc={name:n,grade:GRADE,section:SECTION,count:r.count,time:Date.now()};localStorage.setItem("nsed2026",JSON.stringify(rc));$("form").style.display="none";receipt(rc)}
  else if(r.dup){$("up").style.display="none";$("dupmsg").style.display="block"}
  else if(r.closed){showClosed()}
  else $("msg").textContent="Error: "+(r.error||"please try again.")}
 catch(e){$("msg").textContent="Upload failed. Check your signal and try again."}
 b.disabled=false;b.textContent="Submit photos"};
(async()=>{try{const [c,i]=await Promise.all([get("action=config"),get("action=nsedInfo").catch(()=>({}))]);
 if(i&&i.deadline)DL=i.deadline;
 const ps=(c.learners||[]).filter(x=>norm(x.g)===norm(GRADE)).sort((a,b)=>(a.l+a.f).localeCompare(b.l+b.f));
 $("nm").innerHTML='<option value="">— Choose your name —</option>'+ps.map(x=>'<option value="'+esc(x.n)+'">'+esc(x.l&&x.f?x.l+", "+x.f:x.n)+'</option>').join("")+'<option value="__other">My name is not on the list</option>';
}catch(e){$("nm").innerHTML='<option value="">— Choose your name —</option><option value="__other">My name is not on the list</option>'}
 $("loading").style.display="none";$("form").style.display="block";tick();setInterval(tick,30000);
 const m=mine();if(m)receipt(m)})();
