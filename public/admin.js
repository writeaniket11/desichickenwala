let products = [];
let stores = [];
let orders = [];
let inquiries = [];
let activeTab = 'overview';

// Initialize Dashboard
document.addEventListener('DOMContentLoaded', () => {
  // Set Admin display name
  const adminName = sessionStorage.getItem('adminName') || 'DCC Admin';
  document.getElementById('admin-display-name').innerText = adminName;
  document.getElementById('avatar-letter').innerText = adminName.charAt(0).toUpperCase();

  // Load Initial Data
  loadAllData();
  
  // Refresh data every 30 seconds
  setInterval(loadAllData, 30000);
});

// Load All Data in Parallel
async function loadAllData() {
  try {
    await Promise.all([
      loadOrders(),
      loadStores(),
      loadProducts(),
      loadInquiries()
    ]);
    calculateKPIs();
  } catch (err) {
    console.error('Error loading dashboard data:', err);
  }
}

// ==================== API FETCH OPERATIONS ====================

async function loadOrders() {
  const res = await fetch('/api/orders');
  orders = await res.json();
  if (activeTab === 'overview') renderOrders();
}

async function loadStores() {
  const res = await fetch('/api/stores');
  stores = await res.json();
  if (activeTab === 'stores') renderStores();
}

async function loadProducts() {
  const res = await fetch('/api/products');
  products = await res.json();
  if (activeTab === 'products') renderProducts();
}

async function loadInquiries() {
  const res = await fetch('/api/franchise-inquiries');
  inquiries = await res.json();
  if (activeTab === 'leads') renderInquiries();
}

// Calculate and Render KPI Stats
function calculateKPIs() {
  document.getElementById('kpi-total-orders').innerText = orders.length;
  document.getElementById('kpi-pending-orders').innerText = orders.filter(o => o.status === 'Pending').length;
  document.getElementById('kpi-active-stores').innerText = stores.filter(s => s.status === 'active').length;
  document.getElementById('kpi-total-leads').innerText = inquiries.length;
}

// ==================== PANEL SWITCHER & TAB ACTIONS ====================

function switchPanel(tab) {
  activeTab = tab;
  
  // Update sidebar links
  document.querySelectorAll('.menu-item').forEach(el => el.classList.remove('active'));
  document.getElementById(`menu-${tab}`).classList.add('active');
  
  // Update panel displays
  document.querySelectorAll('.panel').forEach(el => el.classList.remove('active'));
  document.getElementById(`panel-${tab}`).classList.add('active');
  
  // Update titles & descriptions
  const titleText = document.getElementById('panel-title-text');
  const descText = document.getElementById('panel-desc-text');
  const actionsContainer = document.getElementById('panel-actions-container');
  
  actionsContainer.innerHTML = '';
  
  if (tab === 'overview') {
    titleText.innerText = 'Orders Overview';
    descText.innerText = 'Manage customer orders and dispatch updates across all stores.';
    renderOrders();
  } else if (tab === 'stores') {
    titleText.innerText = 'Store Locations';
    descText.innerText = 'Manage company-owned and franchise DCC stores and geofence coordinates.';
    actionsContainer.innerHTML = `
      <button class="btn-primary-action" onclick="openStoreModal()">
        <i class="fa-solid fa-plus"></i> Add Store Location
      </button>
    `;
    renderStores();
  } else if (tab === 'products') {
    titleText.innerText = 'Product Manager';
    descText.innerText = 'Add, edit, or delete items on the customer-facing gavran chicken menu.';
    actionsContainer.innerHTML = `
      <button class="btn-primary-action" onclick="openProductModal()">
        <i class="fa-solid fa-plus"></i> Add New Product
      </button>
    `;
    renderProducts();
  } else if (tab === 'leads') {
    titleText.innerText = 'Franchise Leads';
    descText.innerText = 'Review partner applications, capital budget ranges, and location inquiries.';
    renderInquiries();
  }
}

// ==================== RENDER DATA TABLES ====================

function renderOrders() {
  const tbody = document.getElementById('orders-tbody');
  tbody.innerHTML = '';
  
  if (orders.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-soft); padding: 3rem;">No orders placed yet.</td></tr>`;
    return;
  }
  
  [...orders].reverse().forEach(o => {
    const itemsText = (o.items || []).map(i => `${i.nameEn || i.nameMr} (${i.lEn || i.optionEn || 'Live'}) × ${i.qty}`).join('<br>');
    const dateText = o.timestamp ? new Date(o.timestamp).toLocaleString('en-IN') : '-';
    
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <strong style="color:var(--orange); font-size: 0.95rem;">${o.id}</strong><br>
        <small style="color:var(--text-soft); font-size: 0.72rem;">${dateText}</small>
      </td>
      <td>
        <strong>${o.customerName}</strong><br>
        <i class="fa-solid fa-phone" style="font-size:0.75rem;color:var(--orange);"></i> ${o.customerPhone}<br>
        <small style="color:var(--text-soft);">${o.deliveryAddress || 'Store Pickup'}</small>
      </td>
      <td style="font-size: 0.8rem; line-height: 1.4;">${itemsText}</td>
      <td><strong style="color:var(--text);">₹${o.totalAmount}</strong><br><small style="color:var(--text-soft);font-size:0.72rem;">${o.paymentMethod}</small></td>
      <td><span style="font-weight: 700; color: var(--text-mid);"><i class="fa-solid fa-shop" style="font-size:0.75rem;"></i> ${o.storeNameEn}</span></td>
      <td>
        <span class="status-badge status-${o.status}">${o.status}</span>
      </td>
      <td>
        <select class="status-select" onchange="updateOrderStatus('${o.id}', this.value)">
          ${['Pending', 'Preparing', 'Dispatched', 'Delivered', 'Cancelled'].map(s => `<option value="${s}" ${o.status === s ? 'selected' : ''}>${s}</option>`).join('')}
        </select>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function renderStores() {
  const tbody = document.getElementById('stores-tbody');
  tbody.innerHTML = '';
  
  if (stores.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-soft); padding: 3rem;">No stores configured yet.</td></tr>`;
    return;
  }
  
  stores.forEach(s => {
    const isCompany = s.id === 'karad' ? 'Company-Owned' : 'Franchise Partner';
    const statusText = s.status === 'active' ? 'Active & Open' : (s.status === 'paused' ? 'Paused/Closed' : 'Coming Soon');
    const statusClass = s.status === 'active' ? 'Delivered' : (s.status === 'paused' ? 'Cancelled' : 'Pending');
    
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <strong>${s.nameEn}</strong><br>
        <small style="color:var(--text-soft); font-weight: 600;">${isCompany}</small>
      </td>
      <td style="font-size: 0.8rem; max-width: 200px;">${s.address}</td>
      <td>
        <strong>${s.owner}</strong><br>
        <i class="fa-solid fa-phone" style="font-size:0.75rem;"></i> ${s.contact}
      </td>
      <td>
        <span style="font-size:0.8rem; font-weight:600; color:var(--text-soft);">Lat: ${s.lat}, Lng: ${s.lng}</span><br>
        <span class="status-badge status-Preparing" style="font-size: 0.68rem; margin-top:0.25rem;">Radius: ${s.radius} km</span>
      </td>
      <td>
        <span class="status-badge status-${statusClass}">${statusText}</span>
      </td>
      <td>
        <button class="action-icon-btn edit" onclick="editStore('${s.id}')" title="Edit Location"><i class="fa-solid fa-pen-to-square"></i></button>
        ${s.id !== 'karad' ? `<button class="action-icon-btn delete" onclick="deleteStore('${s.id}')" title="Delete Location"><i class="fa-solid fa-trash"></i></button>` : ''}
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function renderProducts() {
  const tbody = document.getElementById('products-tbody');
  tbody.innerHTML = '';
  
  if (products.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-soft); padding: 3rem;">No products configured.</td></tr>`;
    return;
  }
  
  products.forEach(p => {
    const imageUrl = (p.images && p.images.length) ? p.images[0] : '/logo.jpg';
    
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><img src="${imageUrl}" alt="${p.nameEn}" style="width: 44px; height: 44px; object-fit: cover; border-radius: 6px; border: 1.5px solid var(--border);"></td>
      <td>
        <strong>${p.nameEn}</strong><br>
        <small style="color:var(--text-soft); font-weight:600;">${p.subEn}</small>
      </td>
      <td><strong>${p.ageEn}</strong></td>
      <td><strong style="color:var(--orange);">₹${p.priceLive} /kg</strong></td>
      <td><strong style="color:var(--green);">₹${p.priceCut} /kg</strong></td>
      <td><strong style="color:var(--text-soft);">+₹${p.priceRoast}</strong></td>
      <td>
        <button class="action-icon-btn edit" onclick="editProduct('${p.id}')" title="Edit Product"><i class="fa-solid fa-pen-to-square"></i></button>
        <button class="action-icon-btn delete" onclick="deleteProduct('${p.id}')" title="Delete Product"><i class="fa-solid fa-trash"></i></button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function renderInquiries() {
  const tbody = document.getElementById('leads-tbody');
  tbody.innerHTML = '';
  
  if (inquiries.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-soft); padding: 3rem;">No inquiries received yet.</td></tr>`;
    return;
  }
  
  [...inquiries].reverse().forEach(inq => {
    const dateText = inq.timestamp ? new Date(inq.timestamp).toLocaleString('en-IN') : '-';
    
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${inq.name}</strong></td>
      <td><i class="fa-solid fa-phone" style="font-size:0.75rem;color:var(--orange);"></i> ${inq.phone}</td>
      <td><strong>${inq.location}</strong></td>
      <td><span class="status-badge" style="background:#E0F2FE;color:#0369A1;font-weight:700;">${inq.budget}</span></td>
      <td style="font-size: 0.78rem; color:var(--text-soft);">${dateText}</td>
      <td>
        <span class="status-badge status-${inq.status === 'New' ? 'New' : 'Contacted'}">${inq.status}</span>
      </td>
      <td>
        ${inq.status === 'New' ? `
          <button class="btn-primary-action" onclick="contactInquirer('${inq.id}')" style="padding: 5px 12px; font-size: 0.72rem; box-shadow: none;">
            <i class="fa-solid fa-check"></i> Mark Contacted
          </button>
        ` : `<span style="font-size:0.8rem;color:var(--green);font-weight:700;"><i class="fa-solid fa-circle-check"></i> Contacted</span>`}
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// ==================== UPDATE ORDER STATUS ====================

async function updateOrderStatus(orderId, newStatus) {
  try {
    const res = await fetch(`/api/orders/${orderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    const data = await res.json();
    if (data.success) {
      loadOrders();
    }
  } catch (err) {
    console.error('Error updating order:', err);
    alert('Failed to update order status.');
  }
}

// ==================== CONTACT FRANCHISE INQUIRY ====================

async function contactInquirer(id) {
  try {
    const res = await fetch(`/api/franchise-inquiries/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'Contacted' })
    });
    const data = await res.json();
    if (data.success) {
      loadInquiries();
    }
  } catch (err) {
    console.error('Error updating inquiry status:', err);
  }
}

// ==================== MODAL: PRODUCT CONTROLS ====================

function openProductModal(prodId = null) {
  const modal = document.getElementById('product-modal');
  const title = document.getElementById('product-modal-title');
  const form = document.getElementById('product-form');
  
  form.reset();
  document.getElementById('prod-id').value = '';
  
  if (prodId) {
    const p = products.find(prod => prod.id === prodId);
    if (p) {
      title.innerText = 'Edit Product';
      document.getElementById('prod-id').value = p.id;
      document.getElementById('prod-name-en').value = p.nameEn;
      document.getElementById('prod-name-mr').value = p.nameMr;
      document.getElementById('prod-sub-en').value = p.subEn;
      document.getElementById('prod-sub-mr').value = p.subMr;
      document.getElementById('prod-age-en').value = p.ageEn;
      document.getElementById('prod-age-mr').value = p.ageMr;
      document.getElementById('prod-price-live').value = p.priceLive;
      document.getElementById('prod-price-cut').value = p.priceCut;
      document.getElementById('prod-price-roast').value = p.priceRoast;
      document.getElementById('prod-hl-en').value = p.highlightEn;
      document.getElementById('prod-hl-mr').value = p.highlightMr;
    }
  } else {
    title.innerText = 'Add New Product';
  }
  
  modal.classList.add('open');
}

function closeProductModal() {
  document.getElementById('product-modal').classList.remove('open');
}

async function saveProduct(e) {
  e.preventDefault();
  const id = document.getElementById('prod-id').value;
  const formData = new FormData();
  
  formData.append('id', id);
  formData.append('nameEn', document.getElementById('prod-name-en').value);
  formData.append('nameMr', document.getElementById('prod-name-mr').value);
  formData.append('subEn', document.getElementById('prod-sub-en').value);
  formData.append('subMr', document.getElementById('prod-sub-mr').value);
  formData.append('ageEn', document.getElementById('prod-age-en').value);
  formData.append('ageMr', document.getElementById('prod-age-mr').value);
  formData.append('priceLive', document.getElementById('prod-price-live').value);
  formData.append('priceCut', document.getElementById('prod-price-cut').value);
  formData.append('priceRoast', document.getElementById('prod-price-roast').value);
  formData.append('highlightEn', document.getElementById('prod-hl-en').value);
  formData.append('highlightMr', document.getElementById('prod-hl-mr').value);
  
  const filesInput = document.getElementById('prod-images');
  if (filesInput.files.length) {
    for (let i = 0; i < filesInput.files.length; i++) {
      formData.append('productImages', filesInput.files[i]);
    }
  }
  
  try {
    const res = await fetch('/api/products', {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    if (data.success) {
      closeProductModal();
      loadProducts();
    }
  } catch (err) {
    console.error('Error saving product:', err);
    alert('Failed to save product details.');
  }
}

async function deleteProduct(id) {
  if (!confirm('Are you sure you want to delete this product?')) return;
  try {
    const res = await fetch(`/api/products/${id}`, {
      method: 'DELETE'
    });
    const data = await res.json();
    if (data.success) {
      loadProducts();
    }
  } catch (err) {
    console.error('Error deleting product:', err);
  }
}

// ==================== MODAL: STORE CONTROLS ====================

function openStoreModal(storeId = null) {
  const modal = document.getElementById('store-modal');
  const title = document.getElementById('store-modal-title');
  const form = document.getElementById('store-form');
  
  form.reset();
  document.getElementById('store-id').value = '';
  
  if (storeId) {
    const s = stores.find(st => st.id === storeId);
    if (s) {
      title.innerText = 'Edit Store Location';
      document.getElementById('store-id').value = s.id;
      document.getElementById('store-name-en').value = s.nameEn;
      document.getElementById('store-name-mr').value = s.nameMr;
      document.getElementById('store-address').value = s.address;
      document.getElementById('store-owner').value = s.owner;
      document.getElementById('store-timings').value = s.timings;
      document.getElementById('store-contact').value = s.contact;
      document.getElementById('store-owner-phone').value = s.ownerPhone;
      document.getElementById('store-lat').value = s.lat;
      document.getElementById('store-lng').value = s.lng;
      document.getElementById('store-radius').value = s.radius;
      document.getElementById('store-gmb').value = s.gmb;
      document.getElementById('store-pins').value = s.pinCodes ? s.pinCodes.join(', ') : '';
      document.getElementById('store-user').value = s.credentials ? s.credentials.username : '';
      document.getElementById('store-pass').value = s.credentials ? s.credentials.password : '';
      document.getElementById('store-status').value = s.status || 'active';
    }
  } else {
    title.innerText = 'Add Store Location';
  }
  
  modal.classList.add('open');
}

function closeStoreModal() {
  document.getElementById('store-modal').classList.remove('open');
}

async function saveStore(e) {
  e.preventDefault();
  const id = document.getElementById('store-id').value;
  const payload = {
    id: id || 'store_' + Date.now(),
    nameEn: document.getElementById('store-name-en').value,
    nameMr: document.getElementById('store-name-mr').value,
    address: document.getElementById('store-address').value,
    owner: document.getElementById('store-owner').value,
    timings: document.getElementById('store-timings').value,
    contact: document.getElementById('store-contact').value,
    ownerPhone: document.getElementById('store-owner-phone').value,
    lat: document.getElementById('store-lat').value,
    lng: document.getElementById('store-lng').value,
    radius: document.getElementById('store-radius').value,
    gmb: document.getElementById('store-gmb').value,
    pinCodes: document.getElementById('store-pins').value,
    username: document.getElementById('store-user').value,
    password: document.getElementById('store-pass').value,
    status: document.getElementById('store-status').value
  };
  
  try {
    const res = await fetch('/api/stores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.success) {
      closeStoreModal();
      loadStores();
    }
  } catch (err) {
    console.error('Error saving store:', err);
    alert('Failed to save store location.');
  }
}

async function deleteStore(storeId) {
  if (!confirm('Are you sure you want to delete this franchise location?')) return;
  try {
    const res = await fetch(`/api/stores/${storeId}`, {
      method: 'DELETE'
    });
    const data = await res.json();
    if (data.success) {
      loadStores();
    }
  } catch (err) {
    console.error('Error deleting store:', err);
  }
}

// ==================== LOGOUT OPERATIONS ====================

function handleLogout() {
  sessionStorage.clear();
  window.location.href = '/login.html';
}
