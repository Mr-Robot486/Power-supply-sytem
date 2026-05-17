const PRODUCTS_KEY = 'ps_products';
let products = JSON.parse(localStorage.getItem(PRODUCTS_KEY) || '[]');
let nextId = products.length ? Math.max(...products.map(p=>p.id)) + 1 : 1;
let selectedBadge = '';
let deleteTargetId = null;
let editingId = null;

// ═══════════════════════════════════════════
//  CONSTANTS
// ═══════════════════════════════════════════
var ADMIN_KEY='ps_admin_session';
var USERS_KEY='ps_users';
var ORDERS_KEY='ps_orders';
var ADMIN_CREDS={username:'admin',password:'admin123'};

// ═══════════════════════════════════════════
//  INIT
// ═══════════════════════════════════════════
window.addEventListener('DOMContentLoaded',function(){
  // Seed sample data
  seedData();
  if(localStorage.getItem(ADMIN_KEY)==='true'){
    showAdmin();
  }
});

function seedData(){
  var users=getUsers();
  if(users.length<2){
    var sample=[
      {email:'demo@ps.com',firstName:'Demo',lastName:'User',phone:'+254700000000',meter:'MTR-2024-DEMO01',password:'demo123',createdAt:'2025-01-15T10:00:00Z'},
      {email:'amina@gmail.com',firstName:'Amina',lastName:'Mwangi',phone:'+254711223344',meter:'MTR-2024-001234',password:'pass123',createdAt:'2025-02-20T08:30:00Z'},
      {email:'james@gmail.com',firstName:'James',lastName:'Odhiambo',phone:'+254722334455',meter:'MTR-2024-005678',password:'pass456',createdAt:'2025-03-05T14:00:00Z'},
      {email:'fatuma@mail.com',firstName:'Fatuma',lastName:'Karimi',phone:'+254733445566',meter:'MTR-2024-009012',password:'fat123',createdAt:'2025-04-01T09:00:00Z'},
    ];
    localStorage.setItem(USERS_KEY,JSON.stringify(sample));
  }
  var orders=getOrders();
  if(orders.length<3){
    var sampleOrders=[
      {id:'ORD-001',userId:'demo@ps.com',product:'Laptop',category:'Computers',emoji:'💻',price:20000,qty:1,status:'delivered',date:'2025-03-10',ref:'TXN-192837'},
      {id:'ORD-002',userId:'amina@gmail.com',product:'iPhone 17 Pro Max',category:'Phones',emoji:'📱',price:70000,qty:1,status:'delivered',date:'2025-03-15',ref:'TXN-283746'},
      {id:'ORD-003',userId:'james@gmail.com',product:'Meter Unit',category:'Power',emoji:'⚡',price:7000,qty:2,status:'shipped',date:'2025-04-01',ref:'TXN-374651'},
      {id:'ORD-004',userId:'fatuma@mail.com',product:'Gen-6 Meter Unit',category:'Power',emoji:'🔌',price:10000,qty:1,status:'processing',date:'2025-04-18',ref:'TXN-465820'},
      {id:'ORD-005',userId:'amina@gmail.com',product:'Solar Panel Kit',category:'Power',emoji:'☀️',price:45000,qty:1,status:'pending',date:'2025-04-25',ref:'TXN-556931'},
      {id:'ORD-006',userId:'demo@ps.com',product:'Wireless Charger',category:'Accessories',emoji:'🔋',price:3500,qty:2,status:'delivered',date:'2025-04-22',ref:'TXN-647042'},
    ];
    localStorage.setItem(ORDERS_KEY,JSON.stringify(sampleOrders));
  }
}

function getUsers(){return JSON.parse(localStorage.getItem(USERS_KEY)||'[]');}
function saveUsers(u){localStorage.setItem(USERS_KEY,JSON.stringify(u));}
function getOrders(){return JSON.parse(localStorage.getItem(ORDERS_KEY)||'[]');}
function saveOrders(o){localStorage.setItem(ORDERS_KEY,JSON.stringify(o));}

// ═══════════════════════════════════════════
//  AUTH
// ═══════════════════════════════════════════
function adminLogin() {
    var u = document.getElementById('adminUser').value.trim();
    var p = document.getElementById('adminPass').value;
  
    document.getElementById('adminLoginErr').classList.remove('show');
  
    if (!u || !p) {
      document.getElementById('adminLoginErr').textContent = 'Please enter both username and password';
      document.getElementById('adminLoginErr').classList.add('show');
      return;
    }
  
    // 1. Check super-admin (hardcoded fallback)
    var storedCreds = JSON.parse(localStorage.getItem('ps_admin_creds') || '{"username":"admin","password":"admin123"}');
    var isSuperAdmin = (u === storedCreds.username && p === storedCreds.password);
  
    // 2. Check all registered admins from admin-register.html
    var registeredAdmins = JSON.parse(localStorage.getItem('ps_admin_accounts') || '[]');
    var foundAdmin = registeredAdmins.find(function(a) {
      // Allow login by email OR first name (case-insensitive)
      var matchUser = (a.email.toLowerCase() === u.toLowerCase()) ||
                      (a.firstName.toLowerCase() === u.toLowerCase()) ||
                      ((a.firstName + ' ' + a.lastName).toLowerCase() === u.toLowerCase());
      return matchUser && a.password === p && a.status === 'active';
    });
  
    // 3. Also check ps_all_admin_creds array (set by register page)
    var allCreds = JSON.parse(localStorage.getItem('ps_all_admin_creds') || '[]');
    var credMatch = allCreds.find(function(c) {
      return (c.username.toLowerCase() === u.toLowerCase() ||
              (c.username2 && c.username2 === u.toLowerCase())) &&
              c.password === p;
    });
  
    if (isSuperAdmin || foundAdmin || credMatch) {
      // Store session
      localStorage.setItem('ps_admin_session', 'true');
  
      // Store who is logged in (for display)
      var loggedInAdmin = foundAdmin || { firstName: 'Super', lastName: 'Admin', email: u, role: 'super_admin', category: 'System Administrator' };
      localStorage.setItem('ps_admin_current', JSON.stringify(loggedInAdmin));
  
      showAdmin(loggedInAdmin);
      showToast('Welcome back, ' + loggedInAdmin.firstName + ' ⚙', 'success');
    } else {
      document.getElementById('adminLoginErr').textContent = 'Invalid credentials. Check your email and password.';
      document.getElementById('adminLoginErr').classList.add('show');
      setTimeout(function() { document.getElementById('adminLoginErr').classList.remove('show'); }, 4000);
    }
  }
document.addEventListener('keydown',function(e){if(e.key==='Enter') adminLogin();});

function adminLogout() {
    localStorage.removeItem('ps_admin_session');
    localStorage.removeItem('ps_admin_current');
    document.getElementById('adminGate').style.display = 'flex';
    document.getElementById('adminMain').style.display = 'none';
    // Clear prefill on manual logout
    localStorage.removeItem('ps_admin_prefill');
    showToast('Logged out successfully', 'info');
  }
// Find your existing showAdmin() function and add this at the start:
function showAdmin(adminObj) {
    document.getElementById('adminGate').style.display = 'none';
    document.getElementById('adminMain').style.display = 'flex';
  
    // Update sidebar with real admin name if adminObj provided
    if (adminObj) {
      var nameEl = document.querySelector('.admin-name');
      var roleEl = document.querySelector('.admin-role');
      var avEl   = document.querySelector('.admin-av');
      if (nameEl) nameEl.textContent = adminObj.firstName + ' ' + (adminObj.lastName || '');
      if (roleEl) roleEl.textContent = adminObj.categoryLabel || adminObj.role || 'Admin';
      if (avEl)   avEl.textContent   = (adminObj.firstName[0] + (adminObj.lastName ? adminObj.lastName[0] : '')).toUpperCase();
    }
  
    loadAdminDashboard();
  
    // Clear any prefill hint
    localStorage.removeItem('ps_admin_prefill');
  }

  function loadPrefill() {
    var prefill = JSON.parse(localStorage.getItem('ps_admin_prefill') || 'null');
    if (prefill && prefill.username) {
      var userInput = document.getElementById('adminUser');
      if (userInput) {
        userInput.value = prefill.username;
        userInput.style.borderColor = 'var(--yellow)';
        // Show a helpful hint
        var hint = document.querySelector('.alc-hint');
        if (hint) hint.textContent = '✓ Email pre-filled from registration. Enter your password to login.';
      }
    }
  }

// ═══════════════════════════════════════════
//  LOAD DASHBOARD
// ═══════════════════════════════════════════
function loadAdminDashboard(){
  var users=getUsers();
  var orders=getOrders();
  var delivered=orders.filter(function(o){return o.status==='delivered';});
  var pending=orders.filter(function(o){return o.status!=='delivered'&&o.status!=='cancelled';});
  var revenue=delivered.reduce(function(s,o){return s+o.price*o.qty;},0);

  // Stats
  document.getElementById('adStatUsers').textContent=users.length;
  document.getElementById('adStatOrders').textContent=orders.length;
  document.getElementById('adStatDelivered').textContent=delivered.length;
  document.getElementById('adStatRevenue').textContent=Math.floor(revenue/1000)+'K';

  // Sidebar badges
  document.getElementById('sbAllOrders').textContent=orders.length;
  document.getElementById('sbCompleted').textContent=delivered.length;
  document.getElementById('sbPending').textContent=pending.length;
  document.getElementById('sbUsers').textContent=users.length;

  // Notifications
  loadNotifications(users);
  // Render all sub-pages
  renderAllOrders();renderCompletedAdmin();renderPendingAdmin();renderUsers();
  // Recent previews
  renderRecentPreview(orders,users);
  // Charts
  drawAdminChart(orders);drawStatusChart(orders);

}

function loadNotifications(users){
  var notifs=JSON.parse(localStorage.getItem('ps_admin_notifs')||'[]');
  // Add user signups as notifs
  users.slice(-5).reverse().forEach(function(u){
    var exists=notifs.find(function(n){return n.message&&n.message.includes(u.email);});
    if(!exists) notifs.unshift({type:'user',message:'New user: '+u.firstName+' '+u.lastName+' ('+u.email+')',time:u.createdAt});
  });
  var orders=getOrders();
  orders.filter(function(o){return o.status==='pending';}).slice(0,3).forEach(function(o){
    var exists=notifs.find(function(n){return n.message&&n.message.includes(o.id);});
    if(!exists) notifs.push({type:'order',message:'Order '+o.id+' is pending: '+o.product,time:o.date+'T00:00:00Z'});
  });
  document.getElementById('notifCount').textContent=notifs.length;
  document.getElementById('notifList').innerHTML=notifs.slice(0,8).map(function(n){
    return '<div class="notif-item"><div class="ni-dot"></div><div><div class="ni-text">'+n.message+'</div><div class="ni-time">'+new Date(n.time||Date.now()).toLocaleDateString()+'</div></div></div>';
  }).join('')||'<div style="padding:1.2rem;font-size:0.76rem;color:var(--muted);text-align:center;">No notifications</div>';
}

function toggleNotifPanel(){
  document.getElementById('notifPanel').classList.toggle('show');
}
document.addEventListener('click',function(e){
  if(!e.target.closest('#notifPanel')&&!e.target.closest('#notifBtn')) document.getElementById('notifPanel').classList.remove('show');
});

function renderRecentPreview(orders,users){
  var recentOrders=orders.slice(-5).reverse();
  document.getElementById('recentOrdersPreview').innerHTML=recentOrders.length?recentOrders.map(function(o){
    return '<div style="display:flex;align-items:center;gap:0.8rem;padding:0.6rem 0;border-bottom:1px solid var(--border);font-size:0.76rem;">'+
    '<div style="width:26px;height:26px;background:var(--surface2);display:flex;align-items:center;justify-content:center;font-size:0.8rem;flex-shrink:0;">'+o.emoji+'</div>'+
    '<div style="flex:1;"><div style="font-family:\'Rajdhani\',sans-serif;font-weight:700;">'+o.product+'</div><div style="font-size:0.63rem;color:var(--muted);">'+o.userId+'</div></div>'+
    '<span class="status-badge s-'+o.status+'">'+o.status+'</span></div>';
  }).join(''):'<div style="padding:1.5rem;text-align:center;color:var(--muted);font-size:0.78rem;">No orders yet</div>';

  var recentUsers=users.slice(-5).reverse();
  document.getElementById('recentUsersPreview').innerHTML=recentUsers.map(function(u){
    var userOrders=orders.filter(function(o){return o.userId===u.email;}).length;
    return '<div style="display:flex;align-items:center;gap:0.8rem;padding:0.6rem 0;border-bottom:1px solid var(--border);font-size:0.76rem;">'+
    '<div style="width:26px;height:26px;border-radius:50%;background:linear-gradient(135deg,var(--yellow),var(--orange));display:flex;align-items:center;justify-content:center;font-size:0.65rem;font-weight:700;color:#000;flex-shrink:0;">'+u.firstName[0]+u.lastName[0]+'</div>'+
    '<div style="flex:1;"><div style="font-family:\'Rajdhani\',sans-serif;font-weight:700;">'+u.firstName+' '+u.lastName+'</div><div style="font-size:0.63rem;color:var(--muted);">'+u.email+'</div></div>'+
    '<span style="font-family:\'Orbitron\',monospace;font-size:0.6rem;color:var(--teal);">'+userOrders+' orders</span></div>';
  }).join('');
}

// ═══════════════════════════════════════════
//  RENDER ALL ORDERS
// ═══════════════════════════════════════════
function renderAllOrders(){
  var orders=getOrders();
  var q=(document.getElementById('allOrdersSearch').value||'').toLowerCase();
  var f=document.getElementById('allOrdersFilter').value||'all';
  var s=document.getElementById('allOrdersSort').value||'newest';
  var list=orders.filter(function(o){
    var mf=f==='all'||o.status===f;
    var mq=!q||o.product.toLowerCase().includes(q)||o.id.toLowerCase().includes(q)||o.userId.toLowerCase().includes(q);
    return mf&&mq;
  });
  if(s==='oldest') list=list.slice().reverse();
  else if(s==='price-high') list.sort(function(a,b){return b.price-a.price;});
  else if(s==='price-low') list.sort(function(a,b){return a.price-b.price;});
  else list=list.slice().reverse();
  document.getElementById('allOrdersCount').textContent=list.length;
  var c=document.getElementById('allOrdersContainer');
  if(!list.length){c.innerHTML='<div class="empty-state"><div class="es-icon">📦</div><p>No orders found.</p></div>';return;}
  c.innerHTML='<div style="overflow-x:auto;"><table><thead><tr><th>Order ID</th><th>Customer</th><th>Product</th><th>Total</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead><tbody>'+
  list.map(function(o){return '<tr>'+
    '<td class="td-id">'+o.id+'</td>'+
    '<td style="font-size:0.76rem;color:var(--muted);">'+o.userId+'</td>'+
    '<td><div class="td-product"><div class="td-prod-icon">'+o.emoji+'</div><div><div class="td-prod-name">'+o.product+'</div><div class="td-prod-sub">'+o.category+' · Qty: '+o.qty+'</div></div></div></td>'+
    '<td class="td-price">Ksh '+(o.price*o.qty).toLocaleString()+'</td>'+
    '<td><span class="status-badge s-'+o.status+'">'+o.status+'</span></td>'+
    '<td class="td-date">'+o.date+'</td>'+
    '<td>'+statusButtons(o.id,o.status)+'</td>'+
  '</tr>';}).join('')+'</tbody></table></div>';
}

function statusButtons(id,status){
  var btns='';
  if(status==='pending') btns+='<button class="action-btn green-btn" onclick="updateStatus(\''+id+'\',\'processing\')">Process</button>';
  if(status==='processing') btns+='<button class="action-btn green-btn" onclick="updateStatus(\''+id+'\',\'shipped\')">Ship</button>';
  if(status==='shipped') btns+='<button class="action-btn green-btn" onclick="updateStatus(\''+id+'\',\'delivered\')">Deliver</button>';
  if(status!=='delivered'&&status!=='cancelled') btns+='<button class="action-btn danger" onclick="updateStatus(\''+id+'\',\'cancelled\')">Cancel</button>';
  return btns||'<span style="font-size:0.65rem;color:var(--muted);">'+status+'</span>';
}

function updateStatus(id,newStatus){
  var orders=getOrders();
  var idx=orders.findIndex(function(o){return o.id===id;});
  if(idx>-1){
    orders[idx].status=newStatus;
    saveOrders(orders);
    loadAdminDashboard();
    showToast('Order '+id+' → '+newStatus,'success');
  }
}

// ═══════════════════════════════════════════
//  RENDER COMPLETED
// ═══════════════════════════════════════════
function renderCompletedAdmin(){
  var q=(document.getElementById('compSearch').value||'').toLowerCase();
  var list=getOrders().filter(function(o){return o.status==='delivered'&&(!q||o.product.toLowerCase().includes(q)||o.id.toLowerCase().includes(q));});
  var rev=list.reduce(function(s,o){return s+o.price*o.qty;},0);
  var avg=list.length?Math.floor(rev/list.length):0;
  document.getElementById('compAdTotal').textContent=list.length;
  document.getElementById('compAdRevenue').textContent=Math.floor(rev/1000)+'K';
  document.getElementById('compAdAvg').textContent=Math.floor(avg/1000)+'K';
  document.getElementById('compAdCount').textContent=list.length;
  var c=document.getElementById('compAdContainer');
  if(!list.length){c.innerHTML='<div class="empty-state"><div class="es-icon">✅</div><p>No completed orders.</p></div>';return;}
  c.innerHTML='<div style="overflow-x:auto;"><table><thead><tr><th>Order ID</th><th>Customer</th><th>Product</th><th>Revenue</th><th>Date</th><th>Ref</th></tr></thead><tbody>'+
  list.map(function(o){return '<tr><td class="td-id">'+o.id+'</td><td style="font-size:0.76rem;color:var(--muted);">'+o.userId+'</td><td><div class="td-product"><div class="td-prod-icon">'+o.emoji+'</div><div><div class="td-prod-name">'+o.product+'</div><div class="td-prod-sub">'+o.category+'</div></div></div></td><td class="td-price">Ksh '+(o.price*o.qty).toLocaleString()+'</td><td class="td-date">'+o.date+'</td><td class="td-id">'+(o.ref||'—')+'</td></tr>';}).join('')+'</tbody></table></div>';
}

// ═══════════════════════════════════════════
//  RENDER PENDING
// ═══════════════════════════════════════════
function renderPendingAdmin(){
  var q=(document.getElementById('pendSearch').value||'').toLowerCase();
  var list=getOrders().filter(function(o){return ['pending','processing','shipped'].includes(o.status)&&(!q||o.product.toLowerCase().includes(q)||o.id.toLowerCase().includes(q));});
  document.getElementById('pendAdCount').textContent=list.length;
  var c=document.getElementById('pendAdContainer');
  if(!list.length){c.innerHTML='<div class="empty-state"><div class="es-icon">🎉</div><p>No pending orders! All caught up.</p></div>';return;}
  c.innerHTML='<div style="overflow-x:auto;"><table><thead><tr><th>Order ID</th><th>Customer</th><th>Product</th><th>Price</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead><tbody>'+
  list.map(function(o){return '<tr><td class="td-id">'+o.id+'</td><td style="font-size:0.76rem;color:var(--muted);">'+o.userId+'</td><td><div class="td-product"><div class="td-prod-icon">'+o.emoji+'</div><div><div class="td-prod-name">'+o.product+'</div><div class="td-prod-sub">'+o.category+' · Qty: '+o.qty+'</div></div></div></td><td class="td-price">Ksh '+(o.price*o.qty).toLocaleString()+'</td><td><span class="status-badge s-'+o.status+'">'+o.status+'</span></td><td class="td-date">'+o.date+'</td><td>'+statusButtons(o.id,o.status)+'</td></tr>';}).join('')+'</tbody></table></div>';
}

// ═══════════════════════════════════════════
//  RENDER USERS
// ═══════════════════════════════════════════
function renderUsers(){
  var users=getUsers();
  var orders=getOrders();
  var q=(document.getElementById('usersSearch').value||'').toLowerCase();
  var sort=document.getElementById('usersSort').value||'newest';
  var list=users.filter(function(u){return !q||(u.firstName+' '+u.lastName).toLowerCase().includes(q)||u.email.toLowerCase().includes(q)||u.phone.includes(q);});
  if(sort==='oldest') list=list.slice();
  else if(sort==='name') list.sort(function(a,b){return a.firstName.localeCompare(b.firstName);});
  else if(sort==='orders') list.sort(function(a,b){return orders.filter(function(o){return o.userId===b.email;}).length-orders.filter(function(o){return o.userId===a.email;}).length;});
  else list=list.slice().reverse();
  var thisMonth=new Date(); thisMonth.setDate(1);
  var withOrders=users.filter(function(u){return orders.some(function(o){return o.userId===u.email;});}).length;
  var newThisMonth=users.filter(function(u){return new Date(u.createdAt)>=thisMonth;}).length;
  document.getElementById('usrTotal').textContent=users.length;
  document.getElementById('usrActive').textContent=users.length;
  document.getElementById('usrWithOrders').textContent=withOrders;
  document.getElementById('usrNew').textContent=newThisMonth;
  document.getElementById('usersCount').textContent=list.length;
  var c=document.getElementById('usersContainer');
  if(!list.length){c.innerHTML='<div class="empty-state"><div class="es-icon">👥</div><p>No users found.</p></div>';return;}
  c.innerHTML='<div style="overflow-x:auto;"><table><thead><tr><th>User</th><th>Email</th><th>Phone</th><th>Meter No.</th><th>Orders</th><th>Joined</th><th>Status</th><th>Actions</th></tr></thead><tbody>'+
  list.map(function(u){
    var uOrders=orders.filter(function(o){return o.userId===u.email;}).length;
    var initials=(u.firstName?u.firstName[0]:'?')+(u.lastName?u.lastName[0]:'');
    return '<tr>'+
    '<td><div class="td-product"><div style="width:30px;height:30px;border-radius:50%;background:linear-gradient(135deg,var(--yellow),var(--orange));display:flex;align-items:center;justify-content:center;font-size:0.65rem;font-weight:700;color:#000;flex-shrink:0;">'+initials.toUpperCase()+'</div><div><div class="td-prod-name">'+u.firstName+' '+u.lastName+'</div></div></div></td>'+
    '<td style="font-size:0.74rem;color:var(--muted);">'+u.email+'</td>'+
    '<td style="font-size:0.74rem;color:var(--muted);">'+(u.phone||'—')+'</td>'+
    '<td class="td-id">'+(u.meter||'—')+'</td>'+
    '<td style="font-family:\'Orbitron\',monospace;font-size:0.72rem;color:var(--teal);">'+uOrders+'</td>'+
    '<td class="td-date">'+new Date(u.createdAt).toLocaleDateString()+'</td>'+
    '<td><span class="status-badge s-active">Active</span></td>'+
    '<td><button class="action-btn" onclick="viewUser(\''+u.email+'\')">View</button><button class="action-btn danger" onclick="deleteUser(\''+u.email+'\')">Delete</button></td>'+
    '</tr>';
  }).join('')+'</tbody></table></div>';
}

function viewUser(email){
  var users=getUsers();
  var u=users.find(function(x){return x.email===email;});
  var orders=getOrders().filter(function(o){return o.userId===email;});
  if(u) showToast(u.firstName+' '+u.lastName+' — '+orders.length+' orders — Meter: '+(u.meter||'N/A'),'info');
}

function deleteUser(email){
  if(!confirm('Delete user '+email+'? This cannot be undone.')) return;
  var users=getUsers().filter(function(u){return u.email!==email;});
  saveUsers(users);
  showToast('User deleted: '+email,'warn');
  loadAdminDashboard();
}

// ═══════════════════════════════════════════
//  ADD ORDER MODAL
// ═══════════════════════════════════════════
function openAddOrderModal(){
  var users=getUsers();
  var select=document.getElementById('moUser');
  select.innerHTML=users.map(function(u){return '<option value="'+u.email+'">'+u.firstName+' '+u.lastName+' ('+u.email+')</option>';}).join('');
  document.getElementById('addOrderModal').classList.add('show');
}
function closeModalA(){
  const remove = document.getElementById('addOrderModal');
  remove.classList.remove('show');
}

function submitNewOrder(){
  const userId=document.getElementById('moUser').value;
  const prod=document.getElementById('moProd').value.trim();
  const cat=document.getElementById('moCat').value;
  const price=parseFloat(document.getElementById('moPrice').value);
  const qty=parseInt(document.getElementById('moQty').value)||1;
  const status=document.getElementById('moStatus').value;
  const emoji=document.getElementById('moEmoji').value||'📦';
  if(!prod||!price){showToast('Product name and price are required','error');return;}
  const orders=getOrders();
  const newId='ORD-'+String(orders.length+1).padStart(3,'0');
  orders.push({
    id:newId,userId:userId,product:prod,category:cat,emoji:emoji,
    price:price,qty:qty,status:status,
    date:new Date().toISOString().split('T')[0],
    ref:'TXN-'+Math.floor(100000+Math.random()*900000)
  });
  saveOrders(orders);
  loadAdminDashboard();
  showToast('Order '+newId+' created for '+userId,'success');
  closeModalA();
}

// ═══════════════════════════════════════════
//  CHARTS
// ═══════════════════════════════════════════
function drawAdminChart(orders){
  var canvas=document.getElementById('adminChart');
  if(!canvas||!canvas.getContext) return;
  var ctx=canvas.getContext('2d');
  canvas.width=canvas.parentElement.offsetWidth-48;canvas.height=160;
  var W=canvas.width,H=canvas.height;
  var months=['Nov','Dec','Jan','Feb','Mar','Apr'];
  var delivered=orders.filter(function(o){return o.status==='delivered';});
  var data=months.map(function(_,i){return i===months.length-1?delivered.reduce(function(s,o){return s+o.price*o.qty;},0)/1000:Math.floor(Math.random()*120+30);});
  var max=Math.max.apply(null,data)||1;
  ctx.clearRect(0,0,W,H);
  var pad={t:20,b:28,l:8,r:8};
  var bW=(W-pad.l-pad.r)/months.length;
  ctx.strokeStyle='rgba(245,200,66,0.06)';ctx.lineWidth=1;
  for(var i=0;i<4;i++){var y=pad.t+(H-pad.t-pad.b)*i/3;ctx.beginPath();ctx.moveTo(pad.l,y);ctx.lineTo(W-pad.r,y);ctx.stroke();}
  data.forEach(function(v,i){
    var bH=(v/max)*(H-pad.t-pad.b);
    var x=pad.l+i*bW+bW*0.15,y=H-pad.b-bH;
    var grad=ctx.createLinearGradient(0,y,0,H-pad.b);
    grad.addColorStop(0,'rgba(245,200,66,0.8)');grad.addColorStop(1,'rgba(245,146,50,0.2)');
    ctx.fillStyle=grad;ctx.fillRect(x,y,bW*0.7,bH);
    ctx.fillStyle='rgba(90,112,128,0.8)';ctx.font='9px Rajdhani,sans-serif';ctx.textAlign='center';
    ctx.fillText(months[i],x+bW*0.35,H-pad.b+14);
    ctx.fillStyle='rgba(245,200,66,0.9)';
    ctx.fillText(Math.round(v)+'K',x+bW*0.35,y-5);
  });
}

function drawStatusChart(orders){
  var canvas=document.getElementById('statusChart');
  if(!canvas||!canvas.getContext) return;
  var ctx=canvas.getContext('2d');
  canvas.width=canvas.parentElement.offsetWidth-48;canvas.height=160;
  var W=canvas.width,H=canvas.height;
  var statuses=['pending','processing','shipped','delivered','cancelled'];
  var colors=['rgba(245,200,66,0.8)','rgba(0,180,224,0.8)','rgba(168,85,247,0.8)','rgba(74,222,128,0.8)','rgba(245,90,114,0.8)'];
  var counts=statuses.map(function(s){return orders.filter(function(o){return o.status===s;}).length;});
  var total=orders.length||1;
  var cx=W/2,cy=H/2,r=Math.min(W,H)*0.4;
  var startAngle=-Math.PI/2;
  counts.forEach(function(c,i){
    if(!c) return;
    var slice=(c/total)*Math.PI*2;
    ctx.beginPath();ctx.moveTo(cx,cy);
    ctx.arc(cx,cy,r,startAngle,startAngle+slice);
    ctx.closePath();ctx.fillStyle=colors[i];ctx.fill();
    // label
    var midAngle=startAngle+slice/2;
    var lx=cx+Math.cos(midAngle)*(r*0.65),ly=cy+Math.sin(midAngle)*(r*0.65);
    ctx.fillStyle='rgba(0,0,0,0.9)';ctx.font='bold 9px Rajdhani,sans-serif';ctx.textAlign='center';
    ctx.fillText(c,lx,ly+3);
    startAngle+=slice;
  });
  // Legend
  var legX=4,legY=H-60;
  statuses.forEach(function(s,i){
    if(!counts[i]) return;
    ctx.fillStyle=colors[i];ctx.fillRect(legX,legY,8,8);
    ctx.fillStyle='rgba(90,112,128,0.8)';ctx.font='7px Rajdhani,sans-serif';ctx.textAlign='left';
    ctx.fillText(s+' ('+counts[i]+')',legX+11,legY+7);
    legX+=W/5;
  });
}

// ═══════════════════════════════════════════
//  NAVIGATION
// ═══════════════════════════════════════════
document.querySelectorAll('.sb-item[data-page]').forEach(function(el){
  el.addEventListener('click',function(){
    var id=this.dataset.page;
    document.querySelectorAll('.sb-item').forEach(function(i){i.classList.remove('active');});
    this.classList.add('active');
    document.querySelectorAll('.page').forEach(function(p){p.classList.remove('active');});
    var pg=document.getElementById('page-'+id);
    if(pg) pg.classList.add('active');
    var titles={dashboard:'Overview',orders:'All Orders',completed:'Completed Orders',pending:'Pending Orders',users:'User Management',settings:'Settings'};
    document.getElementById('adminTitle').textContent=titles[id]||id;
    document.getElementById('adminCrumb').textContent=id.charAt(0).toUpperCase()+id.slice(1);
  });
});

// ═══════════════════════════════════════════
//  SETTINGS
// ═══════════════════════════════════════════
function changeAdminPass(){
  var old=document.getElementById('settOld').value;
  var nw=document.getElementById('settNew').value;
  var stored=JSON.parse(localStorage.getItem('ps_admin_creds')||JSON.stringify(ADMIN_CREDS));
  if(old!==stored.password){showToast('Current password incorrect','error');return;}
  if(nw.length<6){showToast('New password must be 6+ characters','error');return;}
  stored.password=nw;
  localStorage.setItem('ps_admin_creds',JSON.stringify(stored));
  showToast('Admin password updated successfully','success');
  document.getElementById('settOld').value='';document.getElementById('settNew').value='';
}
function exportData(){
  var data={users:getUsers(),orders:getOrders(),exported:new Date().toISOString()};
  var blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='powersupply-data.json';a.click();
  showToast('Data exported successfully','success');
}
function clearOrders(){
  if(!confirm('Clear ALL orders? This cannot be undone.')) return;
  localStorage.removeItem(ORDERS_KEY);
  loadAdminDashboard();
  showToast('All orders cleared','warn');
}
function clearUsers(){
  if(!confirm('Clear all users? This cannot be undone.')) return;
  localStorage.removeItem(USERS_KEY);
  seedData();
  loadAdminDashboard();
  showToast('Users cleared (demo data restored)','warn');
}


// Listen for new users from customer portal
window.addEventListener('storage',function(e){
  if((e.key===USERS_KEY||e.key===ORDERS_KEY)&&localStorage.getItem(ADMIN_KEY)==='true'){
    loadAdminDashboard();
    showToast('⚡ Live update received','info');
  }
});

// ── SAVE ─────────────────────────────────────────────────────────────────
function save() {
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
  updateStats();
  renderList();
  document.getElementById('navCount').textContent = products.length;
}

// ── STATS ─────────────────────────────────────────────────────────────────
function updateStats() {
  document.getElementById('statTotal').textContent = products.length;
  document.getElementById('statActive').textContent = products.length;
  const avg = products.length ? Math.round(products.reduce((s,p)=>s+p.price,0)/products.length) : 0;
  document.getElementById('statAvg').textContent = avg.toLocaleString();
  document.getElementById('statBadged').textContent = products.filter(p=>p.badge).length;
}

// ── RENDER LIST ───────────────────────────────────────────────────────────
function renderList() {
  const q = document.getElementById('listSearch').value.toLowerCase();
  let list = products.filter(p => !q || p.name.toLowerCase().includes(q) || (p.category||'').toLowerCase().includes(q));
  document.getElementById('listCount').textContent = list.length;
  const container = document.getElementById('productsList');
  if (list.length === 0) {
    container.innerHTML = `<div class="list-empty"><div class="le-icon">📦</div><p>${products.length===0?'No products posted yet. Add your first product using the form on the left.':'No products match your search.'}</p></div>`;
    return;
  }
  container.innerHTML = list.map(p => `
    <div class="product-item">
      ${p.badge ? `<div class="pi-badge ${p.badge.toLowerCase()+'-b'}">${p.badge}</div>` : ''}
      <div class="pi-img">
        ${p.image ? `<img src="${p.image}" alt="${p.name}" onerror="this.parentNode.innerHTML='<span>${p.emoji||'📦'}</span>'">` : `<span>${p.emoji||'📦'}</span>`}
      </div>
      <div class="pi-info">
        <div class="pi-name">${p.name}</div>
        <div class="pi-cat">${p.category||'General'}</div>
        <div class="pi-price">Ksh ${Number(p.price).toLocaleString()}</div>
      </div>
      <div class="pi-actions">
        <button class="pi-edit" onclick="editProduct(${p.id})">✎ Edit</button>
        <button class="pi-del" onclick="openDelete(${p.id})">🗑 Del</button>
      </div>
    </div>`).join('');
}

// ── POST / EDIT ───────────────────────────────────────────────────────────
function postProduct() {
  const name = document.getElementById('pName').value.trim();
  const price = parseFloat(document.getElementById('pPrice').value);
  const category = document.getElementById('pCategory').value;
  if (!name) { showToast('Product name is required', 'error'); return; }
  if (!price || price <= 0) { showToast('Enter a valid price', 'error'); return; }
  if (!category) { showToast('Select a category', 'error'); return; }

  const product = {
    id: editingId || nextId++,
    name,
    price,
    category,
    description: document.getElementById('pDesc').value.trim(),
    image: document.getElementById('pImage').value.trim(),
    emoji: document.getElementById('pEmoji').value.trim(),
    badge: selectedBadge,
    createdAt: editingId ? (products.find(p=>p.id===editingId)?.createdAt || Date.now()) : Date.now()
  };

  if (editingId) {
    const idx = products.findIndex(p => p.id === editingId);
    products[idx] = product;
    showToast(`✅ "${name}" updated in marketplace`, 'success');
    editingId = null;
    document.getElementById('formHeading').textContent = 'Add New Product';
    document.getElementById('formMode').textContent = 'NEW';
    document.getElementById('btnPost').textContent = '⚡ Post Product';
  } else {
    products.unshift(product);
    showToast(`⚡ "${name}" posted to marketplace!`, 'success');
  }
  save();
  clearForm();
}

// ── EDIT ──────────────────────────────────────────────────────────────────
function editProduct(id) {
  const p = products.find(x => x.id === id);
  if (!p) return;
  editingId = id;
  document.getElementById('pName').value = p.name;
  document.getElementById('pPrice').value = p.price;
  document.getElementById('pCategory').value = p.category || '';
  document.getElementById('pDesc').value = p.description || '';
  document.getElementById('pImage').value = p.image || '';
  document.getElementById('pEmoji').value = p.emoji || '';
  document.getElementById('pBadge').value = p.badge || '';
  selectedBadge = p.badge || '';
  document.querySelectorAll('.badge-opt').forEach(b => {
    b.classList.remove('selected');
    if ((b.dataset.val || b.textContent.trim()) === (p.badge || 'None')) b.classList.add('selected');
  });
  previewImage();
  document.getElementById('formHeading').textContent = 'Edit Product';
  document.getElementById('formMode').textContent = 'EDIT';
  document.getElementById('btnPost').textContent = '💾 Save Changes';
  document.querySelector('.add-panel').scrollIntoView({behavior:'smooth'});
}

// ── DELETE ────────────────────────────────────────────────────────────────
function openDelete(id) { deleteTargetId = id; document.getElementById('deleteModal').classList.add('show'); }
function closeModal() { document.getElementById('deleteModal').classList.remove('show'); deleteTargetId = null; }
function confirmDelete() {
  const p = products.find(x => x.id === deleteTargetId);
  products = products.filter(x => x.id !== deleteTargetId);
  save();
  closeModal();
  showToast(`🗑 "${p?.name}" removed from marketplace`, 'info');
}

// ── BADGE ─────────────────────────────────────────────────────────────────
function selectBadge(val, btn) {
  selectedBadge = val;
  document.getElementById('pBadge').value = val;
  document.querySelectorAll('.badge-opt').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
}

// ── IMAGE PREVIEW ─────────────────────────────────────────────────────────
function previewImage() {
  const url = document.getElementById('pImage').value.trim();
  const img = document.getElementById('imgPreview');
  const ph = document.getElementById('previewPlaceholder');
  if (url) {
    img.src = url;
    img.style.display = 'block';
    ph.style.display = 'none';
    img.onerror = () => { img.style.display='none'; ph.style.display='flex'; };
  } else {
    img.style.display = 'none';
    ph.style.display = 'flex';
  }
}

// ── CLEAR ─────────────────────────────────────────────────────────────────
function clearForm() {
  ['pName','pPrice','pCategory','pDesc','pImage','pEmoji'].forEach(id => document.getElementById(id).value = '');
  selectedBadge = '';
  document.getElementById('pBadge').value = '';
  document.querySelectorAll('.badge-opt').forEach(b => b.classList.remove('selected'));
  document.querySelector('.badge-opt.none').classList.add('selected');
  document.getElementById('imgPreview').style.display = 'none';
  document.getElementById('previewPlaceholder').style.display = 'flex';
  editingId = null;
  document.getElementById('formHeading').textContent = 'Add New Product';
  document.getElementById('formMode').textContent = 'NEW';
  document.getElementById('btnPost').textContent = '⚡ Post Product';
}

// ── TOAST ─────────────────────────────────────────────────────────────────
function showToast(msg, type = 'info') {
  const t = document.getElementById('toast');
  t.textContent = msg; t.className = 'toast ' + type + ' show';
  setTimeout(() => t.classList.remove('show'), 3000);

}


// ── INIT ──────────────────────────────────────────────────────────────────
updateStats();
renderList();
document.getElementById('navCount').textContent = products.length;