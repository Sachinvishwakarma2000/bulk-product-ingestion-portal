import { useState, useEffect } from 'react';
import Row from './Row';

export default function OrderList({ tenantId }) {
  const [orders, setOrders] = useState([]);
  const [query, setQuery]   = useState('');

  useEffect(() => {
    fetch(`/api/orders?tenantId=${tenantId}&q=${query}`)
      .then(r => r.json())
      .then(setOrders);
  }, [query]);

  const total = orders.reduce((sum, o) => sum + o.amount, 0);

  return (
    <div>
      <input onChange={e => setQuery(e.target.value)} />
      {orders.map(o => <Row key={Math.random()} order={o} />)}
      <p>Total: {total}</p>
    </div>
  );
}
