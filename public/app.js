/* ================================================================
   Desi Chickenwala — app.js
   Customer storefront: lang, carousel, PIN, products, cart, orders
================================================================ */

// ── State ──────────────────────────────────────────────────────
let lang            = 'en';
let products        = [];
let stores          = [];
let cart            = [];
let activePinStore  = null;   // store object returned from PIN check

// ── Journey steps ──────────────────────────────────────────────
const JOURNEY = [
  { icon: 'fa-egg', color: '#B45309', bg: '#FEF3C7',
    t: { en:'Step 1: Own Hatchery',          mr:'पहिला टप्पा: स्वतःचे उबवणी केंद्र' },
    d: { en:'We operate our own DCC hatchery. Chicks are hatched and carefully transferred to our farms after a few days.',
         mr:'आम्ही आमचे उबवणी केंद्र स्वतः चालवतो. DCC कंपनीच्या केंद्रात पिल्ले उबल्यानंतर काही दिवसांनी आमच्या शेतात आणतो.' }},
  { icon: 'fa-hand-holding-heart', color: '#BE123C', bg: '#FFE4E6',
    t: { en:'Step 2: Loving Care for Chicks', mr:'दुसरा टप्पा: पिल्लांना प्रेमळ काळजी' },
    d: { en:'Chicks are regularly inspected with optimal warmth, balanced nutrition, and premium feed during their first three weeks.',
         mr:'पिल्लांची नियमित तपासणी, योग्य उबता, सर्व पोषणमूल्य आणि पहिल्या तीन आठवड्यात उत्तम खाद्य दिले जाते.' }},
  { icon: 'fa-dove', color: '#15803D', bg: '#DCFCE7',
    t: { en:'Step 3: Free-Range Rearing',     mr:'तिसरा टप्पा: मुक्त संचार पद्धत' },
    d: { en:'Healthy chicks roam freely in open pastures under natural sunlight with access to comfortable shelters.',
         mr:'निरोगी पिल्ले मोकळ्या शेतात सूर्यप्रकाशात मुक्तपणे फिरतात, आरामदायी शेडमध्ये जाण्याची परवानगी दिली जाते.' }},
  { icon: 'fa-wheat-awn', color: '#0369A1', bg: '#E0F2FE',
    t: { en:'Step 4: 100% Natural Diet',      mr:'चौथा टप्पा: नैसर्गिक आहार' },
    d: { en:'We provide natural grains, plants, and BSF (Black Soldier Fly) larvae. Birds are never force-fed.',
         mr:'नैसर्गिक धान्य, वनस्पती आणि BSF लार्वा दिले जाते. पक्षांवर कोणताही दबाव आणला जात नाही.' }},
  { icon: 'fa-spa', color: '#0D9488', bg: '#CCFBF1',
    t: { en:'Step 5: Natural Growth Pace',    mr:'पाचवा टप्पा: नैसर्गिक वाढ' },
    d: { en:'No growth chemicals, hormones, steroids, or antibiotics ever. Birds grow 100% naturally.',
         mr:'कोणतेही अनैसर्गिक केमिकल, स्टेरॉईड, एन्टीबायोटीक दिले जात नाही. पक्षी नैसर्गिकरीत्या वाढतात.' }},
  { icon: 'fa-truck-fast', color: '#4338CA', bg: '#E0E7FF',
    t: { en:'Step 6: Daily Fresh Transport',  mr:'सहावा टप्पा: दररोज ताजी वाहतूक' },
    d: { en:'Birds are transported fresh daily, following the highest biosafety and hygiene standards.',
         mr:'दररोज फ्रेश पक्षी वाहतूक. सर्वोच्च सुरक्षा आणि स्वच्छता प्रोटोकॉलचे पालन.' }},
  { icon: 'fa-hands-bubbles', color: '#047857', bg: '#D1FAE5',
    t: { en:'Step 7: Careful Processing',     mr:'सातवा टप्पा: काळजीपूर्वक हाताळणी' },
    d: { en:'Every order is dressed, cleaned, and packaged fresh individually under the highest sanitary standards.',
         mr:'प्रत्येक ऑर्डर स्वतंत्रपणे ताजी कापली, स्वच्छ केली आणि सर्वोच्च स्वच्छता मानकांनुसार पॅक केली जाते.' }},
  { icon: 'fa-certificate', color: '#6D28D9', bg: '#EDE9FE',
    t: { en:'Step 8: Freshness Guaranteed',   mr:'पायरी ८: ताजेपणाची हमी' },
    d: { en:'Delivering premium taste and health to your doorstep with cold-chain integrity.',
         mr:'उत्तम चव आणि आरोग्य तुमच्या दारापर्यंत पोहोचवणे — ताजेपणाची संपूर्ण हमी.' }}
];

// ── Init ────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  await Promise.all([loadStores(), loadProducts()]);
  renderJourney();
  initCarousel();
  initScrollFade();
  initHeaderScroll();
  initMobileCarts();
  switchLang('en');
});

// ── Mobile cart badge sync ──────────────────────────────────────
function initMobileCarts() {
  // Show mobile cart button on small screens
  const mobCart = document.getElementById('mob-cart');
  if (mobCart) {
    const check = () => { mobCart.style.display = window.innerWidth <= 768 ? 'flex' : 'none'; };
    check(); window.addEventListener('resize', check);
  }
}

// ── Data ────────────────────────────────────────────────────────
async function loadProducts() {
  try { const r = await fetch('/api/products'); products = await r.json(); renderProducts(); }
  catch(e) { console.error('Products:', e); }
}

async function loadStores() {
  try { const r = await fetch('/api/stores'); stores = await r.json(); renderFranchise(); }
  catch(e) { console.error('Stores:', e); }
}

// ── Language ─────────────────────────────────────────────────────
function switchLang(newLang) {
  lang = newLang;
  document.documentElement.setAttribute('lang', newLang);
  document.querySelectorAll('.lbtn').forEach(b => {
    b.classList.toggle('active', (newLang==='en' && b.textContent==='English') || (newLang==='mr' && b.textContent==='मराठी'));
  });
  document.querySelectorAll('[data-mr]').forEach(el => {
    el.innerHTML = lang==='mr' ? el.getAttribute('data-mr') : el.getAttribute('data-en');
  });
}

// ── Hamburger menu ────────────────────────────────────────────────
function toggleMenu() {
  const h = document.getElementById('hamburger');
  const m = document.getElementById('mobile-menu');
  h.classList.toggle('open');
  m.classList.toggle('open');
}

// ── Hero Carousel ─────────────────────────────────────────────────
let currentSlide = 0;
let slideTimer;

function initCarousel() {
  const slides = document.querySelectorAll('.slide');
  if (slides.length <= 1) return;
  startAutoSlide();
  // Pause on hover
  document.getElementById('hero-slider').addEventListener('mouseenter', stopAutoSlide);
  document.getElementById('hero-slider').addEventListener('mouseleave', startAutoSlide);
}

function goToSlide(n) {
  const track = document.getElementById('slides-track');
  const dots  = document.querySelectorAll('.dot');
  currentSlide = n;
  track.style.transform = `translateX(-${n * 100}%)`;
  dots.forEach((d,i) => d.classList.toggle('active', i===n));
}

function changeSlide(dir) {
  const total = document.querySelectorAll('.slide').length;
  goToSlide((currentSlide + dir + total) % total);
}

function startAutoSlide() {
  stopAutoSlide();
  slideTimer = setInterval(() => changeSlide(1), 5000);
}

function stopAutoSlide() { clearInterval(slideTimer); }

// ── Franchise Cards ───────────────────────────────────────────────
function renderFranchise() {
  const c = document.getElementById('franchise-cards');
  if (!c) return;
  c.innerHTML = '';
  stores.forEach(s => {
    const isActive = s.status === 'active';
    const div = document.createElement('div');
    div.className = 'franchise-card';
    div.innerHTML = `
      <div class="fc-top">
        <div class="fc-icon ${isActive?'active':'soon'}"><i class="fa-solid fa-store"></i></div>
        <div>
          <div class="fc-name">${lang==='mr'?s.nameMr:s.nameEn}</div>
          <div class="fc-status ${isActive?'active':'soon'}">${isActive?'✅ Active':'🔜 Coming Soon'}</div>
        </div>
      </div>
      ${s.address && s.address!=='Kolhapur, Maharashtra — Coming Soon'?`<div class="fc-detail"><i class="fa-solid fa-location-dot" style="margin-right:5px;color:var(--orange);"></i>${s.address.substring(0,70)}...</div>`:'<div class="fc-detail">📍 Location being finalized</div>'}
      ${s.contact&&s.contact!=='TBD'?`<div class="fc-detail"><i class="fa-solid fa-phone" style="margin-right:5px;color:var(--green);"></i>${s.contact}</div>`:''}
      ${isActive&&s.pinCodes?.length?`<span class="fc-pin">Serves ${s.pinCodes.length} PIN codes</span>`:`<span class="fc-pin">🔜 PIN zones coming soon</span>`}
    `;
    c.appendChild(div);
  });
}

// ── PIN Code Check ────────────────────────────────────────────────
async function checkPin() {
  const pin = document.getElementById('pin-input').value.trim();
  const resultEl = document.getElementById('pin-result');
  if (!/^\d{6}$/.test(pin)) {
    resultEl.className = 'pin-result fail';
    resultEl.style.display = 'block';
    resultEl.textContent = lang==='mr' ? '⚠️ कृपया ६ अंकी PIN कोड टाका.' : '⚠️ Please enter a valid 6-digit PIN code.';
    return;
  }
  resultEl.className = 'pin-result';
  resultEl.style.display = 'block';
  resultEl.textContent = lang==='mr' ? '🔍 तपासत आहे...' : '🔍 Checking...';
  try {
    const r    = await fetch(`/api/check-pincode/${pin}`);
    const data = await r.json();
    if (data.available) {
      activePinStore = data.store;
      resultEl.className = 'pin-result ok';
      const sname = lang==='mr' ? data.store.nameMr : data.store.nameEn;
      resultEl.innerHTML = lang==='mr'
        ? `✅ डिलिव्हरी उपलब्ध! <strong>${sname}</strong> द्वारे डिलिव्हरी केली जाईल.<br><small style="opacity:.8;font-weight:500;">📞 ${data.store.contact} · ⏰ ${data.store.timings}</small>`
        : `✅ Delivery available via <strong>${sname}</strong>!<br><small style="opacity:.8;font-weight:500;">📞 ${data.store.contact} · ⏰ ${data.store.timings}</small>`;
    } else {
      activePinStore = null;
      resultEl.className = 'pin-result fail';
      resultEl.textContent = lang==='mr'
        ? '❌ सध्या आम्ही या भागात डिलिव्हरी देत नाही. आम्ही लवकरच येऊ!'
        : '❌ Sorry, we do not deliver to this location yet. We will come soon!';
    }
  } catch(e) {
    resultEl.className = 'pin-result fail';
    resultEl.textContent = lang==='mr' ? 'काहीतरी चुकले. पुन्हा प्रयत्न करा.' : 'Something went wrong. Please try again.';
  }
}

// ── Products Render ───────────────────────────────────────────────
function renderProducts() {
  const c = document.getElementById('products-container');
  if (!c) return;
  c.innerHTML = '';
  products.forEach(p => {
    const card = document.createElement('div');
    card.className = 'product-card fi';
    card.id = `card-${p.id}`;
    const imgs = (p.images||[]).slice(0,2).map((src,i)=>
      `<img src="${src}" class="prod-img" alt="${p.nameEn} - ${i===0?'live':'cut'}" loading="lazy">`
    ).join('');
    card.innerHTML = `
      <div class="prod-img-wrap">
        <div class="prod-imgs" id="cr-${p.id}">${imgs}</div>
        <button class="img-nav prev" onclick="slideImg('${p.id}','prev')">&#10094;</button>
        <button class="img-nav next" onclick="slideImg('${p.id}','next')">&#10095;</button>
        <span class="age-badge">${p.ageEn}</span>
      </div>
      <div class="prod-body">
        <h3 class="prod-name" data-mr="${p.nameMr}" data-en="${p.nameEn}">${lang==='mr'?p.nameMr:p.nameEn}</h3>
        <p class="prod-sub" data-mr="${p.subMr}" data-en="${p.subEn}">${lang==='mr'?p.subMr:p.subEn}</p>
        <p class="prod-hi" data-mr="${p.highlightMr}" data-en="${p.highlightEn}">${lang==='mr'?p.highlightMr:p.highlightEn}</p>

        <div class="opt-panel">
          <div class="opt-lbl" data-mr="प्रकार निवडा" data-en="Select Form">Select Form</div>
          <div class="tile-grid">
            <div>
              <input type="radio" name="form-${p.id}" id="live-${p.id}" value="live" checked class="rt-input" onchange="updatePrice('${p.id}')">
              <label for="live-${p.id}" class="rt-label">
                <span class="tl" data-mr="जिवंत पक्षी" data-en="Live Bird">Live Bird</span>
                <span class="tp">₹${p.priceLive}/kg</span>
              </label>
            </div>
            <div>
              <input type="radio" name="form-${p.id}" id="cut-${p.id}" value="cut" class="rt-input" onchange="updatePrice('${p.id}')">
              <label for="cut-${p.id}" class="rt-label">
                <span class="tl" data-mr="कटिंग (१ किग्रा)" data-en="Cutting (1kg)">Cutting (1kg)</span>
                <span class="tp">₹${p.priceCut}/kg</span>
              </label>
            </div>
          </div>
        </div>

        <div class="opt-panel">
          <div class="roast-row">
            <div class="ri">
              <h4 data-mr="🔥 ताजे भाजलेले" data-en="🔥 Freshly Roasted">🔥 Freshly Roasted</h4>
              <p data-mr="कोळशावर भाजलेले (+₹${p.priceRoast})" data-en="Charcoal roasted (+₹${p.priceRoast})">Charcoal roasted (+₹${p.priceRoast})</p>
            </div>
            <label class="sw"><input type="checkbox" id="roast-${p.id}" onchange="updatePrice('${p.id}')"><span class="sl"></span></label>
          </div>
        </div>

        <div class="card-foot">
          <div class="price-bl">
            <div class="pl" data-mr="किंमत" data-en="Price">Price</div>
            <div class="pv" id="pv-${p.id}">₹${p.priceLive}</div>
          </div>
          <button class="add-btn" onclick="handleProductClick('${p.id}')" id="abtn-${p.id}">
            <i class="fa-solid fa-cart-plus"></i>
            <span data-mr="कार्टमध्ये जोडा" data-en="Add to Cart">Add to Cart</span>
          </button>
        </div>
      </div>
    `;
    c.appendChild(card);
  });
  setTimeout(() => initScrollFade(), 80);
  if (lang !== 'en') switchLang(lang);
}

// ── Image carousel ───────────────────────────────────────────────
function slideImg(id, dir) {
  const track = document.getElementById(`cr-${id}`);
  const isNext = dir === 'next';
  track.style.transform = isNext ? 'translateX(-50%)' : 'translateX(0)';
}

// ── Price update ─────────────────────────────────────────────────
function updatePrice(pid) {
  const p = products.find(x=>x.id===pid); if (!p) return;
  const isCut   = document.getElementById(`cut-${pid}`).checked;
  const isRoast = document.getElementById(`roast-${pid}`).checked;
  const price   = (isCut ? p.priceCut : p.priceLive) + (isRoast ? p.priceRoast : 0);
  document.getElementById(`pv-${pid}`).textContent = `₹${price}`;
}

// ── Journey Render ───────────────────────────────────────────────
function renderJourney() {
  const c = document.getElementById('journey-container');
  if (!c) return;
  c.innerHTML = '';
  JOURNEY.forEach((s,i) => {
    const d = document.createElement('div');
    d.className = 'jcard fi';
    d.innerHTML = `
      <div class="step-icon-wrap" style="color: ${s.color}; background: ${s.bg}; border-color: ${s.color}26;">
        <i class="fa-solid ${s.icon}"></i>
        <span class="step-badge" style="background: ${s.color};">${i+1}</span>
      </div>
      <div class="step-t">
        <h3 data-mr="${s.t.mr}" data-en="${s.t.en}">${lang==='mr'?s.t.mr:s.t.en}</h3>
        <p data-mr="${s.d.mr}" data-en="${s.d.en}">${lang==='mr'?s.d.mr:s.d.en}</p>
      </div>`;
    c.appendChild(d);
  });
  setTimeout(() => initScrollFade(), 80);
}

// ── Cart ─────────────────────────────────────────────────────────
function toggleCart(show) {
  document.getElementById('cart-drawer').classList.toggle('open', show);
  document.getElementById('cart-overlay').classList.toggle('on', show);
  if (show) renderCart();
}

function addToCart(pid) {
  const p     = products.find(x=>x.id===pid);
  const isCut = document.getElementById(`cut-${pid}`).checked;
  const roast = document.getElementById(`roast-${pid}`).checked;
  let price   = isCut ? p.priceCut : p.priceLive;
  let lEn = isCut ? 'Cutting (1kg)' : 'Live Bird';
  let lMr = isCut ? 'कटिंग (१ किग्रा)' : 'जिवंत पक्षी';
  if (roast) { price += p.priceRoast; lEn += ' + Roasted'; lMr += ' + भाजलेले'; }
  const key = `${pid}-${isCut?'c':'l'}-${roast?'r':'n'}`;
  const ex  = cart.find(x=>x.key===key);
  if (ex) ex.qty++; else cart.push({key,pid,nameMr:p.nameMr,nameEn:p.nameEn,lMr,lEn,price,qty:1});
  updateBadge();
  toggleCart(true);
  // Button flash
  const btn = document.getElementById(`abtn-${pid}`);
  const orig = btn.innerHTML;
  btn.innerHTML = '<i class="fa-solid fa-check"></i> Added!';
  btn.style.background = '#059669';
  setTimeout(() => { btn.innerHTML = orig; btn.style.background = ''; if(lang!=='en') switchLang(lang); }, 1100);
}

// ── Mobile Customizer ─────────────────────────────────────────────
let currentCustProductId = null;

function handleProductClick(pid) {
  openCustomizer(pid);
}

function openCustomizer(pid) {
  const p = products.find(x => x.id === pid);
  if (!p) return;
  currentCustProductId = pid;
  
  document.getElementById('cust-prod-name').textContent = lang === 'mr' ? p.nameMr : p.nameEn;
  document.getElementById('cust-prod-sub').textContent = lang === 'mr' ? p.subMr : p.subEn;
  
  const container = document.getElementById('cust-options-container');
  container.innerHTML = `
    <div class="opt-panel">
      <div class="opt-lbl">${lang === 'mr' ? 'प्रकार निवडा' : 'Select Form'}</div>
      <div class="tile-grid">
        <div>
          <input type="radio" name="cust-form" id="cust-live" value="live" checked class="rt-input" onchange="updateCustPrice()">
          <label for="cust-live" class="rt-label">
            <span class="tl">${lang === 'mr' ? 'जिवंत पक्षी' : 'Live Bird'}</span>
            <span class="tp">₹${p.priceLive}/kg</span>
          </label>
        </div>
        <div>
          <input type="radio" name="cust-form" id="cust-cut" value="cut" class="rt-input" onchange="updateCustPrice()">
          <label for="cust-cut" class="rt-label">
            <span class="tl">${lang === 'mr' ? 'कटिंग (१ किग्रा)' : 'Cutting (1kg)'}</span>
            <span class="tp">₹${p.priceCut}/kg</span>
          </label>
        </div>
      </div>
    </div>
    
    <div class="opt-panel">
      <div class="roast-row">
        <div class="ri">
          <h4>${lang === 'mr' ? '🔥 ताजे भाजलेले' : '🔥 Freshly Roasted'}</h4>
          <p>${lang === 'mr' ? `कोळशावर भाजलेले (+₹${p.priceRoast})` : `Charcoal roasted (+₹${p.priceRoast})`}</p>
        </div>
        <label class="sw"><input type="checkbox" id="cust-roast" onchange="updateCustPrice()"><span class="sl"></span></label>
      </div>
    </div>
  `;
  
  document.getElementById('custom-drawer').classList.add('open');
  document.getElementById('custom-drawer-overlay').classList.add('open');
  updateCustPrice();
}

function closeCustomizer() {
  document.getElementById('custom-drawer').classList.remove('open');
  document.getElementById('custom-drawer-overlay').classList.remove('open');
  currentCustProductId = null;
}

function updateCustPrice() {
  if (!currentCustProductId) return;
  const p = products.find(x => x.id === currentCustProductId);
  const isCut = document.getElementById('cust-cut').checked;
  const roast = document.getElementById('cust-roast').checked;
  let price = isCut ? p.priceCut : p.priceLive;
  if (roast) price += p.priceRoast;
  document.getElementById('cust-btn-price').textContent = `₹${price}`;
}

function confirmCustomAdd() {
  if (!currentCustProductId) return;
  const pid = currentCustProductId;
  const p = products.find(x => x.id === pid);
  const isCut = document.getElementById('cust-cut').checked;
  const roast = document.getElementById('cust-roast').checked;
  
  let price = isCut ? p.priceCut : p.priceLive;
  let lEn = isCut ? 'Cutting (1kg)' : 'Live Bird';
  let lMr = isCut ? 'कटिंग (१ किग्रा)' : 'जिवंत पक्षी';
  if (roast) { 
    price += p.priceRoast; 
    lEn += ' + Roasted'; 
    lMr += ' + भाजलेले'; 
  }
  
  const key = `${pid}-${isCut ? 'c' : 'l'}-${roast ? 'r' : 'n'}`;
  const ex = cart.find(x => x.key === key);
  if (ex) ex.qty++; else cart.push({ key, pid, nameMr: p.nameMr, nameEn: p.nameEn, lMr, lEn, price, qty: 1 });
  
  updateBadge();
  closeCustomizer();
  toggleCart(true);
}

function updateBadge() {
  const n = cart.reduce((s,c)=>s+c.qty,0);
  ['cart-badge','cart-badge-mob'].forEach(id => {
    const el = document.getElementById(id); if(el) el.textContent = n;
  });
}

function renderCart() {
  const c = document.getElementById('cart-items');
  const t = document.getElementById('cart-total');
  if (!cart.length) {
    c.innerHTML = `<div style="text-align:center;color:var(--text-soft);margin:3rem 0;"><i class="fa-solid fa-basket-shopping" style="font-size:2.8rem;margin-bottom:.75rem;display:block;"></i><p style="font-weight:600;">${lang==='mr'?'कार्ट रिकामी आहे':'Your cart is empty'}</p></div>`;
    t.textContent = '₹0'; return;
  }
  let grand = 0; c.innerHTML = '';
  cart.forEach(item => {
    const sub = item.price * item.qty; grand += sub;
    const div = document.createElement('div');
    div.className = 'cart-item';
    div.innerHTML = `
      <div class="ci-info">
        <div class="ci-name">${lang==='mr'?item.nameMr:item.nameEn}</div>
        <div class="ci-meta">${lang==='mr'?item.lMr:item.lEn}</div>
        <div class="ci-price">₹${item.price} × ${item.qty}</div>
      </div>
      <span class="ci-sub">₹${sub}</span>
      <button class="rm-btn" onclick="removeCart('${item.key}')"><i class="fa-solid fa-trash"></i></button>`;
    c.appendChild(div);
  });
  t.textContent = `₹${grand}`;
}

function removeCart(key) { cart = cart.filter(c=>c.key!==key); updateBadge(); renderCart(); }

// ── Checkout ──────────────────────────────────────────────────────
function openCheckout() {
  if (!cart.length) { alert(lang==='mr'?'कार्ट रिकामी आहे!':'Your cart is empty!'); return; }
  if (!activePinStore) {
    alert(lang==='mr'
      ? 'कृपया आधी PIN कोड तपासा आणि डिलिव्हरी उपलब्धता confirm करा.'
      : 'Please check your PIN code first to confirm delivery availability.');
    document.getElementById('pin-sec').scrollIntoView({behavior:'smooth'}); return;
  }
  toggleCart(false);
  const total = cart.reduce((s,c)=>s+c.price*c.qty,0);
  document.getElementById('upi-total').textContent = `Total: ₹${total}`;
  document.getElementById('checkout-modal').classList.add('open');
}

function closeCheckout() { document.getElementById('checkout-modal').classList.remove('open'); }
function toggleUPI(show) { document.getElementById('upi-box').style.display = show?'block':'none'; }

async function submitOrder(e) {
  e.preventDefault();
  if (!activePinStore) { alert('Please verify your PIN code first.'); return; }
  const total = cart.reduce((s,c)=>s+c.price*c.qty,0);
  const payload = {
    customerName:    document.getElementById('cust-name').value,
    customerPhone:   document.getElementById('cust-phone').value,
    deliveryAddress: document.getElementById('cust-address').value,
    paymentMethod:   document.querySelector('input[name="pay"]:checked').value,
    totalAmount:     total,
    storeId:         activePinStore.id,
    storeNameEn:     activePinStore.nameEn,
    storeNameMr:     activePinStore.nameMr,
    pinCode:         document.getElementById('pin-input').value.trim(),
    items:           cart
  };
  try {
    const res  = await fetch('/api/orders',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
    const data = await res.json();
    if (data.success) {
      closeCheckout();
      const sn = lang==='mr'?data.order.storeNameMr:data.order.storeNameEn;
      document.getElementById('success-details').innerHTML = lang==='mr'
        ? `ऑर्डर ID: <strong>${data.order.id}</strong><br>एकूण: <strong>₹${total}</strong><br>ऑर्डर <strong>${sn}</strong> कडे पाठवली गेली आहे. लवकरच संपर्क होईल.`
        : `Order ID: <strong>${data.order.id}</strong><br>Total: <strong>₹${total}</strong><br>Routed to <strong>${sn}</strong>. We'll contact you shortly.`;
      document.getElementById('success-modal').classList.add('open');
      cart = []; updateBadge();
      document.getElementById('order-form').reset();
      document.getElementById('upi-box').style.display = 'none';
    }
  } catch(err) { alert(lang==='mr'?'काहीतरी चुकले. पुन्हा प्रयत्न करा.':'Something went wrong. Please try again.'); }
}

function closeSuccess() { document.getElementById('success-modal').classList.remove('open'); }

// ── Scroll animations ─────────────────────────────────────────────
function initScrollFade() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => { if(e.isIntersecting){e.target.classList.add('on');obs.unobserve(e.target);} });
  }, {threshold:.1});
  document.querySelectorAll('.fi:not(.on)').forEach(el => obs.observe(el));
}

// ── Header scroll shadow ──────────────────────────────────────────
function initHeaderScroll() {
  window.addEventListener('scroll', () => {
    document.getElementById('main-header').classList.toggle('scrolled', window.scrollY > 30);
  });
}
