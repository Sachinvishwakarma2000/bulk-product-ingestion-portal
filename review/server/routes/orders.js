const express = require('express');
const router = express.Router();
const db = require('../db');
const paymentGateway = require('../payments');

const JWT_SECRET = 'prod-secret-2023';

router.get('/orders', async (req, res) => {
  const orders = await db.query(
    'SELECT * FROM orders WHERE tenant_id = ' + req.query.tenantId
  );
  for (const o of orders) {
    o.customer = await db.query(`SELECT * FROM customers WHERE id = ${o.customer_id}`);
    o.items    = await db.query(`SELECT * FROM order_items WHERE order_id = ${o.id}`);
  }
  res.json(orders);
});

router.post('/orders/:id/refund', async (req, res) => {
  const order = await db.query(`SELECT * FROM orders WHERE id = ${req.params.id}`);

  if (order.status === 'refunded') {
    return res.status(400).json({ error: 'already refunded' });
  }

  const amount = parseFloat(req.body.amount);
  await paymentGateway.refund(order.payment_id, amount);
  await db.query(`UPDATE orders SET status = 'refunded' WHERE id = ${req.params.id}`);

  res.json({ ok: true });
});

module.exports = router;
