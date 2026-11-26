// Money Profile — data stays in localStorage. No server, no tracking.
const APP_VERSION = '2026-11-26.6';
const KEY = 'moneyProfileV1';
const $ = id => document.getElementById(id);
const EXPENSE_KEYS = [['housing','Housing'],['food','Food'],['transport','Transport'],['subs','Subscriptions'],['shopping','Shopping'],['fun','Fun / Eating out'],['health','Health'],['other','Other']];
let state = load();
let charts = {};
// First-time page: show the welcome chooser when there is no profile yet,
// OR when the page was opened with ?welcome=1 (e.g. after tapping
// "↻ Latest version" — that button always lands on the chooser).
let welcomeOpen = state.profiles.length === 0 || new URLSearchParams(location.search).get('welcome') === '1' || new URLSearchParams(location.search).has('v');

function load(){
  try{
    const d = JSON.parse(localStorage.getItem(KEY));
    if(d && Array.isArray(d.profiles)){
      d.profiles.forEach((p,i)=>{ if(!p.id) p.id='p'+(i+1); if(!Array.isArray(p.entries)) p.entries=[]; if(!p.currency) p.currency='USD'; if(p.goal==null) p.goal=20; if(!Array.isArray(p.goals)) p.goals=[]; if(!p.budgets) p.budgets={}; });
      if(!d.currentProfileId || !d.profiles.find(p=>p.id===d.currentProfileId)) d.currentProfileId = d.profiles[0] ? d.profiles[0].id : null;
      return d;
    }
    // Legacy single-profile format (profile + entries) → migrate to profiles
    if(d && Array.isArray(d.entries)){
      const p = d.profile || {name:'',currency:'USD',goal:20};
      const prof = { id:'p1', name:p.name||'', currency:p.currency||'USD', goal:p.goal||20, entries:d.entries, goals:[], budgets:{} };
      return { profiles:[prof], currentProfileId:'p1' };
    }
  }catch(e){}
  return { profiles:[], currentProfileId:null };
}
function save(){ localStorage.setItem(KEY, JSON.stringify(state)); }
function prof(){ return state.profiles.find(p=>p.id===state.currentProfileId) || state.profiles[0] || null; }
function cur(){ const p=prof(); const c=p?p.currency:'USD'; return c === 'INR' ? '₹' : c === 'EUR' ? '€' : c === 'GBP' ? '£' : '$'; }
function money(n){ return cur() + Math.round(Number(n)||0).toLocaleString('en-US'); }
function num(id){ return parseFloat($(id).value) || 0; }
function sorted(){ const p=prof(); return p ? [...p.entries].sort((a,b)=>a.month.localeCompare(b.month)) : []; }
function totalSpend(e){ return EXPENSE_KEYS.reduce((s,[k])=>s + (Number(e.expenses[k])||0), 0); }
function surplus(e){ return (Number(e.income)||0) - totalSpend(e); }
function netWorth(e){ return (Number(e.assets)||0) - (Number(e.debts)||0); }
function rate(e){ return e.income ? surplus(e)/e.income*100 : 0; }
function monthLabel(m){ const [y,mo]=m.split('-'); return new Date(+y, +mo-1, 1).toLocaleDateString('en-US',{month:'short', year:'numeric'}); }

function streakCount(entries){ let s=0; for(let i=entries.length-1;i>=0;i--){ if(surplus(entries[i])>=0) s++; else break; } return s; }
function celebrate(){ if(typeof confetti!=='undefined') confetti({particleCount:140,spread:80,origin:{y:.6},colors:['#22c55e','#6366f1','#f59e0b','#ec4899']}); }
function animateNum(el, target){ const start=performance.now(), from=0, dur=700; const step=(t)=>{ const k=Math.min(1,(t-start)/dur); el.textContent = money(from+(target-from)*(1-Math.pow(1-k,3))); if(k<1) requestAnimationFrame(step); }; requestAnimationFrame(step); }
function renderInsights(entries){
  const p=prof(); if(!p) return;
  const streak=streakCount(entries);
  $('streakPill').textContent = streak? `🔥 ${streak} green month${streak>1?'s':''} in a row` : 'No streak yet — make this month green';
  if(!entries.length){ $('insightText').textContent='Add a month to see your insight.'; $('insightTip').textContent=''; $('badgeRow').innerHTML=''; return; }
  const last=entries[entries.length-1], prev=entries[entries.length-2];
  const s=surplus(last), r=rate(last), nw=netWorth(last);
  const best=entries.reduce((a,b)=>surplus(b)>surplus(a)?b:a);
  const cat=EXPENSE_KEYS.map(([k,l])=>[l,last.expenses[k]||0]).sort((a,b)=>b[1]-a[1])[0];
  $('insightText').textContent = `${monthLabel(last.month)}: you ${s>=0?'kept':'lost'} ${money(Math.abs(s))} (${r.toFixed(1)}% saved). Net worth ${money(nw)}${prev?`, ${nw>=netWorth(prev)?'up':'down'} ${money(Math.abs(nw-netWorth(prev)))} vs last month`:''}. Biggest spend: ${cat[0]} ${money(cat[1])}. Best month so far: ${monthLabel(best.month)} (+${money(surplus(best))}).`;
  $('insightTip').textContent = s<0 ? '💡 Tip: cut your biggest category by 10% next month and this turns green.' : r < p.goal ? `💡 Tip: you're below your ${p.goal}% goal — try saving ${money(last.income*p.goal/100 - (last.saved||0))} more next month.` : '💡 Tip: you beat your goal — put the extra into your top savings goal below.';
  const greenTotal=entries.filter(e=>surplus(e)>=0).length;
  const badges=[
    [entries.length>=1,'🎉 First month','First month'],
    [greenTotal>=3,'🥉 3 green months','3 green months'],
    [streak>=3,'🔥 3-month streak','3-month streak'],
    [nw>=10000,'💰 $10k net worth','$10k net worth'],
    [(last.debts||0)===0,'🕊️ Debt-free month','Debt-free month'],
    [r>=30,'⭐ 30% saver','30% saver'],
  ];
  $('badgeRow').innerHTML = badges.map(([got,label,locked])=>`<span class="badge-chip ${got?'':'locked'}">${got?label:'🔒 '+locked}</span>`).join('');
}
function renderGoals(){
  const p=prof(); if(!p) return;
  $('goalList').innerHTML = p.goals.length ? p.goals.map(g=>{
    const pct=Math.min(100, Math.round((g.saved||0)/g.target*100));
    return `<div class="goal-item"><div class="goal-top"><span>🎯 ${g.name}</span><span>${money(g.saved||0)} / ${money(g.target)}</span></div><div class="goal-bar"><div class="goal-fill" style="width:${pct}%"></div></div><div style="display:flex;gap:6px;align-items:center"><span class="muted small">${pct}% there ${pct>=100?'🎉 Goal reached!':''}</span><button class="btn ghost small" data-goal-add="${g.id}" type="button">+ $100</button><button class="btn ghost small" data-goal-del="${g.id}" type="button">🗑</button></div></div>`;
  }).join('') : '<p class="muted">No goals yet — add one below, e.g. Vacation $2,000.</p>';
  $('goalList').querySelectorAll('[data-goal-add]').forEach(b=>b.onclick=()=>{ const g=p.goals.find(x=>x.id===b.dataset.goalAdd); g.saved=(g.saved||0)+100; save(); render(); if(g.saved>=g.target) celebrate(); });
  $('goalList').querySelectorAll('[data-goal-del]').forEach(b=>b.onclick=()=>{ if(confirm('Delete this goal?')){ p.goals=p.goals.filter(x=>x.id!==b.dataset.goalDel); save(); render(); } });
}
function renderBudgets(){
  const p=prof(); if(!p) return;
  const entries=sorted(); const last=entries[entries.length-1];
  $('budgetList').innerHTML = EXPENSE_KEYS.map(([k,l])=>{
    const actual=last? (last.expenses[k]||0):0; const bud=p.budgets[k]||'';
    const over=bud && actual>bud;
    return `<div class="budget-row"><span>${l} ${last?`<span class="${over?'red-text':'green-text'}">${money(actual)}</span>`:''}</span><input type="number" min="0" placeholder="Budget $" value="${bud}" data-budget="${k}"><span class="muted small">${bud? (over?'🔴 over by '+money(actual-bud):'🟢 under by '+money(bud-actual)) : '—'}</span></div>`;
  }).join('');
  $('budgetList').querySelectorAll('[data-budget]').forEach(inp=>inp.addEventListener('change', e=>{ const v=parseFloat(e.target.value)||0; if(v) p.budgets[e.target.dataset.budget]=v; else delete p.budgets[e.target.dataset.budget]; save(); render(); }));
}

function render(){
  const p = prof();
  const entries = sorted();
  // Profile dropdown — pick an existing profile, or create a new one
  $('profileSelect').innerHTML = state.profiles.map(x=>`<option value="${x.id}">${x.name||'Unnamed profile'}${x.entries.length?` (${x.entries.length} mo)`:''}</option>`).join('');
  if(p) $('profileSelect').value = p.id;
  $('welcomeProfileSelect').innerHTML = state.profiles.map(x=>`<option value="${x.id}">${x.name||'Unnamed profile'}${x.entries.length?` (${x.entries.length} mo)`:''}</option>`).join('');
  $('welcomeExisting').hidden = state.profiles.length === 0;
  if(p) $('welcomeProfileSelect').value = p.id;
  // Welcome: show when there is no profile yet, or when the user tapped
  // "+ New profile". Otherwise hide it — they already picked a profile.
  $('welcomeOverlay').hidden = !welcomeOpen;
  if(!$('profilePickerOverlay').hidden) renderProfilePicker();
  $('profileName').value = p ? (p.name || '') : '';
  $('avatarInitial').textContent = p && p.name ? p.name[0].toUpperCase() : '?';
  $('currency').value = p ? p.currency : 'USD';
  $('savingsGoal').value = p ? p.goal : 20;
  renderInsights(entries); renderGoals(); renderBudgets();
  // Payday reminder: first week of the month, no entry yet for this month
  const now=new Date(); const curMonth=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  const hasCur=entries.some(e=>e.month===curMonth);
  $('paydayBanner').hidden = !(p && !hasCur && now.getDate()<=7);
  if(p && !hasCur && now.getDate()<=7) $('paydayText').textContent = `Payday week, ${p.name||'friend'} — add ${monthLabel(curMonth)} so your graphs stay fresh.`;
  $('monthsCount').textContent = entries.length;
  $('profileSub').textContent = entries.length ? `Monthly money profile • ${entries.length} month${entries.length>1?'s':''} tracked • Data stays in your browser` : 'Monthly money profile • All data stays in your browser';

  if(!entries.length){
    $('verdict').className='verdict neutral'; $('verdictIcon').textContent='●';
    $('verdictTitle').textContent='Add your first month to see your verdict';
    $('verdictText').textContent='Enter income, spending, savings and net worth once a month. Green means you\'re ahead. Red means spending beat income, or net worth fell.';
    $('verdictScore').textContent='—';
    ['statIncome','statSpend','statSurplus','statNetWorth','statInvested'].forEach(id=>$(id).textContent='$0');
    $('statRate').textContent='—'; $('statIncomeDelta').textContent='—'; $('statSpendDelta').textContent='—'; $('statNetWorthDelta').textContent='—'; $('trendPill').textContent='—'; $('netWorthNote').textContent='—';
  } else {
    const last = entries[entries.length-1], prev = entries[entries.length-2];
    const s = surplus(last), r = rate(last), nw = netWorth(last);
    $('statIncome').textContent = money(last.income);
    $('statSpend').textContent = money(totalSpend(last));
    $('statSurplus').textContent = (s>=0?'+':'−') + money(Math.abs(s)).slice(0);
    $('statSurplus').className = s>=0?'green-text':'red-text';
    $('statRate').textContent = r.toFixed(1)+'%';
    $('statRate').className = r>=p.goal?'green-text':'red-text';
    $('statRateNote').textContent = `Goal ${p.goal}% • ${r>=p.goal?'✓ on track':'✗ below goal'}`;
    $('statNetWorth').textContent = money(nw);
    $('statNetWorth').className = nw>=0?'green-text':'red-text';
    $('statInvested').textContent = money(last.saved||0);
    animateNum($('statIncome'), last.income); animateNum($('statSpend'), totalSpend(last)); animateNum($('statNetWorth'), nw);
    const delta = (a,b)=> prev? ((a-b)/Math.abs(b||1)*100) : null;
    const dInc = prev? last.income-prev.income : null, dSpend = prev? totalSpend(last)-totalSpend(prev) : null, dNw = prev? nw-netWorth(prev) : null;
    $('statIncomeDelta').textContent = dInc==null?'First month':`${dInc>=0?'▲ +':'▼ '}${money(Math.abs(dInc))} vs last month`;
    $('statSpendDelta').textContent = dSpend==null?'First month':`${dSpend<=0?'▼ ':'▲ +'}${money(Math.abs(dSpend))} vs last month`;
    $('statNetWorthDelta').textContent = dNw==null?'First month':`${dNw>=0?'▲ +':'▼ −'}${money(Math.abs(dNw))} vs last month`;
    $('statNetWorthDelta').className = dNw==null?'':(dNw>=0?'green-text':'red-text');

    const good = s>=0 && (!prev || nw>=netWorth(prev));
    $('verdict').className = 'verdict ' + (good?'green':'red');
    $('verdictIcon').textContent = good?'●':'●';
    $('verdictTitle').textContent = good ? `${monthLabel(last.month)}: You're ahead — keep it green` : `${monthLabel(last.month)}: Red flag — spending beat you this month`;
    $('verdictText').textContent = good
      ? `Surplus ${money(s)} (${r.toFixed(1)}% saved). Net worth ${money(nw)}${prev?`, ${dNw>=0?'up':'down'} ${money(Math.abs(dNw))} vs last month`:''}.`
      : s<0 ? `You spent ${money(Math.abs(s))} more than you earned. Cut one category next month and re-check — the bar will turn green again.`
            : `Surplus is ${money(s)}, but net worth fell ${money(Math.abs(dNw||0))} vs last month. Check debts / asset values.`;
    $('verdictScore').textContent = (s>=0?'+':'−') + money(Math.abs(s));
    $('verdictScore').style.color = s>=0?'#4ade80':'#f87171';
    const greenMonths = entries.filter(e=>surplus(e)>=0).length;
    $('trendPill').textContent = `${greenMonths}/${entries.length} green months`;
    $('netWorthNote').textContent = prev ? (dNw>=0?`▲ Up ${money(dNw)} vs last month — green`:`▼ Down ${money(Math.abs(dNw))} vs last month — red`) : 'Add a second month to see the change.';
    $('breakdownLabel').textContent = monthLabel(last.month) + ' spending';
  }

  // History table
  const body = $('historyBody');
  if(!entries.length){ body.innerHTML = '<tr><td colspan="6" class="empty">No months yet — add your first one.</td></tr>'; }
  else body.innerHTML = [...entries].reverse().map((e,i)=>{
    const prev = entries[entries.length-2-i]; const s=surplus(e), nw=netWorth(e);
    const nwDelta = prev? nw-netWorth(prev) : null;
    return `<tr><td><strong>${monthLabel(e.month)}</strong></td><td>${money(e.income)}</td><td>${money(totalSpend(e))}</td><td><span class="badge ${s>=0?'green':'red'}">${s>=0?'▲ +':'▼ −'}${money(Math.abs(s)).slice(1)}</span></td><td>${money(nw)} ${nwDelta==null?'':`<span class="${nwDelta>=0?'green-text':'red-text'}">${nwDelta>=0?'▲':'▼'}</span>`}</td><td><button class="row-btn" data-edit="${e.month}" title="Edit">✎</button> <button class="row-btn" data-del="${e.month}" title="Delete">🗑</button></td></tr>`;
  }).join('');
  body.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{ const pr=prof(); if(!pr) return; if(confirm('Delete '+monthLabel(b.dataset.del)+'?')){ pr.entries = pr.entries.filter(e=>e.month!==b.dataset.del); save(); render(); }});
  body.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>fillForm(prof().entries.find(e=>e.month===b.dataset.edit)));

  drawCharts(entries);
}

function drawCharts(entries){
  if(typeof Chart==='undefined') return;
  Chart.defaults.color='#94a3b8'; Chart.defaults.font.family='Inter';
  const labels = entries.map(e=>monthLabel(e.month));
  const incomes = entries.map(e=>e.income), spends = entries.map(e=>totalSpend(e));
  const surpluses = entries.map(e=>surplus(e)), nws = entries.map(e=>netWorth(e)), rates = entries.map(e=>rate(e));
  const mk=(id,cfg)=>{ if(charts[id]) charts[id].destroy(); charts[id]=new Chart($(id),cfg); };
  if(entries.length){
    mk('incomeChart',{type:'bar',data:{labels,datasets:[
      {label:'Income',data:incomes,backgroundColor:'#22c55e',borderRadius:6},
      {label:'Spending',data:spends,backgroundColor:entries.map(e=>surplus(e)>=0?'#f97316':'#ef4444'),borderRadius:6},
      {label:'Surplus',type:'line',data:surpluses,borderColor:'#fff',backgroundColor:'#fff',pointBackgroundColor:surpluses.map(v=>v>=0?'#22c55e':'#ef4444'),pointRadius:5,tension:.3}
    ]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{grid:{color:'#22304d'}},x:{grid:{display:false}}}}});
    mk('netWorthChart',{type:'line',data:{labels,datasets:[{label:'Net worth',data:nws,borderColor:'#6366f1',backgroundColor:'rgba(99,102,241,.15)',fill:true,pointBackgroundColor:nws.map((v,i)=>i===0||v>=nws[i-1]?'#22c55e':'#ef4444'),pointRadius:6,tension:.35}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{grid:{color:'#22304d'}},x:{grid:{display:false}}}}});
    const last=entries[entries.length-1];
    mk('breakdownChart',{type:'doughnut',data:{labels:EXPENSE_KEYS.map(([,l])=>l),datasets:[{data:EXPENSE_KEYS.map(([k])=>last.expenses[k]||0),backgroundColor:['#6366f1','#22c55e','#f59e0b','#ef4444','#ec4899','#14b8a6','#a78bfa','#94a3b8'],borderWidth:2,borderColor:'#111a2e'}]},options:{responsive:true,maintainAspectRatio:false,cutout:'62%',plugins:{legend:{position:'bottom',labels:{boxWidth:10,padding:10}}}}});
    mk('savingsChart',{type:'bar',data:{labels,datasets:[{label:'Savings rate %',data:rates,backgroundColor:rates.map(v=>v>=(prof()?prof().goal:20)?'#22c55e':'#ef4444'),borderRadius:6}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{grid:{color:'#22304d'},ticks:{callback:v=>v+'%'}},x:{grid:{display:false}}}}});
  }
}

function fillForm(e){
  $('fMonth').value=e.month; $('fIncome').value=e.income||''; $('fSaved').value=e.saved||''; $('fAssets').value=e.assets||''; $('fDebts').value=e.debts||'';
  document.querySelectorAll('.exp').forEach(i=>i.value=e.expenses[i.dataset.k]||'');
  updateLive(); $('formCard').scrollIntoView({behavior:'smooth'});
}
function updateLive(){
  const spend=[...document.querySelectorAll('.exp')].reduce((s,i)=>s+(parseFloat(i.value)||0),0);
  const inc=num('fIncome'); $('liveSpend').textContent=money(spend);
  const s=inc-spend; const el=$('liveSurplus'); el.textContent=(s>=0?'+':'−')+money(Math.abs(s)); el.className=s>=0?'green-text':'red-text';
}

$('monthForm').addEventListener('submit', ev=>{
  ev.preventDefault();
  const month=$('fMonth').value; if(!month) return;
  const expenses={}; document.querySelectorAll('.exp').forEach(i=>expenses[i.dataset.k]=parseFloat(i.value)||0);
  const entry={month, income:num('fIncome'), saved:num('fSaved'), assets:num('fAssets'), debts:num('fDebts'), expenses};
  const pr=prof(); if(!pr){ alert('Create a profile first.'); return; }
  const idx=pr.entries.findIndex(e=>e.month===month);
  if(idx>=0){ pr.entries[idx]=entry; alert(monthLabel(month)+' updated.'); } else pr.entries.push(entry);
  save(); render(); ev.target.reset(); $('fMonth').value=month; updateLive();
  if(surplus(entry)>=0){ celebrate(); const st=streakCount(sorted()); if(st===3||st===6) setTimeout(()=>alert(`🔥 ${st} green months in a row — amazing streak, ${prof().name||'friend'}!`), 600); }
});
$('clearFormBtn').onclick=()=>{ $('monthForm').reset(); updateLive(); };
document.querySelectorAll('.exp, #fIncome').forEach(i=>i.addEventListener('input', updateLive));
$('addMonthBtn').onclick=()=>{ const d=new Date(); $('fMonth').value=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; $('formCard').scrollIntoView({behavior:'smooth'}); $('fIncome').focus(); };
$('profileName').addEventListener('input', e=>{ const pr=prof(); if(!pr) return; pr.name=e.target.value; save(); $('avatarInitial').textContent=e.target.value ? e.target.value[0].toUpperCase() : '?'; const opt=$('profileSelect').querySelector(`option[value="${pr.id}"]`); if(opt) opt.textContent=e.target.value||'Unnamed profile'; });
$('currency').addEventListener('change', e=>{ const pr=prof(); if(!pr) return; pr.currency=e.target.value; save(); render(); });
$('savingsGoal').addEventListener('input', e=>{ const pr=prof(); if(!pr) return; pr.goal=parseFloat(e.target.value)||20; save(); render(); });
$('profileSelect').addEventListener('change', e=>{ state.currentProfileId=e.target.value; save(); render(); });
$('newProfileBtn').onclick=()=>{ welcomeOpen=true; $('welcomeName').value=''; render(); $('welcomeOverlay').scrollIntoView({behavior:'smooth'}); $('welcomeName').focus(); };
$('clearAllBtn').onclick=()=>{ const pr=prof(); if(!pr) return; if(confirm('Delete ALL months in this profile? This cannot be undone.')){ pr.entries=[]; save(); render(); } };
$('exportBtn').onclick=()=>{
  const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='money-profile.json'; a.click();
};
$('importFile').addEventListener('change', e=>{
  const f=e.target.files[0]; if(!f) return;
  const r=new FileReader(); r.onload=()=>{ try{ const d=JSON.parse(r.result); if(Array.isArray(d.profiles)){ state=d; if(!state.currentProfileId) state.currentProfileId=state.profiles[0].id; save(); render(); alert('Imported '+state.profiles.length+' profile(s).'); } else if(Array.isArray(d.entries)){ const pr=prof(); if(!pr){ alert('Create a profile first.'); return; } pr.entries=d.entries; save(); render(); alert('Imported '+d.entries.length+' months.'); } else alert('That file does not look like a Money Profile export.'); }catch(err){ alert('Could not read that file.'); } }; r.readAsText(f);
});
$('sampleBtn').onclick=()=>{
  const pr=prof(); if(!pr){ alert('Create a profile first.'); return; }
  if(pr.entries.length && !confirm('Load sample data? This will replace your current months. Export first if you want to keep them.')) return;
  pr.entries=[
    {month:'2026-08',income:8200,saved:1200,assets:98000,debts:52000,expenses:{housing:1800,food:650,transport:320,subs:85,shopping:420,fun:380,health:210,other:150}},
    {month:'2026-09',income:8400,saved:1500,assets:101000,debts:50500,expenses:{housing:1800,food:600,transport:300,subs:85,shopping:300,fun:260,health:180,other:120}},
    {month:'2026-10',income:8600,saved:900,assets:102500,debts:49800,expenses:{housing:1850,food:720,transport:410,subs:110,shopping:680,fun:540,health:240,other:310}},
    {month:'2026-11',income:8800,saved:1800,assets:106000,debts:48200,expenses:{housing:1800,food:580,transport:290,subs:85,shopping:250,fun:220,health:150,other:90}},
  ];
  save(); render();
};
// ---- Google Drive sync (wired to this repo) ----
// How it works: the app signs you in to Google in your browser (Google Identity
// Services, drive.file scope — the app can only see the file it creates).
// It stores one private file in your Drive: money-profile.json.
// Same Google account + same file on any device = same data everywhere.
// You need a Google OAuth Client ID (free, see README). Paste it once below;
// it is saved only in this browser's localStorage, never in the repo.
const DRIVE_FILE = 'money-profile.json';
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';
// OAuth Client ID for the "Money Profile" Google Cloud project (money-profile-515919),
// created 2026-11-26. A Client ID is a public identifier, not a secret — it is
// origin-restricted to https://ramuram572.github.io, and the Client Secret is never used here.
const DEFAULT_DRIVE_CLIENT_ID = '534758056260-pmr6hlip5st33imtkqd38fgrt69gmq99.apps.googleusercontent.com';
let driveToken = null, driveFileId = null, driveClient = null;
function driveSetStatus(t){ $('driveStatus').textContent = t; }
function driveSetConnected(connected){
  $('driveSyncBtn').disabled = !connected;
  $('driveLoadBtn').disabled = !connected;
  $('driveDisconnectBtn').disabled = !connected;
  $('driveConnectBtn').disabled = connected;
  $('driveConnectBtn').textContent = connected ? '● Connected' : 'Connect Drive';
  $('driveStatus').className = connected ? 'muted green-text' : 'muted';
}
function driveClientId(){ return ($('driveClientId').value || '').trim(); }
function driveInit(){
  const id = driveClientId();
  if(!id){ alert('Paste your Google OAuth Client ID first — see README, "Google Drive sync setup".'); $('driveClientId').focus(); return false; }
  localStorage.setItem('moneyProfileDriveClientId', id);
  if(typeof google === 'undefined' || !google.accounts){ alert('Google sign-in library did not load. Check your connection and reload.'); return false; }
  driveClient = google.accounts.oauth2.initTokenClient({ client_id: id, scope: DRIVE_SCOPE,
    callback: (resp)=>{ if(resp.access_token){ driveToken = resp.access_token; driveSetConnected(true); driveSetStatus('● Connected to Google Drive. Tap “Sync now” to save, or “Load from Drive” on a new device.'); } else driveSetStatus('Drive sign-in failed — try Connect again.'); } });
  return true;
}
async function driveApi(path, opts={}){
  const r = await fetch('https://www.googleapis.com' + path, { ...opts, headers: { Authorization: 'Bearer ' + driveToken, ...(opts.headers||{}) } });
  if(!r.ok) throw new Error('Drive request failed: ' + r.status);
  return r;
}
async function driveFindFile(){
  const q = encodeURIComponent(`name = '${DRIVE_FILE}' and trashed = false`);
  const r = await driveApi(`/drive/v3/files?q=${q}&spaces=drive&fields=files(id,name,modifiedTime)`);
  const d = await r.json(); return d.files && d.files[0] ? d.files[0] : null;
}
async function driveSyncTo(){
  if(!driveToken){ alert('Connect Drive first.'); return; }
  driveSetStatus('Saving to Drive…');
  const body = JSON.stringify(state, null, 2);
  try{
    const existing = driveFileId ? { id: driveFileId } : await driveFindFile();
    if(existing){
      driveFileId = existing.id;
      await driveApi(`/upload/drive/v3/files/${driveFileId}?uploadType=media`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body });
    } else {
      const meta = { name: DRIVE_FILE, mimeType: 'application/json' };
      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(meta)], { type: 'application/json' }));
      form.append('file', new Blob([body], { type: 'application/json' }));
      const r = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', { method: 'POST', headers: { Authorization: 'Bearer ' + driveToken }, body: form });
      if(!r.ok) throw new Error('Drive upload failed: ' + r.status);
      driveFileId = (await r.json()).id;
    }
    const now = new Date().toLocaleString();
    localStorage.setItem('moneyProfileDriveLastSync', now);
    $('driveLast').textContent = 'Last synced: ' + now;
    driveSetStatus('Synced to Drive ✓ — open the app on any device, Connect Drive with the same Google account, then “Load from Drive”.');
  }catch(e){ driveSetStatus('Sync failed: ' + e.message + ' — try Connect again.'); }
}
async function driveLoadFrom(){
  if(!driveToken){ alert('Connect Drive first.'); return; }
  driveSetStatus('Loading from Drive…');
  try{
    const existing = driveFileId ? { id: driveFileId } : await driveFindFile();
    if(!existing){ driveSetStatus('No money-profile.json in Drive yet — tap “Sync now” on the device that has your data.'); return; }
    driveFileId = existing.id;
    const r = await driveApi(`/drive/v3/files/${driveFileId}?alt=media`);
    const d = await r.json();
    let total = 0;
    if(Array.isArray(d.profiles)){
      total = d.profiles.reduce((s,p)=>s+(p.entries?p.entries.length:0),0);
      if(state.profiles.length && !confirm('Replace the profiles in this browser with the ' + d.profiles.length + ' profile(s) / ' + total + ' months from Drive?')) return;
      state = d; if(!state.currentProfileId) state.currentProfileId = state.profiles[0].id;
    } else if(Array.isArray(d.entries)){
      total = d.entries.length;
      const pr = prof();
      if(pr && pr.entries.length && !confirm('Replace the months in this browser with the ' + total + ' months from Drive?')) return;
      if(pr) pr.entries = d.entries;
    } else throw new Error('That Drive file is not a Money Profile file.');
    welcomeOpen = state.profiles.length === 0;
    save(); render();
    driveSetStatus('Loaded ' + total + ' months from Drive ✓');
  }catch(e){ driveSetStatus('Load failed: ' + e.message); }
}
$('driveConnectBtn').onclick=()=>{ if(driveInit()) driveClient.requestAccessToken(); };
$('driveSyncBtn').onclick=driveSyncTo;
$('driveLoadBtn').onclick=driveLoadFrom;
$('driveDisconnectBtn').onclick=async ()=>{
  if(driveToken){ try{ await fetch('https://oauth2.googleapis.com/revoke?token=' + encodeURIComponent(driveToken), { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }); }catch(e){ /* token expires on its own — disconnect locally anyway */ } }
  driveToken = null; driveFileId = null;
  driveSetConnected(false);
  driveSetStatus('Disconnected from Google Drive. Your data stays safe in Drive as money-profile.json, and in this browser — nothing was deleted. Tap Connect Drive to sync again.');
};
$('driveBtn').onclick=()=>{ $('driveCard').scrollIntoView({behavior:'smooth'}); $('driveClientId').focus(); };
$('driveClientId').addEventListener('input', e=>localStorage.setItem('moneyProfileDriveClientId', e.target.value.trim()));
(()=>{ const savedId = localStorage.getItem('moneyProfileDriveClientId') || DEFAULT_DRIVE_CLIENT_ID; if(savedId) $('driveClientId').value = savedId; const last = localStorage.getItem('moneyProfileDriveLastSync'); if(last) $('driveLast').textContent = 'Last synced: ' + last; })();

$('welcomeStart').onclick=()=>{
  const name = $('welcomeName').value.trim();
  if(!name){ $('welcomeName').focus(); $('welcomeName').placeholder = 'Please enter your name to continue'; return; }
  // If there is one unnamed profile (migrated from the old single-profile
  // version), just name it instead of creating a duplicate.
  if(state.profiles.length===1 && !prof().name){ prof().name=name; }
  else {
    const p = { id:'p'+Date.now(), name, currency:'USD', goal:20, entries:[] };
    state.profiles.push(p); state.currentProfileId = p.id;
  }
  welcomeOpen = false; save(); render();
  history.replaceState(null, '', location.pathname);
  if(driveToken) driveSyncTo(); // save the name to Drive right away if already connected
};
$('welcomeUseExisting').onclick=()=>{
  state.currentProfileId = $('welcomeProfileSelect').value;
  welcomeOpen = false; save(); render();
  history.replaceState(null, '', location.pathname);
};
$('welcomeName').addEventListener('keydown', e=>{ if(e.key==='Enter') $('welcomeStart').click(); });

// ↻ Latest version — get the newest app code without clearing cookies or data,
// then land on the first-time / welcome page, where you pick an existing
// profile or create a new one. localStorage (your profiles/months) survives
// a reload; this just busts the browser cache so GitHub Pages serves the
// latest index.html / app.js / styles.css.
$('refreshAppBtn').onclick=async ()=>{
  const btn = $('refreshAppBtn'); btn.disabled = true; btn.textContent = '↻ Checking…';
  try{ await fetch(location.href.split('?')[0], { cache:'no-store' }); }catch(e){ /* offline — reload anyway */ }
  location.href = location.pathname + '?v=' + Date.now() + '&welcome=1';
};
// 👤 Switch profile — show a popup listing every profile to pick from,
// with "Add new profile" in the same list. No reload, no data cleared.
function renderProfilePicker(){
  const list = $('profilePickerList');
  list.innerHTML = state.profiles.map(x=>`<button class="picker-item" type="button" data-pick="${x.id}"><span class="avatar">${x.name?x.name[0].toUpperCase():'?'}</span><span><strong>${x.name||'Unnamed profile'}</strong><small>${x.entries.length} month${x.entries.length===1?'':'s'} tracked</small></span>${x.id===state.currentProfileId?'<span class="tick">✓</span>':''}</button>`).join('') || '<p class="muted">No profiles yet — add a new one below.</p>';
  list.querySelectorAll('[data-pick]').forEach(b=>b.onclick=()=>{
    state.currentProfileId = b.dataset.pick; welcomeOpen = false; save(); render();
    $('profilePickerOverlay').hidden = true;
    history.replaceState(null, '', location.pathname);
  });
}
function openProfilePicker(){ renderProfilePicker(); $('profilePickerOverlay').hidden = false; }
$('switchProfileBtn').onclick=openProfilePicker;
$('pickerClose').onclick=()=>{ $('profilePickerOverlay').hidden = true; };
$('profilePickerOverlay').addEventListener('click', e=>{ if(e.target===$('profilePickerOverlay')) $('profilePickerOverlay').hidden = true; });
$('pickerAddNew').onclick=()=>{ $('profilePickerOverlay').hidden = true; welcomeOpen=true; $('welcomeName').value=''; render(); $('welcomeName').focus(); };
// ⎋ Logout — back to the first-time / welcome page (pick an existing profile
// or create a new one), and disconnect Drive so the next person can't sync
// to your Drive. Nothing is deleted: profiles stay in this browser and in Drive.
async function doLogout(){
  if(driveToken){ try{ await fetch('https://oauth2.googleapis.com/revoke?token=' + encodeURIComponent(driveToken), { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }); }catch(e){} }
  driveToken = null; driveFileId = null;
  if(typeof driveSetConnected === 'function'){ driveSetConnected(false); driveSetStatus('Disconnected from Google Drive.'); }
  $('profilePickerOverlay').hidden = true;
  welcomeOpen = true; $('welcomeName').value=''; render();
  window.scrollTo({top:0, behavior:'smooth'});
}
$('logoutBtn').onclick=doLogout;
$('pickerLogout').onclick=doLogout;
(()=>{ const el=$('footerVersion'); if(el) el.textContent = 'Version ' + APP_VERSION + ' • Tap “↻ Latest version” at the top to get the newest app'; })();
// Auto update check: if the server has a newer app.js than the one this
// browser cached, show a banner — tapping it reloads to the new version.
// This is what stops a phone getting stuck on an old version.
setTimeout(async ()=>{
  try{
    const r = await fetch('app.js?check=' + Date.now(), { cache:'no-store' });
    const t = await r.text();
    const m = t.match(/APP_VERSION = '([^']+)'/);
    if(m && m[1] !== APP_VERSION){
      const b = document.createElement('div');
      b.style.cssText = 'position:fixed;left:12px;right:12px;bottom:12px;z-index:99;background:#22c55e;color:#052e16;font-weight:700;border-radius:12px;padding:14px 16px;text-align:center;box-shadow:0 10px 30px rgba(0,0,0,.4);cursor:pointer';
      b.textContent = 'New version ' + m[1] + ' is available — tap here to update';
      b.onclick = ()=>{ location.href = location.pathname + '?v=' + Date.now() + '&welcome=1'; };
      document.body.appendChild(b);
    }
  }catch(e){ /* offline — ignore */ }
}, 2000);

// Goals
$('goalForm').addEventListener('submit', e=>{ e.preventDefault(); const pr=prof(); if(!pr) return; const name=$('goalName').value.trim(); const target=parseFloat($('goalTarget').value)||0; if(!name||!target) return; pr.goals.push({id:'g'+Date.now(), name, target, saved:0}); save(); render(); e.target.reset(); });
// Theme — light / dark, remembered in this browser
function applyTheme(t){ document.documentElement.setAttribute('data-theme', t); localStorage.setItem('moneyProfileTheme', t); $('themeBtn').textContent = t==='light' ? '🌙 Dark' : '☀️ Light'; }
$('themeBtn').onclick=()=>{ applyTheme(document.documentElement.getAttribute('data-theme')==='light' ? 'dark' : 'light'); };
applyTheme(localStorage.getItem('moneyProfileTheme') || 'dark');
// Payday banner
$('paydayAddBtn').onclick=()=>{ $('formCard').scrollIntoView({behavior:'smooth'}); $('fIncome').focus(); };
// Share my month — draw a pretty card image and download / share it
$('shareBtn').onclick=async ()=>{
  const p=prof(); const entries=sorted(); if(!entries.length){ alert('Add a month first, then share it.'); return; }
  const last=entries[entries.length-1]; const s=surplus(last), r=rate(last);
  const c=document.createElement('canvas'); c.width=1080; c.height=1080; const x=c.getContext('2d');
  const g=x.createLinearGradient(0,0,1080,1080); g.addColorStop(0,'#0f172a'); g.addColorStop(1,'#312e81'); x.fillStyle=g; x.fillRect(0,0,1080,1080);
  x.fillStyle='#22c55e'; x.font='900 90px Inter, sans-serif'; x.fillText(s>=0?'💚 GREEN MONTH':'🔴 RED MONTH', 70, 160);
  x.fillStyle='#fff'; x.font='800 64px Inter, sans-serif'; x.fillText((p.name||'My') + ' Money Profile', 70, 260);
  x.fillStyle='#94a3b8'; x.font='500 44px Inter, sans-serif'; x.fillText(monthLabel(last.month), 70, 330);
  x.fillStyle='#fff'; x.font='900 120px Inter, sans-serif'; x.fillText((s>=0?'+':'−') + money(Math.abs(s)), 70, 500);
  x.font='600 48px Inter, sans-serif'; x.fillStyle='#a5b4fc'; x.fillText('Surplus  •  ' + r.toFixed(1) + '% saved', 70, 580);
  x.fillText('Net worth  ' + money(netWorth(last)), 70, 660);
  x.fillStyle='#22c55e'; x.font='700 40px Inter, sans-serif'; x.fillText('🔥 ' + streakCount(entries) + ' green month streak  •  Made with Money Profile', 70, 980);
  c.toBlob(async (blob)=>{ const file=new File([blob],'money-profile-month.png',{type:'image/png'});
    if(navigator.canShare && navigator.canShare({files:[file]})){ try{ await navigator.share({files:[file], text:'My money month'}); return; }catch(e){} }
    const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='money-profile-'+last.month+'.png'; a.click();
  }, 'image/png');
};
// PDF report — print view, save as PDF from the print dialog
$('pdfBtn').onclick=()=>window.print();

// Default month = current month
(()=>{ const d=new Date(); $('fMonth').value=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; render(); updateLive(); })();
