 // STATE
let allProducts = [];
let cart = JSON.parse(localStorage.getItem('ps_cart') || '[]');
let activeFilter = 'all';

//  STORAGE KEY (shared with admin)
const PRODUCTS_KEY = 'ps_products';
const CURR_KEY = 'ps_current_user';
const ELEC_KEY = 'ps_electricity_payments';
const ORDERS_KEY = 'ps_orders';
const CART_KEY = 'ps_cart';

//AUTH CHECK
currentUser = null;

window.addEventListener('DOMContentLoaded', function() {
  currentUser = JSON.parse(localStorage.getItem(CURR_KEY) || 'null');
  if (currentUser){
    // Update sidebar user info
    var initials = (currentUser.firstName ? currentUser.firstName[0] : 'U') + (currentUser.lastName ? currentUser.lastName[0] : '');
    document.getElementById('mktUserAv').textContent = initials.toUpperCase();
    document.getElementById('mktUserName').textContent = currentUser.firstName + ' ' + (currentUser.lastName || '');
    document.getElementById('mktUserRole').textContent = 'Customer';
    // Load electricity meter info
    document.getElementById('elecMeterNum').textContent = currentUser.meter || 'MTR-N/A';
    document.getElementById('elecUserName').textContent = currentUser.firstName + ' ' + (currentUser.lastName || '');
    document.getElementById('s2Meter').textContent = currentUser.meter || 'MTR-N/A';
  }
  loadProducts();
  updateCartUI();
});

//  LOAD PRODUCTS
function loadProducts() {
  const stored = localStorage.getItem(PRODUCTS_KEY);
  allProducts = stored ? JSON.parse(stored) : [];
  setTimeout(() => renderProducts(allProducts), 800); // simulate load
}

//=========== TOGGLE SIDEBAR=======
function toggleMenuSide(){
  document.querySelector('.sidebar').classList.toggle('show-side');
  console.log("CLICKED!");
}

//  RENDER
function renderProducts(list) {
  const grid = document.getElementById('productsGrid');
  document.getElementById('productCountLabel').textContent = list.length + ' item' + (list.length !== 1 ? 's' : '');
  document.getElementById('productCountBadge').textContent = allProducts.length;

  if (list.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <div class="empty-hex">⚡</div>
        <div class="empty-title">No Products Yet</div>
        <div class="empty-sub">The admin hasn't added any products yet. Check back soon or visit the admin panel to add some.</div>
        <a href="admin-dashboard.html" target="_blank" style="font-family:'Rajdhani',sans-serif;font-weight:700;font-size:0.78rem;letter-spacing:0.1em;text-transform:uppercase;color:var(--teal);text-decoration:none;border:1px solid var(--teal);padding:0.5rem 1.2rem;margin-top:0.5rem;transition:all .2s;" onmouseover="this.style.background='rgba(0,220,180,0.1)'" onmouseout="this.style.background='transparent'">⚙ Open Admin Panel</a>
      </div>`;
    return;
  }

  grid.innerHTML = list.map((p, i) => `
    <div class="product-card" style="animation-delay:${i * 60}ms">
      ${p.badge ? `<div class="product-badge badge-${p.badge.toLowerCase()}">${p.badge}</div>` : ''}
      <div class="product-img">
        ${p.image
          ? `<img src="${p.image}" alt="${p.name}" onerror="this.parentNode.innerHTML='<div class=&quot;img-placeholder&quot;>📦</div>'">`
          : `<div class="img-placeholder">${p.emoji || '📦'}</div>`}
      </div>
      <div class="product-body">
        <div class="product-cat">${p.category || 'General'}</div>
        <div class="product-name">${p.name}</div>
        <div class="product-desc">${p.description || 'Quality product available for purchase.'}</div>
        <div class="product-price"><span class="currency">Ksh</span>${Number(p.price).toLocaleString()}</div>
        <div class="product-actions">
          <button class="btn-cart" onclick="addToCart(${p.id})">🛒 Add to Cart</button>
          <button class="btn-buy" 
onclick="openPayment({ name: '${p.name}', price: ${p.price} })">⚡ Buy Now</button>
        </div>
      </div>
    </div>`).join('');
}

//  FILTER / SEARCH / SORT
function filterProducts() {
  const query = document.getElementById('searchInput').value.toLowerCase();
  const sort = document.getElementById('sortSelect').value;
  let list = allProducts.filter(p => {
    const matchFilter = activeFilter === 'all' || (p.category || '').toLowerCase() === activeFilter;
    const matchSearch = !query || p.name.toLowerCase().includes(query) || (p.description || '').toLowerCase().includes(query);
    return matchFilter && matchSearch;
  });
  if (sort === 'price-asc') list.sort((a, b) => a.price - b.price);
  else if (sort === 'price-desc') list.sort((a, b) => b.price - a.price);
  else if (sort === 'name') list.sort((a, b) => a.name.localeCompare(b.name));
  renderProducts(list);
}

function setFilter(f, btn) {
  activeFilter = f;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  filterProducts();
}

//================================
// ELECTRICITY PAY
//================================
var elecData = { amount:0, units:0, method:'mpesa', ref:'' };
var selectedPayMethod = 'mpesa';

function openElectricityCard() {
  // Show the payment overlay
  const user = JSON.parse(localStorage.getItem(CURR_KEY));

  if (user) {
    openElec();
  } else {
    // SAVE INTENT: Tell the browser to open this card after they log in
    localStorage.setItem('post_login_action', 'open_elec');
    // Save current page so login knows where to return
    localStorage.setItem('redirect_after_login', window.location.href);
    window.location.href = 'login.html';
  }
}

function openElec() {
  updateUnits();
  elecData.ref = 'PSS-' + Math.floor(100000 + Math.random() * 900000);
  document.getElementById('elecBankRef').textContent = elecData.ref;
  goElecScreen(1);
  document.getElementById('elecOverlay').classList.add('show');
  document.body.style.overflow = 'hidden';
}

function goElecScreen(n) {
  document.querySelectorAll('.elec-screen').forEach(function(s){s.classList.remove('show');});
  var target = document.getElementById('elecS' + n);
  if (target) target.classList.add('show');
  document.querySelector('.elec-modal').scrollTop = 0;
}

function selectAmount(val, el) {
  document.querySelectorAll('.amount-preset').forEach(function(p){p.classList.remove('selected');});
  el.classList.add('selected');
  if (val > 0) {
    document.getElementById('elecAmount').value = val;
    updateUnits();
  } else {
    document.getElementById('elecAmount').value = '';
    document.getElementById('elecAmount').focus();
  }
}

function updateUnits() {
  var amount = parseFloat(document.getElementById('elecAmount').value) || 0;
  var vat = amount * 0.16;
  var levy = amount * 0.02;
  var base = amount - vat - levy;
  var unitRate = 22.5; // Ksh per kWh (approx)
  var units = base > 0 ? base / unitRate : 0;
  document.getElementById('unitEstimate').textContent = units.toFixed(1);
  document.getElementById('sumBase').textContent = 'Ksh ' + (amount - vat - levy).toFixed(0);
  document.getElementById('sumVat').textContent = 'Ksh ' + vat.toFixed(0);
  document.getElementById('sumLevy').textContent = 'Ksh ' + levy.toFixed(0);
  document.getElementById('sumUnits').textContent = units.toFixed(1) + ' kWh';
  document.getElementById('sumTotal').textContent = 'Ksh ' + (amount || 0).toLocaleString();
  elecData.amount = amount;
  elecData.units = units;
  // Update preset highlight if matches
  document.querySelectorAll('.amount-preset').forEach(function(p) {
    var pval = p.onclick ? p.getAttribute('onclick') : '';
    if (p.textContent === 'Ksh ' + Number(amount).toLocaleString()) p.classList.add('selected');
  });
}

function elecStep2() {
  var amount = parseFloat(document.getElementById('elecAmount').value) || 0;
  if (amount < 10) { document.getElementById('elecAmountErr').classList.add('show'); return; }
  document.getElementById('elecAmountErr').classList.remove('show');
  document.getElementById('elecS2Sub').textContent = 'Amount: Ksh ' + amount.toLocaleString();
  document.getElementById('s2Total').textContent = 'Ksh ' + amount.toLocaleString();
  document.getElementById('s2Units').textContent = elecData.units.toFixed(1) + ' kWh';
  goElecScreen(2);
}

function selectPayMethod(el) {
  document.querySelectorAll('.pm-card').forEach(function(c){c.classList.remove('selected');});
  el.classList.add('selected');
  selectedPayMethod = el.dataset.method;
  document.getElementById('methodMpesa').style.display = selectedPayMethod === 'mpesa' ? 'block' : 'none';
  document.getElementById('methodCard').style.display  = selectedPayMethod === 'card'  ? 'block' : 'none';
  document.getElementById('methodBank').style.display  = selectedPayMethod === 'bank'  ? 'block' : 'none';
}

function elecPay() {
  // Validate based on method
  if (selectedPayMethod === 'mpesa') {
    var phone = document.getElementById('elecPhone').value.trim().replace(/\s/g,'');
    if (!/^(\+?254|0)[17]\d{8}$/.test(phone)) {
      document.getElementById('elecPhoneErr').classList.add('show'); return;
    }
    document.getElementById('elecPhoneErr').classList.remove('show');
  }
  // Go to connecting screen
  goElecScreen(3);
  runWifiConnect();
}

function runWifiConnect() {
  var steps = [
    { dot:'cs1', text:'cst1', label:'Authorizing payment...', delay:800 },
    { dot:'cs2', text:'cst2', label:'Generating token code...', delay:1600 },
    { dot:'cs3', text:'cst3', label:'Sending WiFi signal to meter...', delay:2600 },
    { dot:'cs4', text:'cst4', label:'Loading units onto meter...', delay:3800 },
    { dot:'cs5', text:'cst5', label:'Confirming connection...', delay:4800 },
  ];
  var fill = document.getElementById('connectFill');
  var pct  = document.getElementById('wifiPercent');

  steps.forEach(function(s, i) {
    setTimeout(function() {
      // Mark previous as done
      if (i > 0) {
        document.getElementById(steps[i-1].dot).classList.remove('active');
        document.getElementById(steps[i-1].dot).classList.add('done');
      }
      document.getElementById(s.dot).classList.add('active');
      document.getElementById('wifiTitle').textContent = s.label;
      var p = Math.round((i+1) / steps.length * 85);
      fill.style.width = p + '%';
      pct.textContent = p + '%';
    }, s.delay);
  });

  // Final - show success
  setTimeout(function() {
    document.getElementById(steps[steps.length-1].dot).classList.remove('active');
    document.getElementById(steps[steps.length-1].dot).classList.add('done');
    fill.style.width = '100%';
    pct.textContent = '100%';

    // Generate token
    var token = generateToken();
    var ref = 'TXN-' + Math.floor(100000 + Math.random() * 900000);
    var amount = elecData.amount;
    var units = elecData.units;

    // Save to storage
    var payments = JSON.parse(localStorage.getItem(ELEC_KEY) || '[]');
    payments.unshift({
      id: ref, userId: currentUser ? currentUser.email : 'guest',
      amount: amount, units: units, token: token, method: selectedPayMethod,
      meter: currentUser ? (currentUser.meter || 'MTR-N/A') : 'MTR-N/A',
      date: new Date().toISOString(), status: 'connected'
    });
    localStorage.setItem(ELEC_KEY, JSON.stringify(payments));

    // Add to orders for dashboard tracking
    var orders = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
    orders.push({
      id: 'ELEC-' + Date.now(),
      userId: currentUser ? currentUser.email : 'guest',
      product: 'Electricity — ' + units.toFixed(1) + ' kWh',
      category: 'Electricity', emoji: '⚡',
      price: amount, qty: 1, status: 'delivered',
      date: new Date().toISOString().split('T')[0], ref: ref
    });
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));

    // Show success screen
    setTimeout(function() {
      document.getElementById('tokenCodeDisplay').textContent = token;
      document.getElementById('tokenUnits').textContent = units.toFixed(1) + ' kWh';
      document.getElementById('tokenAmount').textContent = 'Ksh ' + Number(amount).toLocaleString();
      document.getElementById('tokenRef').textContent = ref;
      // Animate bar
      setTimeout(function(){ document.getElementById('unitsBarFill').style.width = '100%'; }, 300);
      goElecScreen(4);
    }, 600);
  }, 5800);
}

function generateToken() {
  var t = '';
  for (var i = 0; i < 5; i++) {
    if (i > 0) t += ' ';
    t += Math.floor(1000 + Math.random() * 9000);
  }
  return t; // Format: XXXX XXXX XXXX XXXX X
}

function copyToken() {
  var tok = document.getElementById('tokenCodeDisplay').textContent;
  navigator.clipboard.writeText(tok);
}

function resetElecForm() {
  document.getElementById('elecAmount').value = '';
  document.getElementById('unitEstimate').textContent = '0.0';
  document.getElementById('sumBase').textContent = 'Ksh 0';
  document.getElementById('sumVat').textContent = 'Ksh 0';
  document.getElementById('sumLevy').textContent = 'Ksh 0';
  document.getElementById('sumUnits').textContent = '0.0 kWh';
  document.getElementById('sumTotal').textContent = 'Ksh 0';
  document.getElementById('elecPhone').value = '';
  document.querySelectorAll('.amount-preset').forEach(function(p){p.classList.remove('selected');});
  document.querySelectorAll('.cs-dot').forEach(function(d){d.className='cs-dot';});
  document.getElementById('connectFill').style.width = '0%';
  document.getElementById('wifiPercent').textContent = '0%';
  document.getElementById('wifiTitle').textContent = 'Processing Payment';
}

function closeElecCard(){
const card = document.getElementById('elecOverlay');
card.classList.remove('show');
}

//  CART 
function addToCart(id) {
  const p = allProducts.find(x => x.id === id);
  if (!p) return;
  const existing = cart.find(x => x.id === id);
  if (existing) existing.qty++;
  else cart.push({ ...p, qty: 1 });
  saveCart();
  updateCartUI();
  showToast(`✓ ${p.name} added to cart`, 'success');
}

function buyNow(id) {
  addToCart(id);
  openCart();

}

function removeFromCart(id) {
  cart = cart.filter(x => x.id !== id);
  saveCart(); updateCartUI(); renderCartPanel();
}

function changeQty(id, delta) {
  const item = cart.find(x => x.id === id);
  if (!item) return;
  item.qty = Math.max(1, item.qty + delta);
  saveCart(); updateCartUI(); renderCartPanel();
}

function saveCart() { localStorage.setItem('ps_cart', JSON.stringify(cart)); }

function updateCartUI() {
  const count = cart.reduce((s, i) => s + i.qty, 0);
  document.getElementById('cartCountTop').textContent = count;
  document.getElementById('cartBadgeSide').textContent = count;
}

function renderCartPanel() {
  const container = document.getElementById('cartItems');
  if (cart.length === 0) {
    container.innerHTML = '<div class="cart-empty">🛒<br>Your cart is empty.<br>Browse products and add items.</div>';
    document.getElementById('cartTotal').textContent = 'Ksh 0';
    return;
  }
  container.innerHTML = cart.map(item => `
    <div class="cart-item">
      <div class="ci-img">
        ${item.image ? `<img src="${item.image}" alt="${item.name}" onerror="this.parentNode.innerHTML='<span class=&quot;ci-emoji&quot;>📦</span>'">` : `<span class="ci-emoji">${item.emoji || '📦'}</span>`}
      </div>
      <div class="ci-info">
        <div class="ci-name">${item.name}</div>
        <div class="ci-price">Ksh ${Number(item.price).toLocaleString()}</div>
        <div class="ci-qty">
          <button class="qty-btn" onclick="changeQty(${item.id},-1)">−</button>
          <span class="qty-num">${item.qty}</span>
          <button class="qty-btn" onclick="changeQty(${item.id},1)">+</button>
          <button class="ci-remove" onclick="removeFromCart(${item.id})">🗑</button>
        </div>
      </div>
    </div>`).join('');
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  document.getElementById('cartTotal').textContent = 'Ksh ' + total.toLocaleString();
}

function openCart(e) {
  const user = JSON.parse(localStorage.getItem('ps_current_user')); 

  if (user) {
    e.preventDefault(); document.getElementById('cartPanel').classList.add('open'); document.getElementById('cartOverlay').classList.add('show');
    renderCartPanel();
   
  }
  else { 

     // SAVE INTENT: Tell the browser to open this card after they log in
     localStorage.setItem('post_login_action', 'open_cart');
     // Save current page so login knows where to return
     localStorage.setItem('redirect_after_login', window.location.href);
//DIRECTS TO LOGIN PAGE
      window.location.href = "login.html";
    return;
  } 
}
function closeCart() { document.getElementById('cartPanel').classList.remove('open'); document.getElementById('cartOverlay').classList.remove('show'); }


//  TOAST 
function showToast(msg, type = 'info') {
  const t = document.getElementById('toast');
  t.textContent = msg; t.className = 'toast ' + type + ' show';
  setTimeout(() => t.classList.remove('show'), 2800);
}

//  LIVE SYNC (watch for admin changes) 
window.addEventListener('storage', e => {
  if (e.key === PRODUCTS_KEY) { allProducts = JSON.parse(e.newValue || '[]'); filterProducts(); showToast('⚡ Products updated by admin', 'info'); }
});

loadProducts();
updateCartUI();
 
 
 //  PAYMENT 

var _payOrder = { name:'', price:0, isCart:false };

// OPEN 
function openPayment(order) {
    if (cart.length === 0 && order?.isCart) {
        showToast('Your cart is empty!', 'error');
        return;
      }

  _payOrder = order || { name:'Your Order', price:0 };
  var fmt = 'Ksh ' + Number(_payOrder.price).toLocaleString();

  document.getElementById('orderItemName').textContent = _payOrder.name;
  document.getElementById('orderAmountChoose').textContent = fmt;
  document.getElementById('mpesaTotal').textContent = fmt;
  document.getElementById('paypalTotal').textContent = fmt;
  document.getElementById('bankTotal').textContent = fmt;
  document.getElementById('bankAmountDisplay').textContent = fmt;

  var ref = 'PSS-' + Math.floor(100000 + Math.random() * 900000);
  document.getElementById('bankRef').textContent = ref;
  document.getElementById('bankRefInline').textContent = ref;
  document.getElementById('bankRefCopyBtn').onclick = function(){ copyPayText(ref,'Reference'); };

  showPayScreen('screenChoose');
  document.getElementById('payOverlay').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closePayment() {
  document.getElementById('payOverlay').classList.remove('active');
  document.body.style.overflow = '';
  setTimeout(function(){
    _clearPayForms();
    showPayScreen('screenChoose');
  }, 300);
}

function showPayScreen(id) {
  document.querySelectorAll('.pay-screen').forEach(function(s){ s.classList.remove('show'); });
  document.getElementById(id).classList.add('show');
  document.getElementById('payModal').scrollTop = 0;
}

//  LIVE PHONE DISPLAY
function updatePhoneDisplay() {
  var v = document.getElementById('mpesaPhone').value.trim() || 'your phone';
  document.getElementById('mpesaPhoneDisplay').textContent = v;
}

// FORMAT HELPERS 
function formatCard(el) {
  var v = el.value.replace(/\D/g,'').slice(0,16);
  el.value = v.replace(/(.{4})/g,'$1 ').trim();
}
function formatExpiry(el) {
  var v = el.value.replace(/\D/g,'').slice(0,4);
  if(v.length >= 2) v = v.slice(0,2) + ' / ' + v.slice(2);
  el.value = v;
}

// ERROR HELPERS 
function _showErr(id){ var e=document.getElementById(id); if(e) e.classList.add('show'); }
function _hideErr(id){ var e=document.getElementById(id); if(e) e.classList.remove('show'); }
function _errField(inpId, errId, on){
  var el=document.getElementById(inpId);
  if(el) el.classList.toggle('err',on);
  on ? _showErr(errId) : _hideErr(errId);
}

// M-PESA 
function processMpesa() {
  var phone = document.getElementById('mpesaPhone').value.trim().replace(/\s/g,'');
  _hideErr('mpesaPhoneErr');
  document.getElementById('mpesaPhone').classList.remove('err');
  if(!phone || !/^(\+?254|0)[17]\d{8}$/.test(phone)){
    _errField('mpesaPhone','mpesaPhoneErr',true); return;
  }
  _runProcessing(
    'Sending STK Push…',
    'Check your phone for the M-Pesa prompt',
    ['Sending push to '+phone,'Waiting for PIN entry','Verifying with Safaricom'],
    function(){ _showSuccess('M-Pesa payment confirmed from '+phone+'. Your order is on its way!','MPE-'+_rand()); }
  );
}

// PAYPAL / CARD 
function processPaypal() {
  var ok=true;
  var name=document.getElementById('cardName').value.trim();
  var num=document.getElementById('cardNumber').value.replace(/\s/g,'');
  var exp=document.getElementById('cardExpiry').value.replace(/\s/g,'');
  var cvv=document.getElementById('cardCvv').value.trim();
  ['cardNameErr','cardNumberErr','cardExpiryErr','cardCvvErr'].forEach(_hideErr);
  ['cardName','cardNumber','cardExpiry','cardCvv'].forEach(function(i){ document.getElementById(i).classList.remove('err'); });
  if(!name){_errField('cardName','cardNameErr',true);ok=false;}
  if(num.length<16||!/^\d+$/.test(num)){_errField('cardNumber','cardNumberErr',true);ok=false;}
  if(!/^\d{2}\/\d{2}$/.test(exp)){_errField('cardExpiry','cardExpiryErr',true);ok=false;}
  if(cvv.length<3){_errField('cardCvv','cardCvvErr',true);ok=false;}
  if(!ok) return;
  _runProcessing(
    'Processing Card Payment…',
    'Encrypting and authorizing your card',
    ['Encrypting card data','Authorizing with bank','Confirming transaction'],
    function(){ _showSuccess('Card payment approved for '+name+'. Order confirmed!','TXN-'+_rand()); }
  );
}

// BANK TRANSFER 
function processBank() {
  var ok=true;
  var name=document.getElementById('bankSenderName').value.trim();
  var bank=document.getElementById('bankSenderBank').value.trim();
  ['bankNameErr','bankBankErr'].forEach(_hideErr);
  ['bankSenderName','bankSenderBank'].forEach(function(i){ document.getElementById(i).classList.remove('err'); });
  if(!name){_errField('bankSenderName','bankNameErr',true);ok=false;}
  if(!bank){_errField('bankSenderBank','bankBankErr',true);ok=false;}
  if(!ok) return;
  var ref=document.getElementById('bankRef').textContent;
  _runProcessing(
    'Registering Transfer…',
    'Recording your transfer details',
    ['Saving transfer info','Generating confirmation','Notifying finance team'],
    function(){ _showSuccess('Transfer registered for '+name+' via '+bank+'. We\'ll confirm when funds arrive (1–3 days). Ref: '+ref,ref); }
  );
}

// PROCESSING ANIMATION 
function _runProcessing(title, subtitle, steps, onDone) {
  showPayScreen('screenProcessing');
  document.getElementById('processingTitle').textContent = title;
  document.getElementById('processingSubtitle').textContent = subtitle;
  var dots=['pd1','pd2','pd3'], txts=['ps1','ps2','ps3'];
  dots.forEach(function(d,i){
    var el=document.getElementById(d); el.className='proc-dot';
    document.getElementById(txts[i]).textContent = steps[i]||'Processing…';
  });
  var step=0;
  function advance(){
    if(step>0) document.getElementById(dots[step-1]).className='proc-dot done';
    if(step<dots.length){
      document.getElementById(dots[step]).classList.add('active');
      step++; setTimeout(advance, 1100+Math.random()*500);
    } else {
      document.getElementById(dots[dots.length-1]).className='proc-dot done';
      setTimeout(onDone, 500);
    }
  }
  setTimeout(advance, 700);
}

// SUCCESS 
function _showSuccess(msg, ref) {
  document.getElementById('successMsg').textContent = msg;
  document.getElementById('successRef').textContent = 'REF: ' + ref;
  showPayScreen('screenSuccess');
  /* Clear marketplace cart if integrated */
  if(typeof cart !== 'undefined'){ cart=[]; }
  if(typeof saveCart === 'function') saveCart();
  if(typeof updateCartUI === 'function') updateCartUI();
  if(typeof renderCartPanel === 'function') renderCartPanel();
}

// COPY 
function copyPayText(text, label) {
  navigator.clipboard.writeText(text).then(function(){
    _payToast(label+' copied!','success');
  }).catch(function(){
    _payToast('Copy failed — please copy manually','error');
  });
}

// TOAST 
function _payToast(msg, type) {
  var t=document.getElementById('payToast');
  t.textContent=msg; t.className='pay-toast '+(type||'info')+' show';
  setTimeout(function(){ t.classList.remove('show'); }, 2800);
}

// UTILS 
function _rand(){ return Math.floor(100000+Math.random()*900000); }
function _clearPayForms(){
  ['mpesaPhone','cardName','cardNumber','cardExpiry','cardCvv','bankSenderName','bankSenderBank']
    .forEach(function(id){ var el=document.getElementById(id); if(el) el.value=''; });
  document.querySelectorAll('.pay-input').forEach(function(i){ i.classList.remove('err'); });
  document.querySelectorAll('.field-err').forEach(function(e){ e.classList.remove('show'); });
}

// CLOSE ON OVERLAY / ESC 
document.getElementById('payOverlay').addEventListener('click', function(e){
  if(e.target===this) closePayment();
});
document.addEventListener('keydown', function(e){
  if(e.key==='Escape') closePayment();
});

// AUTO-OPEN LOGIC: Runs when any page loads
window.addEventListener('DOMContentLoaded', () => {
  const user = JSON.parse(localStorage.getItem('ps_current_user'));
  const pendingAction = localStorage.getItem('post_login_action');

  if (user && pendingAction) {
      // Clear the memory so it doesn't pop up every time you refresh
      localStorage.removeItem('post_login_action');

      // Execute the action that was interrupted by the login
      if (pendingAction === 'open_elec') {
          openElectricityCard();
      } else if (pendingAction === 'open_cart') {
          if(typeof openCart === "function") openCart(e);
      }
  }
});

  //=====================
  // AI ASSISTANCE 
  //=====================
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
  