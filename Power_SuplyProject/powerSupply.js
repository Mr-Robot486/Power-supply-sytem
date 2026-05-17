// TOAST
function showToast(msg){
    const t=document.getElementById('toast');
    t.textContent=msg;t.classList.add('show');
    setTimeout(()=>t.classList.remove('show'),3000);
  }
  
  // SCROLL REVEAL
  const reveals=document.querySelectorAll('.reveal');
  const obs=new IntersectionObserver(entries=>{
    entries.forEach((e,i)=>{
      if(e.isIntersecting){
        setTimeout(()=>e.target.classList.add('visible'),i*80);
        obs.unobserve(e.target);
      }
    });
  },{threshold:0.1,rootMargin:'0px 0px -30px 0px'});
  reveals.forEach(el=>obs.observe(el));
  //I WILL SYNC THESE INTO ONE
    var revealObs=new IntersectionObserver(function(entries){
      entries.forEach(function(e,i){
        if(e.isIntersecting){
          setTimeout(function(){ e.target.classList.add('in'); },i*80);
          revealObs.unobserve(e.target);
        }
      });
    },{threshold:0.08,rootMargin:'0px 0px -40px 0px'});
    document.querySelectorAll('.reveal,.reveal-l,.reveal-r').forEach(function(el){revealObs.observe(el);});
  // NAV ACTIVE
  const sections=document.querySelectorAll('section[id]');
  const navAs=document.querySelectorAll('.nav-links a');
  window.addEventListener('scroll',()=>{
    let cur='';
    sections.forEach(s=>{if(window.scrollY>=s.offsetTop-80)cur=s.id;});
    navAs.forEach(a=>{
      const href=a.getAttribute('href');
      a.classList.toggle('active',href==='#'+cur||(cur===''&&href==='#'));
    });
  });
  
  // RATING FORM SUBMIT
  document.getElementById('rateForm').addEventListener('submit',function(e){
    e.preventDefault();
    const name=document.getElementById('rname').value;
    const comment=document.getElementById('rcomment').value;
    const ratingEl=document.querySelector('input[name="rating"]:checked');
    if(!ratingEl){showToast('Please select a star rating!');return;}
    const rating=parseInt(ratingEl.value);
  
    // Add new comment card
    const initials=name.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2);
    const stars='★'.repeat(rating)+'★'.repeat(5-rating).replace(/★/g,(s,i)=>i<rating?`<span class="star filled">★</span>`:`<span class="star">★</span>`);
    const starsHtml=[...Array(5)].map((_,i)=>`<span class="star ${i<rating?'filled':''}">★</span>`).join('');
  
    const card=document.createElement('div');
    card.className='comment-card reveal';
    card.innerHTML=`
      <div class="comment-stars">${starsHtml}</div>
      <p class="comment-text">"${comment}"</p>
      <div class="comment-author">
        <div class="author-avatar">${initials}</div>
        <div>
          <div class="author-name">${name}</div>
          <div class="author-label">Just now</div>
        </div>
      </div>`;
    document.getElementById('commentsGrid').appendChild(card);
    setTimeout(()=>card.classList.add('visible'),100);
  
    // Show success
    document.getElementById('rateForm').style.display='none';
    document.getElementById('formSuccess').style.display='block';
    showToast('⚡ Review submitted — thank you!');
  
    // Reset after 4s
    setTimeout(()=>{
      document.getElementById('rateForm').reset();
      document.getElementById('rateForm').style.display='block';
      document.getElementById('formSuccess').style.display='none';
    },4000);
  });
  
  // SUBSCRIBE
  function handleSubscribe(){
    const email=document.getElementById('subEmail').value;
    if(!email||!email.includes('@')){showToast('Please enter a valid email.');return;}
    document.getElementById('subEmail').value='';
    showToast('✅ Subscribed successfully!');
  }
  
  function newsSubscribe(){
    const nsEmail = document.getElementById('nsEmail').value;
    if(!nsEmail || !nsEmail.includes('@')){
      showToast('Please enter a valid email!');
      return;
    }
    document.getElementById('nsEmail').value = '';
    showToast('✅ Subscribed successfully!');
  }
  
  // NAV SMOOTH SCROLL for anchors
  document.querySelectorAll('a[href^="#"]').forEach(a=>{
    a.addEventListener('click',e=>{
      const target=document.querySelector(a.getAttribute('href'));
      if(target){e.preventDefault();target.scrollIntoView({behavior:'smooth'});}
    });
  });

  var barObs=new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(e.isIntersecting){
        e.target.querySelectorAll('.pc-bar-fill,.wsl-bar-fill').forEach(function(bar){
          var w=bar.style.width; bar.style.width='0';
          setTimeout(function(){ bar.style.width=w; },200);
        });
        barObs.unobserve(e.target);
      }
    });
  },{threshold:0.2});
  document.querySelectorAll('.power-grid,.world-stats-list').forEach(function(el){barObs.observe(el);});
  
  // ── ENERGY FLOW CANVAS ───────────────────────────────────────────────
  (function(){
    var canvas=document.getElementById('flowCanvas');
    if(!canvas) return;
    var wrap=canvas.parentElement;
    canvas.width=wrap.offsetWidth;
    canvas.height=wrap.offsetHeight||300;
    var ctx=canvas.getContext('2d');
    var W=canvas.width, H=canvas.height;
  
    var colors=['#00dcb4','#f5c842','#00b4e0','#4ade80'];
    var labels=['Grid','Solar','Hydro','Wind'];
    var particles=[];
  
    // Create nodes
    var nodes=[
      {x:W*0.08,y:H*0.5,label:'SOURCE',color:'#00dcb4'},
      {x:W*0.28,y:H*0.25,label:'SOLAR',color:'#f5c842'},
      {x:W*0.28,y:H*0.75,label:'HYDRO',color:'#00b4e0'},
      {x:W*0.55,y:H*0.5,label:'GRID HUB',color:'#00dcb4'},
      {x:W*0.75,y:H*0.3,label:'HOMES',color:'#4ade80'},
      {x:W*0.75,y:H*0.7,label:'INDUSTRY',color:'#a855f7'},
      {x:W*0.92,y:H*0.5,label:'END USERS',color:'#00dcb4'},
    ];
    var edges=[
      [0,1],[0,2],[1,3],[2,3],[3,4],[3,5],[4,6],[5,6]
    ];
  
    // Spawn particles
    function spawnParticle(edge){
      var from=nodes[edge[0]], to=nodes[edge[1]];
      particles.push({
        x:from.x, y:from.y,
        tx:to.x, ty:to.y,
        progress:0,
        speed:0.004+Math.random()*0.006,
        color:colors[Math.floor(Math.random()*colors.length)],
        size:2+Math.random()*2
      });
    }
    setInterval(function(){
      edges.forEach(function(e){ if(Math.random()<0.35) spawnParticle(e); });
    },300);
  
    function draw(){
      ctx.clearRect(0,0,W,H);
      // Background
      ctx.fillStyle='#080f17';
      ctx.fillRect(0,0,W,H);
  
      // Edges
      edges.forEach(function(e){
        var a=nodes[e[0]], b=nodes[e[1]];
        ctx.beginPath();
        ctx.moveTo(a.x,a.y);
        ctx.lineTo(b.x,b.y);
        ctx.strokeStyle='rgba(0,220,180,0.08)';
        ctx.lineWidth=1.5;
        ctx.stroke();
      });
  
      // Particles
      particles.forEach(function(p,i){
        p.progress+=p.speed;
        p.x=nodes[0].x+(p.tx-nodes[0].x)*0; // recalc from stored
        // Just lerp from start each frame using progress
      });
      // Rebuild approach
      particles=particles.filter(function(p){ return p.progress<1; });
      edges.forEach(function(e){
        if(Math.random()<0.05) spawnParticle(e);
      });
  
      // Draw particles
      particles.forEach(function(p){
        var tx=p.tx, ty=p.ty;
        // find from node
        var fromNode=null;
        edges.forEach(function(e){ if(nodes[e[1]]===nodes.find(function(n){ return n.x===tx&&n.y===ty; })) fromNode=nodes[e[0]]; });
        // Simple draw at interpolated position based on progress
        var sx=p.x, sy=p.y;
        var cx=sx+(tx-sx)*p.progress;
        var cy=sy+(ty-sy)*p.progress;
  
        ctx.beginPath();
        ctx.arc(cx,cy,p.size,0,Math.PI*2);
        ctx.fillStyle=p.color;
        ctx.shadowColor=p.color;
        ctx.shadowBlur=8;
        ctx.fill();
        ctx.shadowBlur=0;
        p.progress+=p.speed;
      });
  
      // Nodes
      nodes.forEach(function(n){
        // Glow
        var grad=ctx.createRadialGradient(n.x,n.y,0,n.x,n.y,24);
        grad.addColorStop(0,n.color+'33');
        grad.addColorStop(1,'transparent');
        ctx.fillStyle=grad;
        ctx.beginPath();
        ctx.arc(n.x,n.y,24,0,Math.PI*2);
        ctx.fill();
        // Node circle
        ctx.beginPath();
        ctx.arc(n.x,n.y,7,0,Math.PI*2);
        ctx.fillStyle=n.color;
        ctx.shadowColor=n.color;
        ctx.shadowBlur=12;
        ctx.fill();
        ctx.shadowBlur=0;
        // Label
        ctx.fillStyle='rgba(90,122,138,0.9)';
        ctx.font='9px "Rajdhani",monospace';
        ctx.textAlign='center';
        ctx.fillText(n.label,n.x,n.y+20);
      });
  
      requestAnimationFrame(draw);
    }
    // Better particle system
    var parts2=[];
    function initFlow(){
      ctx.clearRect(0,0,W,H);
      // Background grid
      ctx.fillStyle='#080f17';
      ctx.fillRect(0,0,W,H);
      ctx.strokeStyle='rgba(0,220,180,0.03)';
      ctx.lineWidth=1;
      for(var x=0;x<W;x+=40){
        ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();
      }
      for(var y=0;y<H;y+=40){
        ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();
      }
      // Draw edges
      edges.forEach(function(e){
        var a=nodes[e[0]],b=nodes[e[1]];
        ctx.beginPath();
        ctx.moveTo(a.x,a.y);
        ctx.lineTo(b.x,b.y);
        ctx.strokeStyle='rgba(0,220,180,0.1)';
        ctx.lineWidth=1.5;
        ctx.setLineDash([4,8]);
        ctx.stroke();
        ctx.setLineDash([]);
      });
      // Nodes
      nodes.forEach(function(n,i){
        var t=Date.now()*0.001;
        var pulse=Math.sin(t*2+i)*3;
        var grd=ctx.createRadialGradient(n.x,n.y,0,n.x,n.y,20+pulse);
        grd.addColorStop(0,n.color+'44');
        grd.addColorStop(1,'transparent');
        ctx.fillStyle=grd;
        ctx.beginPath();ctx.arc(n.x,n.y,20+pulse,0,Math.PI*2);ctx.fill();
        ctx.beginPath();ctx.arc(n.x,n.y,6,0,Math.PI*2);
        ctx.fillStyle=n.color;
        ctx.shadowColor=n.color;ctx.shadowBlur=10;
        ctx.fill();ctx.shadowBlur=0;
        ctx.fillStyle='rgba(90,122,138,0.8)';
        ctx.font='bold 8px Rajdhani,sans-serif';
        ctx.textAlign='center';
        ctx.fillText(n.label,n.x,n.y+18);
      });
      // Particles
      if(parts2.length<60){
        var e=edges[Math.floor(Math.random()*edges.length)];
        var fn=nodes[e[0]],tn=nodes[e[1]];
        parts2.push({fx:fn.x,fy:fn.y,tx:tn.x,ty:tn.y,p:Math.random(),sp:0.003+Math.random()*0.007,c:colors[Math.floor(Math.random()*4)],r:1.5+Math.random()*2});
      }
      parts2=parts2.filter(function(p){return p.p<1;});
      parts2.forEach(function(p){
        var cx=p.fx+(p.tx-p.fx)*p.p;
        var cy=p.fy+(p.ty-p.fy)*p.p;
        ctx.beginPath();ctx.arc(cx,cy,p.r,0,Math.PI*2);
        ctx.fillStyle=p.c;
        ctx.shadowColor=p.c;ctx.shadowBlur=6;
        ctx.fill();ctx.shadowBlur=0;
        p.p+=p.sp;
      });
      requestAnimationFrame(initFlow);
    }
    initFlow();
  
    window.addEventListener('resize',function(){
      canvas.width=wrap.offsetWidth;
      canvas.height=300;
      W=canvas.width;H=canvas.height;
    });
  })();
  
  // ── VIDEO LOADER ─────────────────────────────────────────────────────
  function loadVideo(url){
    var wrap=document.querySelector('.video-main-inner');
    wrap.innerHTML='<iframe src="'+url+'" title="Energy Video" allowfullscreen allow="autoplay" loading="lazy"></iframe>';
    wrap.scrollIntoView({behavior:'smooth',block:'center'});
  }
  
  
  // ── LIVE TICKER — RANDOMIZE VALUES ───────────────────────────────────
  setInterval(function(){
    var updowns=document.querySelectorAll('.ti-up,.ti-down');
    updowns.forEach(function(el){
      var v=(Math.random()*5).toFixed(1);
      if(el.classList.contains('ti-up')) el.textContent='↑ '+v+'%';
      else el.textContent='↓ '+v+'%';
    });
  },8000);

  //=====================
  // AI ASSISTANCE 
  //=====================
var CURR_KEY   = 'ps_current_user';
var ORDERS_KEY = 'ps_orders';
var PRODUCTS_KEY = 'ps_products';
var ELEC_KEY   = 'ps_electricity_payments';
var USERS_KEY  = 'ps_users';
var NOTIFS_KEY = 'ps_admin_notifs';

// ── STATE ───────────────────────────────────────────────────
var panelOpen    = false;
var chatHistory  = [];
var isTyping     = false;
var recognition  = null;
var synthesis    = window.speechSynthesis;
var isListening  = false;
var isSpeaking   = false;
var unreadNotifs = 0;

// ── SIMULATED POWER DATA (real data from localStorage) ──────
var powerData = {
  todayKwh:    parseFloat((Math.random() * 5 + 2).toFixed(1)),
  monthKwh:    Math.floor(Math.random() * 80 + 100),
  unitsLeft:   Math.floor(Math.random() * 40 + 40),
  peakHour:    '18:00',
  dailyAvg:    3.8,
  appliances: [
    { name: 'Refrigerator',  pct: 85, kwh: '3.2', color: '' },
    { name: 'Lighting',      pct: 55, kwh: '2.1', color: '' },
    { name: 'Water Heater',  pct: 70, kwh: '2.7', color: 'yellow' },
    { name: 'TV / Screen',   pct: 35, kwh: '1.3', color: '' },
    { name: 'Phone Charging',pct: 10, kwh: '0.4', color: '' },
  ]
};

// ── INIT ────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', function() {
  initDashboard();
  loadNotifications();
  loadTransactions();
  setupSpeechRecognition();
  addWelcomeMessage();
  updateNotifBadge();

  // Watch for new products from admin
  window.addEventListener('storage', function(e) {
    if (e.key === PRODUCTS_KEY) checkNewProducts(e.oldValue, e.newValue);
    if (e.key === ORDERS_KEY)   loadTransactions();
    if (e.key === ELEC_KEY)     loadTransactions();
    if (e.key === NOTIFS_KEY)   loadNotifications();
  });

  // Auto-watch every 30s
  setInterval(function() {
    loadNotifications();
    loadTransactions();
    simulateLiveData();
  }, 30000);
});

function getUser() { return JSON.parse(localStorage.getItem(CURR_KEY) || 'null'); }
function getOrders() { return JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]'); }
function getProducts() { return JSON.parse(localStorage.getItem(PRODUCTS_KEY) || '[]'); }
function getElecPayments() { return JSON.parse(localStorage.getItem(ELEC_KEY) || '[]'); }

function simulateLiveData() {
  powerData.todayKwh = parseFloat((powerData.todayKwh + Math.random() * 0.15).toFixed(2));
  document.getElementById('smToday').textContent = powerData.todayKwh + ' kWh';
  updateGauge(Math.min((powerData.monthKwh / 200) * 100, 100));
}

// ── PANEL TOGGLE ────────────────────────────────────────────
function togglePanel() {
  panelOpen = !panelOpen;
  document.getElementById('aiPanel').classList.toggle('open', panelOpen);
  document.getElementById('aiTrigger').classList.toggle('open', panelOpen);
  document.getElementById('triggerIcon').textContent = panelOpen ? '✕' : '⚡';
  if (panelOpen) {
    unreadNotifs = 0;
    updateNotifBadge();
    setTimeout(function(){ document.getElementById('chatInput').focus(); }, 400);
  }
}

function updateNotifBadge() {
  var badge = document.getElementById('notifBadge');
  var notifs = JSON.parse(localStorage.getItem(NOTIFS_KEY) || '[]');
  var count  = notifs.length;
  if (count > 0 && !panelOpen) {
    badge.style.display = 'flex';
    badge.textContent = count > 9 ? '9+' : count;
    document.getElementById('alertCount').textContent = count > 0 ? '(' + count + ')' : '';
  } else {
    badge.style.display = 'none';
  }
}

//=========== TOGGLE MENU =============
function toggleNav(){
  document.querySelector('.nav-links').classList.toggle('show-nav');
  console.log("It is shown!");
}

// ── TAB SYSTEM ───────────────────────────────────────────────
function switchTab(id, el) {
  document.querySelectorAll('.qtab').forEach(function(t){ t.classList.remove('active'); });
  document.querySelectorAll('.tab-panel').forEach(function(p){ p.classList.remove('active'); });
  el.classList.add('active');
  document.getElementById('tab-' + id).classList.add('active');
}

// ── DASHBOARD ───────────────────────────────────────────────
function initDashboard() {
  var user = getUser();
  updateGauge((powerData.monthKwh / 200) * 100);
  document.getElementById('gaugeKwh').textContent = powerData.monthKwh + ' kWh';
  document.getElementById('smToday').textContent  = powerData.todayKwh + ' kWh';
  document.getElementById('smBill').textContent   = 'Ksh ' + Math.floor(powerData.monthKwh * 18).toLocaleString();
  document.getElementById('smUnits').textContent  = powerData.unitsLeft;
  document.getElementById('smBillC').textContent  = 'Ksh ' + Math.floor(powerData.monthKwh * 20).toLocaleString() + ' projected';

  // Usage bars
  var barsHtml = '';
  powerData.appliances.forEach(function(a) {
    barsHtml += '<div class="usage-bar-item"><div class="ub-header"><span class="ub-label">' + a.name + '</span><span class="ub-val">' + a.kwh + ' kWh/day</span></div><div class="ub-track"><div class="ub-fill ' + (a.color||'') + '" style="width:0%" data-target="' + a.pct + '%"></div></div></div>';
  });
  document.getElementById('usageBars').innerHTML = barsHtml;
  setTimeout(function(){
    document.querySelectorAll('.ub-fill').forEach(function(b){ b.style.width = b.dataset.target; });
  }, 400);

  // Recommendations
  var recs = generateRecommendations();
  var recsHtml = recs.map(function(r) {
    return '<div class="rec-card ' + (r.type||'') + '"><div class="rc-title">' + r.icon + ' ' + r.title + '</div><div class="rc-body">' + r.body + '</div>' + (r.save ? '<div class="rc-save">💰 Est. saving: ' + r.save + '</div>' : '') + '</div>';
  }).join('');
  document.getElementById('recCards').innerHTML = recsHtml;
}

function updateGauge(pct) {
  pct = Math.min(Math.max(pct, 0), 100);
  var dashoffset = 220 - (220 * pct / 100);
  document.getElementById('gaugeFill').style.strokeDashoffset = dashoffset;
  document.getElementById('gaugeText').textContent = Math.round(pct) + '%';
}

function generateRecommendations() {
  var recs = [
    { icon:'💡', title:'Switch to LED Bulbs', body:'Your lighting usage is above average. Switching to LED bulbs across all rooms could reduce lighting consumption by up to 80%.', save:'Ksh 340/month', type:'warn' },
    { icon:'🌙', title:'Off-Peak Charging', body:'Charge phones, tablets and laptops between 10pm–6am when grid demand and tariffs are at their lowest. Automatic timers make this effortless.', save:'Ksh 180/month', type:'' },
    { icon:'🧊', title:'Refrigerator Efficiency', body:'Your fridge runs constantly and is your top energy consumer. Keep it at 4°C, ensure door seals are tight, and keep it away from direct sunlight.', save:'Ksh 220/month', type:'' },
    { icon:'⚠️', title:'High Usage Alert', body:'Your daily average of ' + powerData.todayKwh + ' kWh is ' + Math.round(((powerData.todayKwh - powerData.dailyAvg)/powerData.dailyAvg)*100) + '% above your historical average. Check for any appliances left running.', save:null, type:'alert' },
    { icon:'📊', title:'Best Time to Use Heavy Appliances', body:'Schedule washing machines, microwaves, and irons for off-peak hours (10am–2pm or after 10pm) to spread grid load and potentially qualify for lower tariffs.', save:'Ksh 150/month', type:'' },
  ];
  return recs;
}

// ── NOTIFICATIONS ────────────────────────────────────────────
function loadNotifications() {
  var notifs = JSON.parse(localStorage.getItem(NOTIFS_KEY) || '[]');
  var products = getProducts();
  var user = getUser();

  var items = [];

  // New products
  products.slice(0, 3).forEach(function(p) {
    items.push({ icon:'🛒', title:'New Product: ' + p.name, body:'Available in the marketplace for Ksh ' + Number(p.price).toLocaleString() + '. Category: ' + (p.category||'General') + '.', time:'Just posted', type:'product unread', id:'prod-'+p.id });
  });

  // System notifs from admin
  notifs.slice(0, 5).forEach(function(n) {
    items.push({ icon: n.type==='new_user'?'👤':n.type==='new_admin'?'⚙':'🔔', title: n.message, body:'', time: n.time ? new Date(n.time).toLocaleTimeString() : 'Recently', type:'unread', id:'notif-'+Math.random() });
  });

  // Power alerts
  if (powerData.unitsLeft < 20) {
    items.unshift({ icon:'⚡', title:'Low Units Alert!', body:'You have only ' + powerData.unitsLeft + ' units remaining. Consider topping up to avoid disconnection.', time:'Now', type:'alert unread', id:'low-units' });
  }

  if (!items.length) {
    document.getElementById('notifList').innerHTML = '<div style="text-align:center;padding:3rem 1rem;color:var(--muted);font-family:\'DM Mono\',monospace;font-size:0.72rem;">No notifications yet</div>';
    return;
  }

  unreadNotifs = items.filter(function(i){ return i.type.includes('unread'); }).length;
  document.getElementById('alertCount').textContent = unreadNotifs > 0 ? '(' + unreadNotifs + ')' : '';

  document.getElementById('notifList').innerHTML = items.map(function(n) {
    return '<div class="notif-item ' + n.type + '" onclick="handleNotifClick(\'' + n.id + '\')">' +
      '<div class="ni-icon">' + n.icon + '</div>' +
      '<div><div class="ni-title">' + n.title + '</div>' +
      (n.body ? '<div class="ni-body">' + n.body + '</div>' : '') +
      '<div class="ni-time">' + n.time + '</div></div></div>';
  }).join('');

  updateNotifBadge();
}

function handleNotifClick(id) {
  if (id.startsWith('prod-')) switchTab('txns', document.querySelectorAll('.qtab')[3]);
}

function checkNewProducts(oldVal, newVal) {
  var old = JSON.parse(oldVal || '[]');
  var nw  = JSON.parse(newVal || '[]');
  if (nw.length > old.length) {
    var newest = nw[0];
    addSystemMessage('🛒 **New product posted!** The admin just added **' + newest.name + '** to the marketplace for Ksh ' + Number(newest.price).toLocaleString() + '. Visit the marketplace to order!');
    speakText('Hey! A new product just appeared in the marketplace. ' + newest.name + ' is now available for ' + Number(newest.price).toLocaleString() + ' Kenyan shillings.');
    loadNotifications();
    if (!panelOpen) { updateNotifBadge(); }
  }
}

// ── TRANSACTIONS ─────────────────────────────────────────────
function loadTransactions() {
  var user = getUser();
  var email = user ? user.email : null;
  var allOrders = getOrders().filter(function(o){ return !email || o.userId === email; });
  var elecPayments = getElecPayments().filter(function(p){ return !email || p.userId === email; });

  // Market orders
  if (!allOrders.length) {
    document.getElementById('txnList').innerHTML = '<div style="text-align:center;padding:1.5rem;color:var(--muted);font-family:\'DM Mono\',monospace;font-size:0.7rem;">No orders yet</div>';
  } else {
    document.getElementById('txnList').innerHTML = allOrders.slice(0,6).map(function(o) {
      var statusColor = o.status==='delivered'?'var(--green)':o.status==='cancelled'?'var(--red)':'var(--yellow)';
      return '<div class="txn-item"><div class="txn-icon">' + (o.emoji||'📦') + '</div><div><div class="txn-name">' + o.product + '</div><div class="txn-sub">' + o.date + ' · <span style="color:' + statusColor + '">' + o.status + '</span></div></div><div class="txn-amount debit">−Ksh ' + Number(o.price*o.qty).toLocaleString() + '</div></div>';
    }).join('');
  }

  // Electricity payments
  if (!elecPayments.length) {
    document.getElementById('elecTxnList').innerHTML = '<div style="text-align:center;padding:1.5rem;color:var(--muted);font-family:\'DM Mono\',monospace;font-size:0.7rem;">No electricity payments yet</div>';
  } else {
    document.getElementById('elecTxnList').innerHTML = elecPayments.slice(0,5).map(function(p) {
      return '<div class="txn-item"><div class="txn-icon">⚡</div><div><div class="txn-name">Electricity Top-Up · ' + p.units.toFixed(1) + ' kWh</div><div class="txn-sub">' + new Date(p.date).toLocaleDateString() + ' · ' + p.method + ' · <span style="color:var(--green)">' + p.status + '</span></div></div><div class="txn-amount debit">−Ksh ' + Number(p.amount).toLocaleString() + '</div></div>';
    }).join('');
  }
}

// ── WELCOME MESSAGE ──────────────────────────────────────────
function addWelcomeMessage() {
  var user = getUser();
  var name = user ? user.firstName : 'there';
  var orders = getOrders().length;
  var products = getProducts().length;

  var welcome = 'Hello ' + name + '! ⚡ I\'m **VOLT**, your PowerSupply AI assistant.\n\n' +
    'I can help you with:\n' +
    '• 📊 **Power usage** — today, this month, and trends\n' +
    '• 🛒 **New products** — ' + products + ' item(s) currently in the marketplace\n' +
    '• 📦 **Your orders** — ' + orders + ' order(s) tracked\n' +
    '• 💡 **Recommendations** — personalized energy-saving tips\n' +
    '• 🔌 **Meter status** — connection, units, and billing\n\n' +
    'You can type or **click the mic** 🎤 to speak to me. What would you like to know?';

  addMessage('ai', welcome);

}

// ── CHAT ─────────────────────────────────────────────────────
function addMessage(role, text) {
  var user = getUser();
  var initials = user ? ((user.firstName||'U')[0] + (user.lastName||'U')[0]).toUpperCase() : 'ME';
  var container = document.getElementById('messages');
  var time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  var isAI = role === 'ai';

  var div = document.createElement('div');
  div.className = 'msg ' + role;
  div.innerHTML =
    '<div class="msg-av">' + (isAI ? '⚡' : initials) + '</div>' +
    '<div class="msg-content">' +
      '<div class="msg-bubble">' + formatMessage(text) + '</div>' +
      '<div class="msg-meta">' + (isAI ? 'VOLT AI' : 'You') + ' · ' + time + '</div>' +
    '</div>';
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;

  // Store in history
  chatHistory.push({ role: isAI ? 'assistant' : 'user', content: text });
}

function addSystemMessage(text) {
  if (!panelOpen) return;
  addMessage('ai', text);
}

function formatMessage(text) {
  // Basic markdown-like formatting
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong style="color:var(--teal)">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>');
}

function showTyping() {
  var container = document.getElementById('messages');
  var div = document.createElement('div');
  div.className = 'msg ai'; div.id = 'typingIndicator';
  div.innerHTML = '<div class="msg-av">⚡</div><div class="msg-content"><div class="typing-indicator"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div></div>';
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

function hideTyping() {
  var t = document.getElementById('typingIndicator');
  if (t) t.remove();
}

function quickPrompt(text) {
  document.getElementById('chatInput').value = text;
  sendMessage();
}

// ── SEND MESSAGE → CLAUDE API ─────────────────────────────────
async function sendMessage() {
  var input = document.getElementById('chatInput');
  var text = input.value.trim();
  if (!text || isTyping) return;

  input.value = '';
  input.style.height = 'auto';
  addMessage('user', text);
  isTyping = true;
  document.getElementById('sendBtn').disabled = true;
  showTyping();

  try {
    var systemPrompt = buildSystemPrompt();
    var response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer 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'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          ...chatHistory.slice(-8),
          { role: 'user', content: text }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    var data = await response.json();
    hideTyping();

    if (data.choices && data.choices[0]) {
      var reply = data.choices[0].message.content;
      addMessage('ai', reply);
      speakText(reply.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1').replace(/<br>/g,' ').replace(/•/g,'').substring(0, 250));
    } else {
      addMessage('ai', '⚠️ Sorry, I couldn\'t get a response right now. Please try again.');
    }
  } catch (err) {
    hideTyping();
    addMessage('ai', '⚠️ Connection error. Please check your internet and try again.\n\nError: ' + err.message);
  }

  isTyping = false;
  document.getElementById('sendBtn').disabled = false;
}

function buildSystemPrompt() {
  var user = getUser();
  var orders = getOrders();
  var products = getProducts();
  var elecPayments = getElecPayments();
  var name = user ? user.firstName + ' ' + (user.lastName||'') : 'Guest';
  var meter = user ? (user.meter || 'MTR-N/A') : 'Unknown';
  var userOrders = user ? orders.filter(function(o){ return o.userId===user.email; }) : [];
  var userElec = user ? elecPayments.filter(function(p){ return p.userId===user.email; }) : [];
  var totalSpent = userOrders.reduce(function(s,o){return s+o.price*o.qty;},0);
  var elecSpent = userElec.reduce(function(s,p){return s+p.amount;},0);
  var pendingOrders = userOrders.filter(function(o){return o.status!=='delivered'&&o.status!=='cancelled';}).length;
  var deliveredOrders = userOrders.filter(function(o){return o.status==='delivered';}).length;

  return `You are VOLT, an intelligent AI assistant built into the PowerSupply energy management system in Kenya. You are sophisticated, professional, friendly, and highly knowledgeable about electricity, energy management, and the PowerSupply platform.

CURRENT USER CONTEXT:
- Name: ${name}
- Meter Number: ${meter}
- Total Orders: ${userOrders.length} (${deliveredOrders} delivered, ${pendingOrders} pending)
- Total Spent on Marketplace: Ksh ${totalSpent.toLocaleString()}
- Electricity Payments: ${userElec.length} payments, Ksh ${elecSpent.toLocaleString()} total

LIVE POWER DATA:
- Today's Usage: ${powerData.todayKwh} kWh (daily average: ${powerData.dailyAvg} kWh)
- This Month: ${powerData.monthKwh} kWh used
- Units Remaining: ${powerData.unitsLeft} kWh
- Estimated Bill: Ksh ${Math.floor(powerData.monthKwh * 18).toLocaleString()}
- Peak Usage Hour: ${powerData.peakHour}
- Top Appliance: Refrigerator (3.2 kWh/day)

MARKETPLACE:
- Products Available: ${products.length}
${products.slice(0,5).map(function(p){return '  • '+p.name+' — Ksh '+Number(p.price).toLocaleString()+' ('+p.category+')'}).join('\n')}

RECENT ORDERS:
${userOrders.slice(0,4).map(function(o){return '  • '+o.id+': '+o.product+' — Ksh '+Number(o.price).toLocaleString()+' ['+o.status+']'}).join('\n') || '  No orders yet'}

ELECTRICITY PAYMENTS:
${userElec.slice(0,3).map(function(p){return '  • '+new Date(p.date).toLocaleDateString()+': Ksh '+Number(p.amount).toLocaleString()+' → '+p.units.toFixed(1)+' kWh ['+p.status+']'}).join('\n') || '  No electricity payments yet'}

YOUR CAPABILITIES:
1. Answer questions about power usage, billing, and meter status
2. Track and explain orders from the marketplace
3. Notify about new products posted by admins
4. Give personalized, data-driven energy-saving recommendations
5. Explain electricity bills, token codes, and WiFi meter connection
6. Help users understand their usage patterns
7. Provide tips on reducing electricity costs in Kenya

PERSONALITY:
- Professional but warm and conversational
- Use specific numbers from the user's data
- Give actionable, practical recommendations
- Be concise but thorough
- Format responses with bullet points and bold text for clarity
- Always mention specific Ksh amounts and kWh numbers
- Speak in the context of Kenya (M-Pesa, KPLC, Kenyan electricity rates ~Ksh 18/kWh)

Respond naturally to the user's question using their real data above. Keep responses under 200 words unless a detailed analysis is requested.`;
}

// ── SPEECH RECOGNITION ───────────────────────────────────────
function setupSpeechRecognition() {
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    document.getElementById('micBtn').title = 'Speech not supported in this browser';
    document.getElementById('micBtn').style.opacity = '0.4';
    return;
  }
  var SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRec();
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.lang = 'en-KE';

  recognition.onstart = function() {
    isListening = true;
    document.getElementById('micBtn').classList.add('listening');
    document.getElementById('voiceWave').classList.add('show');
    document.getElementById('voltStatus').textContent = 'Listening…';
  };

  recognition.onresult = function(e) {
    var transcript = '';
    for (var i = e.resultIndex; i < e.results.length; i++) {
      transcript += e.results[i][0].transcript;
    }
    document.getElementById('chatInput').value = transcript;
  };

  recognition.onend = function() {
    isListening = false;
    document.getElementById('micBtn').classList.remove('listening');
    document.getElementById('voiceWave').classList.remove('show');
    document.getElementById('voltStatus').textContent = 'PowerSupply Intelligence · Online';
    var text = document.getElementById('chatInput').value.trim();
    if (text) sendMessage();
  };

  recognition.onerror = function(e) {
    isListening = false;
    document.getElementById('micBtn').classList.remove('listening');
    document.getElementById('voiceWave').classList.remove('show');
    document.getElementById('voltStatus').textContent = 'Mic error: ' + e.error;
    setTimeout(function(){ document.getElementById('voltStatus').textContent = 'PowerSupply Intelligence · Online'; }, 3000);
  };
}

function toggleSpeech() {
  if (!recognition) { alert('Speech recognition not supported in this browser. Try Chrome.'); return; }
  if (isListening) {
    recognition.stop();
  } else {
    recognition.start();
  }
}

// ── TEXT TO SPEECH ───────────────────────────────────────────
function speakText(text) {
  if (!synthesis) return;
  synthesis.cancel(); // Stop any current speech

  // Clean text for TTS
  var clean = text.replace(/<[^>]+>/g, '').replace(/[•\*#]/g, '').trim();
  if (!clean) return;

  var utterance = new SpeechSynthesisUtterance(clean);
  utterance.rate = 1.0;
  utterance.pitch = 1.0;
  utterance.volume = 0.85;
  utterance.lang = 'en-KE';

  // Pick a good voice if available
  var voices = synthesis.getVoices();
  var preferred = voices.find(function(v){
    return v.lang.includes('en') && (v.name.includes('Google') || v.name.includes('Female') || v.name.includes('Samantha'));
  }) || voices.find(function(v){ return v.lang.includes('en'); });
  if (preferred) utterance.voice = preferred;

  utterance.onstart = function() {
    isSpeaking = true;
    document.getElementById('speakWave').classList.add('show');
    document.getElementById('voltStatus').textContent = 'Speaking…';
  };
  utterance.onend = function() {
    isSpeaking = false;
    document.getElementById('speakWave').classList.remove('show');
    document.getElementById('voltStatus').textContent = 'PowerSupply Intelligence · Online';
  };

  synthesis.speak(utterance);
}

// Load voices (needed for some browsers)
if (synthesis) {
  synthesis.onvoiceschanged = function() { synthesis.getVoices(); };
}

// ── CLEAR CHAT ───────────────────────────────────────────────
function clearChat() {
  document.getElementById('messages').innerHTML = '';
  chatHistory = [];
  addWelcomeMessage();
}
