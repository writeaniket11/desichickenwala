const express = require('express');
const cors    = require('cors');
const fs      = require('fs');
const path    = require('path');
const multer  = require('multer');

const app      = express();
const PORT     = process.env.PORT || 3000;
const DB_PATH  = path.join(__dirname, 'db.json');
const UPLOADS  = path.join(__dirname, 'public', 'uploads');

if (!fs.existsSync(UPLOADS)) fs.mkdirSync(UPLOADS, { recursive: true });

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS),
  filename:    (req, file, cb) => cb(null, Date.now() + '-' + Math.round(Math.random()*1e9) + path.extname(file.originalname))
});
const upload = multer({ storage });

// DB helpers
const readDB  = () => { try { return JSON.parse(fs.readFileSync(DB_PATH,'utf8')); } catch { return {products:[],stores:[],orders:[],admins:[]}; } };
const writeDB = (d) => fs.writeFileSync(DB_PATH, JSON.stringify(d,null,2), 'utf8');

// ── PIN CODE CHECK ──────────────────────────────────────────────
app.get('/api/check-pincode/:pin', (req, res) => {
  const db   = readDB();
  const pin  = req.params.pin.trim();
  const lat  = parseFloat(req.query.lat);
  const lng  = parseFloat(req.query.lng);

  let selectedStore = null;
  let distance = null;

  // 1. If GPS coordinates are provided, do the 5km radius check
  if (!isNaN(lat) && !isNaN(lng)) {
    let closestStore = null;
    let minDistance = Infinity;

    // Helper to calculate Haversine distance
    const getDistance = (lat1, lon1, lat2, lon2) => {
      const R = 6371; // Earth's radius in km
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c;
    };

    db.stores.forEach(s => {
      if (s.status === 'active' && s.lat && s.lng) {
        const d = getDistance(lat, lng, s.lat, s.lng);
        if (d < minDistance) {
          minDistance = d;
          closestStore = s;
        }
      }
    });

    const maxRadius = closestStore ? (closestStore.radius || 5) : 5;
    if (closestStore && minDistance <= maxRadius) {
      selectedStore = closestStore;
      distance = minDistance;
    }
  }

  // 2. Fallback to pincode checking if no store matched the GPS radius check
  if (!selectedStore && pin !== 'gps' && pin !== '000000' && pin !== '') {
    selectedStore = db.stores.find(s => s.status === 'active' && s.pinCodes && s.pinCodes.includes(pin));
  }

  if (selectedStore) {
    res.json({ 
      available: true, 
      store: { 
        id: selectedStore.id, 
        nameEn: selectedStore.nameEn, 
        nameMr: selectedStore.nameMr, 
        address: selectedStore.address, 
        contact: selectedStore.contact, 
        timings: selectedStore.timings 
      },
      distance: distance ? parseFloat(distance.toFixed(2)) : null
    });
  } else {
    res.json({ available: false });
  }
});

// ── AUTH ────────────────────────────────────────────────────────
// Super Admin Login
app.post('/api/auth/admin', (req, res) => {
  const db = readDB();
  const { username, password } = req.body;
  const admin = (db.admins||[]).find(a => a.username===username && a.password===password && a.role==='superadmin');
  if (admin) res.json({ success:true, role:'superadmin', name:admin.name });
  else        res.status(401).json({ success:false, message:'Invalid credentials' });
});

// Store Login
app.post('/api/auth/store', (req, res) => {
  const db = readDB();
  const { username, password } = req.body;
  const store = (db.stores||[]).find(s => s.credentials && s.credentials.username===username && s.credentials.password===password);
  if (store) res.json({ success:true, role:'store', storeId:store.id, storeName:store.nameEn });
  else        res.status(401).json({ success:false, message:'Invalid store credentials' });
});

// ── PRODUCTS ────────────────────────────────────────────────────
app.get('/api/products', (req, res) => res.json(readDB().products||[]));

app.post('/api/products', upload.array('productImages',2), (req,res) => {
  const db = readDB();
  const { id, nameMr, nameEn, subMr, subEn, ageMr, ageEn, priceLive, priceCut, priceRoast, highlightMr, highlightEn } = req.body;
  const imageUrls = (req.files||[]).map(f=>`/uploads/${f.filename}`);
  const idx = db.products.findIndex(p=>p.id===id);
  const prod = {
    id: id||'prod_'+Date.now(), nameMr, nameEn, subMr, subEn, ageMr, ageEn,
    priceLive: +priceLive||0, priceCut: +priceCut||0, priceRoast: +priceRoast||0,
    highlightMr, highlightEn,
    images: imageUrls.length ? imageUrls : (idx>-1 ? db.products[idx].images : ['https://images.unsplash.com/photo-1548811579-017cf2a4268b?w=600','https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=600'])
  };
  if (idx>-1) db.products[idx]=prod; else db.products.push(prod);
  writeDB(db);
  res.json({ success:true, product:prod });
});

app.delete('/api/products/:id', (req,res) => {
  const db = readDB();
  db.products = db.products.filter(p=>p.id!==req.params.id);
  writeDB(db); res.json({success:true});
});

// ── STORES ──────────────────────────────────────────────────────
app.get('/api/stores', (req,res) => res.json(readDB().stores||[]));

app.post('/api/stores', (req,res) => {
  const db = readDB();
  const { id, nameMr, nameEn, address, owner, contact, ownerPhone, gmb, timings, status, pinCodes, username, password, lat, lng, radius } = req.body;
  const pins = Array.isArray(pinCodes) ? pinCodes : (typeof pinCodes==='string' ? pinCodes.split(',').map(p=>p.trim()).filter(Boolean) : []);
  const store = { 
    id:id||'store_'+Date.now(), nameMr, nameEn, address, owner, contact, ownerPhone, gmb, timings, status:status||'active', pinCodes:pins, credentials:{username,password},
    lat: parseFloat(lat) || 0,
    lng: parseFloat(lng) || 0,
    radius: parseFloat(radius) || 5
  };
  const idx = db.stores.findIndex(s=>s.id===store.id);
  if (idx>-1) db.stores[idx]=store; else db.stores.push(store);
  writeDB(db); res.json({success:true,store});
});

app.put('/api/stores/:id/pincodes', (req,res) => {
  const db = readDB();
  const store = db.stores.find(s=>s.id===req.params.id);
  if (!store) return res.status(404).json({success:false});
  const pins = Array.isArray(req.body.pinCodes) ? req.body.pinCodes : req.body.pinCodes.split(',').map(p=>p.trim()).filter(Boolean);
  store.pinCodes = pins;
  writeDB(db); res.json({success:true,store});
});

app.delete('/api/stores/:id', (req,res) => {
  const db = readDB();
  db.stores = db.stores.filter(s=>s.id!==req.params.id);
  writeDB(db); res.json({success:true});
});

app.put('/api/stores/:id/status', (req, res) => {
  const db = readDB();
  const store = db.stores.find(s => s.id === req.params.id);
  if (!store) return res.status(404).json({ success: false });
  store.status = req.body.status;
  writeDB(db);
  res.json({ success: true, store });
});

// ── ORDERS ──────────────────────────────────────────────────────
// Super admin — all orders
app.get('/api/orders', (req,res) => res.json(readDB().orders||[]));

// Store-specific orders (franchise login view)
app.get('/api/orders/store/:storeId', (req,res) => {
  const db = readDB();
  res.json((db.orders||[]).filter(o=>o.storeId===req.params.storeId));
});

app.post('/api/orders', (req,res) => {
  const db    = readDB();
  const order = { ...req.body, id:'ORD-'+Math.floor(100000+Math.random()*900000), timestamp:new Date().toISOString(), status:'Pending' };
  db.orders.push(order);
  writeDB(db); res.json({success:true,order});
});

app.put('/api/orders/:id', (req,res) => {
  const db = readDB();
  const o  = db.orders.find(o=>o.id===req.params.id);
  if (!o) return res.status(404).json({success:false});
  o.status = req.body.status;
  writeDB(db); res.json({success:true,order:o});
});

// ── FRANCHISE INQUIRIES ──────────────────────────────────────────
app.post('/api/franchise-inquiries', (req, res) => {
  const db = readDB();
  if (!db.inquiries) db.inquiries = [];
  const inquiry = {
    ...req.body,
    id: 'INQ-' + Date.now(),
    timestamp: new Date().toISOString(),
    status: 'New'
  };
  db.inquiries.push(inquiry);
  writeDB(db);
  res.json({ success: true, inquiry });
});

app.get('/api/franchise-inquiries', (req, res) => {
  res.json(readDB().inquiries || []);
});

app.put('/api/franchise-inquiries/:id', (req, res) => {
  const db = readDB();
  const inq = (db.inquiries || []).find(i => i.id === req.params.id);
  if (!inq) return res.status(404).json({ success: false });
  inq.status = req.body.status;
  writeDB(db);
  res.json({ success: true, inquiry: inq });
});

// Catch-all → storefront
app.get('*', (req,res) => res.sendFile(path.join(__dirname,'public','index.html')));

app.listen(PORT, () => console.log(`✅ Desi Chickenwala running → http://localhost:${PORT}`));
