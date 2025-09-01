const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const DB_FILE = path.join(__dirname, 'database.db');
const db = new sqlite3.Database(DB_FILE, (err) => {
  if (err) return console.error(err.message);
  console.log('Connected to SQLite database.');
});

// Initialize tables
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone_number TEXT NOT NULL UNIQUE,
    only_one_address INTEGER DEFAULT 0
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS addresses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER,
    address_details TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    pin_code TEXT NOT NULL,
    FOREIGN KEY(customer_id) REFERENCES customers(id) ON DELETE CASCADE
  )`);
});

// Helpers
function sendError(res, err) {
  console.error(err);
  res.status(400).json({ error: err.message || err });
}

// Routes
// Create customer (with optional first address payload)
app.post('/api/customers', (req, res) => {
  const { first_name, last_name, phone_number, addresses } = req.body;
  if (!first_name || !last_name || !phone_number) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const sql = `INSERT INTO customers (first_name, last_name, phone_number) VALUES (?,?,?)`;
  db.run(sql, [first_name, last_name, phone_number], function(err) {
    if (err) return sendError(res, err);
    const customerId = this.lastID;
    if (Array.isArray(addresses) && addresses.length) {
      const stmt = db.prepare(`INSERT INTO addresses (customer_id, address_details, city, state, pin_code) VALUES (?,?,?,?,?)`);
      addresses.forEach(a => {
        stmt.run(customerId, a.address_details, a.city, a.state, a.pin_code);
      });
      stmt.finalize(err2 => {
        if (err2) return sendError(res, err2);
        res.json({ message: 'Customer created', data: { id: customerId }});
      });
    } else {
      res.json({ message: 'Customer created', data: { id: customerId }});
    }
  });
});

// Get all customers with optional filters, pagination, sorting
app.get('/api/customers', (req, res) => {
  const { city, state, pin_code, page=1, limit=10, q, sort='id', order='ASC' } = req.query;
  const offset = (page - 1) * limit;
  let where = [];
  let params = [];
  if (city) { where.push('id IN (SELECT customer_id FROM addresses WHERE city = ?)'); params.push(city); }
  if (state) { where.push('id IN (SELECT customer_id FROM addresses WHERE state = ?)'); params.push(state); }
  if (pin_code) { where.push('id IN (SELECT customer_id FROM addresses WHERE pin_code = ?)'); params.push(pin_code); }
  if (q) { where.push('(first_name LIKE ? OR last_name LIKE ? OR phone_number LIKE ?)'); params.push('%'+q+'%','%'+q+'%','%'+q+'%'); }
  const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';
  const sql = `SELECT * FROM customers ${whereClause} ORDER BY ${sort} ${order} LIMIT ? OFFSET ?`;
  params.push(Number(limit), Number(offset));
  db.all(sql, params, (err, rows) => {
    if (err) return sendError(res, err);
    res.json({ message: 'success', data: rows });
  });
});

// Get customer details with addresses
app.get('/api/customers/:id', (req, res) => {
  const id = req.params.id;
  db.get('SELECT * FROM customers WHERE id = ?', [id], (err, customer) => {
    if (err) return sendError(res, err);
    if (!customer) return res.status(404).json({ error: 'Customer not found' });
    db.all('SELECT * FROM addresses WHERE customer_id = ?', [id], (err2, addresses) => {
      if (err2) return sendError(res, err2);
      customer.addresses = addresses || [];
      res.json({ message: 'success', data: customer });
    });
  });
});

// Update customer
app.put('/api/customers/:id', (req, res) => {
  const id = req.params.id;
  const { first_name, last_name, phone_number, only_one_address } = req.body;
  db.run(`UPDATE customers SET first_name = COALESCE(?, first_name), last_name = COALESCE(?, last_name), phone_number = COALESCE(?, phone_number), only_one_address = COALESCE(?, only_one_address) WHERE id = ?`,
    [first_name, last_name, phone_number, only_one_address, id],
    function(err) {
      if (err) return sendError(res, err);
      res.json({ message: 'Customer updated', changes: this.changes });
    });
});

// Delete customer (will cascade delete addresses via FK if supported; otherwise we delete addresses first)
app.delete('/api/customers/:id', (req, res) => {
  const id = req.params.id;
  db.run('DELETE FROM addresses WHERE customer_id = ?', [id], (err) => {
    if (err) return sendError(res, err);
    db.run('DELETE FROM customers WHERE id = ?', [id], function(err2) {
      if (err2) return sendError(res, err2);
      res.json({ message: 'Customer deleted', changes: this.changes });
    });
  });
});

// Address routes
app.post('/api/customers/:id/addresses', (req, res) => {
  const customerId = req.params.id;
  const { address_details, city, state, pin_code } = req.body;
  if (!address_details || !city || !state || !pin_code) return res.status(400).json({ error: 'Missing address fields' });
  db.run(`INSERT INTO addresses (customer_id, address_details, city, state, pin_code) VALUES (?,?,?,?,?)`,
    [customerId, address_details, city, state, pin_code],
    function(err) {
      if (err) return sendError(res, err);
      res.json({ message: 'Address added', data: { id: this.lastID }});
    });
});

app.get('/api/customers/:id/addresses', (req, res) => {
  const customerId = req.params.id;
  db.all('SELECT * FROM addresses WHERE customer_id = ?', [customerId], (err, rows) => {
    if (err) return sendError(res, err);
    res.json({ message: 'success', data: rows });
  });
});

app.put('/api/addresses/:addressId', (req, res) => {
  const id = req.params.addressId;
  const { address_details, city, state, pin_code } = req.body;
  db.run(`UPDATE addresses SET address_details = COALESCE(?, address_details), city = COALESCE(?, city), state = COALESCE(?, state), pin_code = COALESCE(?, pin_code) WHERE id = ?`,
    [address_details, city, state, pin_code, id],
    function(err) {
      if (err) return sendError(res, err);
      res.json({ message: 'Address updated', changes: this.changes });
    });
});

app.delete('/api/addresses/:addressId', (req, res) => {
  const id = req.params.addressId;
  db.run('DELETE FROM addresses WHERE id = ?', [id], function(err) {
    if (err) return sendError(res, err);
    res.json({ message: 'Address deleted', changes: this.changes });
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

