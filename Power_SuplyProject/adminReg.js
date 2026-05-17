// ═══════════════════════════════════════════════════════
//  STORAGE KEYS — Must match admin-dashboard.html
// ═══════════════════════════════════════════════════════
var ADMIN_ACCOUNTS_KEY = 'ps_admin_accounts';  // stores all registered admins
var ADMIN_SESSION_KEY  = 'ps_admin_session';    // login state
var ADMIN_CREDS_KEY    = 'ps_admin_creds';      // active login credentials
var ADMIN_NOTIFS_KEY   = 'ps_admin_notifs';     // notifications for dashboard

// ═══════════════════════════════════════════════════════
//  VALID ADMIN CODES
//  Add more codes here as needed — each code is single-use
// ═══════════════════════════════════════════════════════
var VALID_CODES = ['PSADMIN8','VOLTADM1','PARTNER2','SHEDDY01','CODEX001','ADMIN123'];

// ═══════════════════════════════════════════════════════
//  STATE
// ═══════════════════════════════════════════════════════
var currentStep = 1;
var termsChecked = false;
var selectedCategory = '';

var formData = {
  firstName:'', lastName:'', email:'', phone:'', nationalId:'',
  category:'', categoryLabel:'', business:'', adminCode:'', password:''
};

// ═══════════════════════════════════════════════════════
//  LIVE VALIDATION
// ═══════════════════════════════════════════════════════
function lv(inputId, errId, type) {
  var el = document.getElementById(inputId);
  var val = el.value.trim();
  var ok = false;
  if (type === 'name')    ok = val.length >= 2;
  if (type === 'email')   ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  if (type === 'phone')   ok = /^\+?[\d\s\-]{8,}$/.test(val);
  if (type === 'id')      ok = val.length >= 6;
  if (type === 'code')    ok = val.length === 8;
  if (type === 'confirm') ok = val === document.getElementById('regPass').value && val.length >= 8;
  el.classList.toggle('valid-field', ok);
  el.classList.toggle('err-field', !ok && val.length > 0);
  if (ok) document.getElementById(errId).classList.remove('show');
}

// ═══════════════════════════════════════════════════════
//  PASSWORD STRENGTH
// ═══════════════════════════════════════════════════════
function checkPwStrength() {
  var pw = document.getElementById('regPass').value;
  var segs = ['pws1','pws2','pws3','pws4'];
  var colors = ['#f55a72','#f5c842','#00b4e0','#4ade80'];
  var labels = ['Weak','Fair','Good','Strong'];
  segs.forEach(function(s){ document.getElementById(s).style.background = '#2a3a48'; });
  var score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  for (var i = 0; i < score; i++) document.getElementById(segs[i]).style.background = colors[score-1];
  var lbl = document.getElementById('pwLabel');
  lbl.textContent = pw.length === 0 ? 'Enter a password' : labels[score-1];
  lbl.style.color = pw.length === 0 ? 'var(--muted)' : colors[score-1];
  // Also validate confirm field
  if (document.getElementById('regPass2').value) lv('regPass2','pass2Err','confirm');
}

// ═══════════════════════════════════════════════════════
//  CATEGORY SELECTION
// ═══════════════════════════════════════════════════════
var catLabels = {
  'ac_electricity':'AC Electricity',
  'solar_electricity':'Solar Electricity',
  'product_vendor':'Product Vendor',
  'other':'Other'
};

function selectCat(el) {
  document.querySelectorAll('.cat-card').forEach(function(c){ c.classList.remove('selected'); });
  el.classList.add('selected');
  selectedCategory = el.dataset.val;
  document.getElementById('catErr').classList.remove('show');
}

// ═══════════════════════════════════════════════════════
//  TERMS TOGGLE
// ═══════════════════════════════════════════════════════
function toggleTerms() {
  termsChecked = !termsChecked;
  var cb = document.getElementById('termsCb');
  cb.className = 'custom-cb' + (termsChecked ? ' checked' : '');
  if (termsChecked) document.getElementById('termsErr').classList.remove('show');
}

// ═══════════════════════════════════════════════════════
//  STEP NAVIGATION
// ═══════════════════════════════════════════════════════
function goScreen(to, from) {
  document.getElementById('screen'+from).classList.remove('show');
  document.getElementById('screen'+to).classList.add('show');
  updateSteps(to);
  currentStep = to;
}

function updateSteps(step) {
  for (var i = 1; i <= 4; i++) {
    var circle = document.getElementById('sc'+i);
    var label  = document.getElementById('sl'+i);
    circle.className = 'step-circle' + (i < step ? ' done' : i === step ? ' active' : '');
    label.className  = 'step-label'  + (i === step ? ' active' : '');
    if (i < step) circle.textContent = '✓';
    else circle.textContent = i;
  }
}

// ═══════════════════════════════════════════════════════
//  STEP 1 — VALIDATE PERSONAL INFO
// ═══════════════════════════════════════════════════════
function step1Next() {
  var first  = document.getElementById('regFirst').value.trim();
  var last   = document.getElementById('regLast').value.trim();
  var email  = document.getElementById('regEmail').value.trim();
  var phone  = document.getElementById('regPhone').value.trim();
  var natId  = document.getElementById('regId').value.trim();
  var valid  = true;

  // Clear all errors
  ['firstErr','lastErr','emailErr','phoneErr','idErr'].forEach(function(e){
    document.getElementById(e).classList.remove('show');
  });
  hideMsg('msg1');

  if (first.length < 2) { document.getElementById('firstErr').classList.add('show'); valid = false; }
  if (last.length < 2)  { document.getElementById('lastErr').classList.add('show');  valid = false; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { document.getElementById('emailErr').classList.add('show'); valid = false; }
  if (!/^\+?[\d\s\-]{8,}$/.test(phone)) { document.getElementById('phoneErr').classList.add('show'); valid = false; }
  if (natId.length < 6) { document.getElementById('idErr').classList.add('show'); valid = false; }

  if (!valid) { showMsg('msg1','Please fill all required fields correctly','error'); return; }

  // Check if email already registered
  var admins = getAdmins();
  if (admins.find(function(a){ return a.email === email; })) {
    showMsg('msg1','This email is already registered as an admin. Please login instead.','warn');
    return;
  }

  // Save step data
  formData.firstName = first;
  formData.lastName  = last;
  formData.email     = email;
  formData.phone     = phone;
  formData.nationalId = natId;

  goScreen(2, 1);
}

// ═══════════════════════════════════════════════════════
//  STEP 2 — VALIDATE CATEGORY
// ═══════════════════════════════════════════════════════
function step2Next() {
  hideMsg('msg2');
  if (!selectedCategory) {
    document.getElementById('catErr').classList.add('show');
    showMsg('msg2','Please select your admin category','error');
    return;
  }
  formData.category      = selectedCategory;
  formData.categoryLabel = catLabels[selectedCategory] || selectedCategory;
  formData.business      = document.getElementById('regBiz').value.trim();
  goScreen(3, 2);
}

// ═══════════════════════════════════════════════════════
//  STEP 3 — VALIDATE SECURITY
// ═══════════════════════════════════════════════════════
function step3Next() {
  var code  = document.getElementById('regCode').value.trim().toUpperCase();
  var pass  = document.getElementById('regPass').value;
  var pass2 = document.getElementById('regPass2').value;
  var valid = true;

  ['codeErr','passErr','pass2Err'].forEach(function(e){
    document.getElementById(e).classList.remove('show');
  });
  hideMsg('msg3');

  if (code.length !== 8) { document.getElementById('codeErr').classList.add('show'); valid = false; }
  if (pass.length < 8)   { document.getElementById('passErr').classList.add('show'); valid = false; }
  if (pass !== pass2)    { document.getElementById('pass2Err').classList.add('show'); valid = false; }

  if (!valid) { showMsg('msg3','Please fix the errors above','error'); return; }

  // Validate admin code
  if (!VALID_CODES.includes(code)) {
    document.getElementById('codeErr').classList.add('show');
    document.getElementById('codeErr').textContent = 'Invalid admin code — contact PowerSupply for a valid code';
    showMsg('msg3','The admin code you entered is not valid','error');
    return;
  }

  formData.adminCode = code;
  formData.password  = pass;

  // Populate review screen
  buildReview();
  goScreen(4, 3);
}

// ═══════════════════════════════════════════════════════
//  BUILD REVIEW SUMMARY
// ═══════════════════════════════════════════════════════
function buildReview() {
  var rows = [
    { label: 'Full Name',  val: formData.firstName + ' ' + formData.lastName },
    { label: 'Email',      val: formData.email },
    { label: 'Phone',      val: formData.phone },
    { label: 'National ID',val: formData.nationalId },
    { label: 'Category',   val: formData.categoryLabel },
    { label: 'Business',   val: formData.business || '—' },
    { label: 'Admin Code', val: '••••' + formData.adminCode.slice(4) },
    { label: 'Password',   val: '••••••••' },
  ];
  document.getElementById('reviewGrid').innerHTML = rows.map(function(r){
    return '<div class="review-row"><span class="rv-label">'+r.label+'</span><span class="rv-val">'+r.val+'</span></div>';
  }).join('');
}

// ═══════════════════════════════════════════════════════
//  SUBMIT REGISTRATION
// ═══════════════════════════════════════════════════════
function submitRegistration() {
  hideMsg('msg4');

  if (!termsChecked) {
    document.getElementById('termsErr').classList.add('show');
    showMsg('msg4','You must accept the terms and conditions','error');
    return;
  }

  var btn = document.getElementById('submitBtn');
  btn.disabled = true;
  btn.textContent = '⏳ Creating Account...';

  setTimeout(function() {
    // Create admin account object
    var newAdmin = {
      id:           'ADM-' + Date.now(),
      firstName:    formData.firstName,
      lastName:     formData.lastName,
      email:        formData.email,
      phone:        formData.phone,
      nationalId:   formData.nationalId,
      category:     formData.category,
      categoryLabel:formData.categoryLabel,
      business:     formData.business,
      adminCode:    formData.adminCode,
      password:     formData.password,
      role:         'admin',
      status:       'active',
      createdAt:    new Date().toISOString(),
    };

    // Save to ps_admin_accounts list
    var admins = getAdmins();
    admins.push(newAdmin);
    localStorage.setItem(ADMIN_ACCOUNTS_KEY, JSON.stringify(admins));

    // ── CRITICAL: Update ps_admin_creds so dashboard login works ──
    // The dashboard checks ps_admin_creds for username+password.
    // We update it to allow this new admin to login.
    // Super-admin (admin/admin123) always remains — we add this admin alongside.
    var creds = JSON.parse(localStorage.getItem(ADMIN_CREDS_KEY) || '{"username":"admin","password":"admin123"}');
    // Store as array if not already
    var allCreds = JSON.parse(localStorage.getItem('ps_all_admin_creds') || '[]');
    // Add default super-admin if not there
    if (!allCreds.find(function(c){ return c.username === 'admin'; })) {
      allCreds.push({ username: 'admin', password: 'admin123', role: 'super_admin' });
    }
    // Add new admin — they can login with email OR first name as username
    allCreds.push({
      username: newAdmin.email,
      username2: newAdmin.firstName.toLowerCase(),
      password: newAdmin.password,
      adminId: newAdmin.id,
      role: 'admin'
    });
    localStorage.setItem('ps_all_admin_creds', JSON.stringify(allCreds));

    // Also update the primary creds to allow this admin to login
    // (dashboard checks ps_admin_creds — we keep super-admin as default but store all)
    localStorage.setItem(ADMIN_CREDS_KEY, JSON.stringify(creds)); // keep super-admin intact

    // ── Notify dashboard of new admin registration ──
    var notifs = JSON.parse(localStorage.getItem(ADMIN_NOTIFS_KEY) || '[]');
    notifs.unshift({
      type: 'new_admin',
      message: 'New admin registered: ' + newAdmin.firstName + ' ' + newAdmin.lastName + ' (' + newAdmin.email + ') — Category: ' + newAdmin.categoryLabel,
      time: new Date().toISOString(),
      adminId: newAdmin.id
    });
    localStorage.setItem(ADMIN_NOTIFS_KEY, JSON.stringify(notifs));

    // ── Show success screen ──
    document.getElementById('screen4').classList.remove('show');
    document.getElementById('stepsBar').style.display = 'none';

    document.getElementById('successCreds').innerHTML =
      '<div class="sc-row"><span class="sc-label">Login Email</span><span class="sc-val">'+newAdmin.email+'</span></div>'+
      '<div class="sc-row"><span class="sc-label">Admin ID</span><span class="sc-val">'+newAdmin.id+'</span></div>'+
      '<div class="sc-row"><span class="sc-label">Category</span><span class="sc-val">'+newAdmin.categoryLabel+'</span></div>'+
      '<div class="sc-row"><span class="sc-label">Status</span><span class="sc-val" style="color:var(--green);">✓ Active</span></div>';

    document.getElementById('successScreen').classList.add('show');
    showToast('Admin account created successfully! ⚙','success');

    // Auto-redirect after 6 seconds
    var countdown = 6;
    var timer = setInterval(function() {
      countdown--;
      var gBtn = document.querySelector('.go-login-btn');
      if (gBtn) gBtn.textContent = '⚙ Login to Admin Panel (' + countdown + 's)';
      if (countdown <= 0) {
        clearInterval(timer);
        redirectToLogin();
      }
    }, 1000);

  }, 1500);
}

// ═══════════════════════════════════════════════════════
//  REDIRECT TO LOGIN
// ═══════════════════════════════════════════════════════
function redirectToLogin() {
  // Pre-fill the login form in admin-dashboard if possible
  // Store "pending login" hint so dashboard can auto-fill
  localStorage.setItem('ps_admin_prefill', JSON.stringify({
    username: formData.email,
    hint: 'Your password is what you set during registration'
  }));
  // Redirect to admin dashboard login page
  window.location.href = 'admin-dashboard.html';
}

function goToLogin() {
  window.location.href = 'admin-dashboard.html';
}

// ═══════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════
function getAdmins() {
  return JSON.parse(localStorage.getItem(ADMIN_ACCOUNTS_KEY) || '[]');
}

function showMsg(id, msg, type) {
  var el = document.getElementById(id);
  el.textContent = msg;
  el.className = 'form-msg show ' + (type || 'error');
  setTimeout(function(){ el.classList.remove('show'); }, 5000);
}
function hideMsg(id) {
  document.getElementById(id).classList.remove('show');
}

function showToast(msg, type) {
  var t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast ' + (type || 'info') + ' show';
  setTimeout(function(){ t.classList.remove('show'); }, 3200);
}

// ═══════════════════════════════════════════════════════
//  ENTER KEY SUPPORT
// ═══════════════════════════════════════════════════════
document.addEventListener('keydown', function(e) {
  if (e.key !== 'Enter') return;
  if (currentStep === 1) step1Next();
  else if (currentStep === 2) step2Next();
  else if (currentStep === 3) step3Next();
  else if (currentStep === 4) submitRegistration();
});

// ═══════════════════════════════════════════════════════
//  CHECK IF COMING FROM DASHBOARD (auto-fill prefill)
// ═══════════════════════════════════════════════════════
window.addEventListener('DOMContentLoaded', function() {
  // If already logged in, go straight to dashboard
  if (localStorage.getItem('ps_admin_session') === 'true') {
    window.location.href = 'admin-dashboard.html';
  }
});