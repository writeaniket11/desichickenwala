let products = [];
let stores = [];
let orders = [];

// Initialize Dashboard
document.addEventListener('DOMContentLoaded', () => {
  loadOrders();
  loadStores();
  loadProducts();
});

// ==================== LOAD OPERATIONS ====================

async function loadOrders() {
  try {
    const res = await fetch('/api/orders');
    orders = await res.json();
    document.getElementById('orders-count').innerText = orders.length;
    renderOrders();
  } catch (err) {
    console.error('Error loading orders:', err);
  }
}

async function loadStores() {
  try {
    const res = await fetch('/api/stores');
    stores = await res.json();
    renderStores();
  } catch (err) {
    console.error('Error loading stores:', err);
  }
}

async function loadProducts() {
  try {
    const res = await fetch('/api/products');
    products = await res.json();
  } catch (err) {
    console.error('Error loading products:', err);
  }
}

// ==================== RENDER DASHBOARD TABLES ====================

function renderOrders() {
  const tbody = document.getElementById('orders-tbody');
  tbody.innerHTML = '';

  if (orders.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-light);">No orders placed yet.</td></tr>`;
    return;
  }

  // Show newest orders first
  const sortedOrders = [...orders].reverse();

  sortedOrders.forEach(order => {
    // Format cart items summary
    const itemsSummary = order.items.map(item => 
      `• ${item.nameEn} (${item.optionEn}) x${item.qty}`
    ).join('<br>');

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${order.id}</strong><br><small style="color:var(--text-light);">${new Date(order.timestamp).toLocaleString()}</small></td>
      <td>
        <strong>${order.customerName}</strong><br>
        <i class="fa-solid fa-phone"></i> ${order.customerPhone}<br>
        <i class="fa-solid fa-location-dot"></i> ${order.deliveryAddress}
      </td>
      <td>
        <strong>${order.storeNameEn}</strong><br>
        <small style="color:var(--text-light);">Dist: ${order.customerCoords ? `Lat: ${order.customerCoords.lat.toFixed(4)}, Lng: ${order.customerCoords.lng.toFixed(4)}` : 'N/A'}</small>
      </td>
      <td style="font-size: 0.85rem;">${itemsSummary}</td>
      <td><strong>₹${order.totalAmount}</strong><br><small>${order.paymentMethod}</small></td>
      <td>
        <span class="status-badge status-${order.status}">${order.status}</span>
      </td>
      <td>
        <select class="admin-form-control" style="padding: 4px; font-size: 0.8rem; width: auto;" onchange="updateOrderStatus('${order.id}', this.value)">
          <option value="Pending" ${order.status === 'Pending' ? 'selected' : ''}>Pending</option>
          <option value="Preparing" ${order.status === 'Preparing' ? 'selected' : ''}>Dressing/Preparing</option>
          <option value="Dispatched" ${order.status === 'Dispatched' ? 'selected' : ''}>Dispatched</option>
          <option value="Delivered" ${order.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
          <option value="Cancelled" ${order.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
        </select>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function renderStores() {
  const tbody = document.getElementById('stores-tbody');
  tbody.innerHTML = '';

  stores.forEach(store => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <strong>${store.nameEn}</strong><br>
        <small style="color:var(--text-light);">${store.nameMr}</small>
      </td>
      <td>${store.address}</td>
      <td>
        <strong>Owner:</strong> ${store.owner} (${store.ownerPhone})<br>
        <strong>Shop Contacts:</strong> ${store.contact}
      </td>
      <td>Lat: ${store.lat}, Lng: ${store.lng}</td>
      <td>${store.radius} km</td>
      <td>
        <button class="action-btn delete" onclick="deleteStore('${store.id}')" title="Delete Location">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// ==================== ORDER CONTROLS ====================

async function updateOrderStatus(orderId, newStatus) {
  try {
    const res = await fetch(`/api/orders/${orderId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: newStatus })
    });
    
    const data = await res.json();
    if (data.success) {
      loadOrders();
    }
  } catch (err) {
    console.error('Error updating order status:', err);
  }
}

// ==================== PRODUCT FORM & ACTIONS ====================

function resetProductForm() {
  document.getElementById('product-form').reset();
  document.getElementById('prod-id').value = '';
  document.getElementById('product-form-title').innerHTML = `<i class="fa-solid fa-folder-plus"></i> Add / Edit Product`;
}

// Save Product (Multi-part upload for images)
async function saveProduct(e) {
  e.preventDefault();
  
  const formElement = document.getElementById('product-form');
  const formData = new FormData(formElement);

  try {
    const res = await fetch('/api/products', {
      method: 'POST',
      body: formData
    });

    const data = await res.json();
    if (data.success) {
      alert('Product saved successfully!');
      resetProductForm();
      loadProducts();
    }
  } catch (err) {
    console.error('Error saving product:', err);
    alert('Failed to save product.');
  }
}

// Load Product into Form for Edit
function editProduct(productId) {
  const prod = products.find(p => p.id === productId);
  if (!prod) return;

  document.getElementById('prod-id').value = prod.id;
  document.getElementById('prod-name-en').value = prod.nameEn;
  document.getElementById('prod-name-mr').value = prod.nameMr;
  document.getElementById('prod-sub-en').value = prod.subEn;
  document.getElementById('prod-sub-mr').value = prod.subMr;
  document.getElementById('prod-age-en').value = prod.ageEn;
  document.getElementById('prod-age-mr').value = prod.ageMr;
  document.getElementById('prod-price-live').value = prod.priceLive;
  document.getElementById('prod-price-cut').value = prod.priceCut;
  document.getElementById('prod-price-roast').value = prod.priceRoast;
  document.getElementById('prod-highlight-en').value = prod.highlightEn;
  document.getElementById('prod-highlight-mr').value = prod.highlightMr;

  document.getElementById('product-form-title').innerHTML = `<i class="fa-solid fa-pen-to-square"></i> Edit Product: ${prod.nameEn}`;
}

async function deleteProduct(productId) {
  if (!confirm('Are you sure you want to delete this product?')) return;
  try {
    const res = await fetch(`/api/products/${productId}`, {
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

// ==================== STORE FORM & ACTIONS ====================

async function saveStore(e) {
  e.preventDefault();

  const storeData = {
    id: document.getElementById('store-id').value || 'store_' + Date.now(),
    nameEn: document.getElementById('store-name-en').value,
    nameMr: document.getElementById('store-name-mr').value,
    address: document.getElementById('store-address').value,
    owner: document.getElementById('store-owner').value,
    ownerPhone: document.getElementById('store-owner-phone').value,
    contact: document.getElementById('store-contact').value,
    lat: parseFloat(document.getElementById('store-lat').value),
    lng: parseFloat(document.getElementById('store-lng').value),
    radius: parseFloat(document.getElementById('store-radius').value)
  };

  try {
    const res = await fetch('/api/stores', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(storeData)
    });

    const data = await res.json();
    if (data.success) {
      alert('Franchise store added successfully!');
      document.getElementById('store-form').reset();
      document.getElementById('store-id').value = '';
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
