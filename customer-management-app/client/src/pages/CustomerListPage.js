import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

export default function CustomerListPage(){
  const [customers, setCustomers] = useState([]);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);

  useEffect(()=>{ fetchList(); }, [page]);

  function fetchList(){
    axios.get(`http://localhost:5000/api/customers?page=${page}&q=${encodeURIComponent(q)}`)
      .then(r=> setCustomers(r.data.data))
      .catch(e=> console.error(e));
  }

  function doSearch(e){
    e.preventDefault();
    setPage(1);
    fetchList();
  }

  return (
    <div>
      <h2>Customers</h2>
      <form onSubmit={doSearch}>
        <input placeholder="search name or phone" value={q} onChange={e=>setQ(e.target.value)} />
        <button className="button" type="submit">Search</button>
        <button className="button" type="button" onClick={()=>{ setQ(''); setPage(1); fetchList(); }}>Clear</button>
      </form>
      <table>
        <thead><tr><th>ID</th><th>Name</th><th>Phone</th><th>Actions</th></tr></thead>
        <tbody>
          {customers.map(c=>(
            <tr key={c.id}>
              <td>{c.id}</td>
              <td>{c.first_name} {c.last_name}</td>
              <td>{c.phone_number}</td>
              <td>
                <Link to={`/customers/${c.id}`}>View</Link> | <Link to={`/edit/${c.id}`}>Edit</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{marginTop:8}}>
        <button className="button" onClick={()=> setPage(p=> Math.max(1, p-1))}>Prev</button>
        <span> Page {page} </span>
        <button className="button" onClick={()=> setPage(p=> p+1)}>Next</button>
      </div>
    </div>
  );
}
