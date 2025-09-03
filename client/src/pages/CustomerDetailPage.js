import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, Link, useNavigate } from 'react-router-dom';

export default function CustomerDetailPage(){
  const { id } = useParams();
  const [customer, setCustomer] = useState(null);
  const [newAddr, setNewAddr] = useState({address_details:'', city:'', state:'', pin_code:''});
  const navigate = useNavigate();

  useEffect(()=>{ fetch(); }, [id]);

  function fetch(){
    axios.get(`http://localhost:5000/api/customers/${id}`)
      .then(r=> setCustomer(r.data.data))
      .catch(e=> console.error(e));
  }

  function addAddress(){
    axios.post(`http://localhost:5000/api/customers/${id}/addresses`, newAddr)
      .then(()=> { setNewAddr({address_details:'', city:'', state:'', pin_code:''}); fetch(); })
      .catch(e=> console.error(e));
  }

  function deleteAddress(addrId){
    if(!window.confirm('Delete address?')) return;
    axios.delete(`http://localhost:5000/api/addresses/${addrId}`)
      .then(()=> fetch())
      .catch(e=> console.error(e));
  }

  function deleteCustomer(){
    if(!window.confirm('Delete customer?')) return;
    axios.delete(`http://localhost:5000/api/customers/${id}`)
      .then(()=> navigate('/'))
      .catch(e=> console.error(e));
  }

  if(!customer) return <div>Loading...</div>;

  return (
    <div>
      <h2>Customer #{customer.id}</h2>
      <div><strong>Name:</strong> {customer.first_name} {customer.last_name}</div>
      <div><strong>Phone:</strong> {customer.phone_number}</div>
      <div style={{marginTop:12}}>
        <h3>Addresses</h3>
        {customer.addresses.length === 0 && <div>No addresses</div>}
        <ul>
          {customer.addresses.map(a=>(
            <li key={a.id}>
              {a.address_details} — {a.city}, {a.state} - {a.pin_code}
              {' '}<button onClick={()=> deleteAddress(a.id)} className="button">Delete</button>
            </li>
          ))}
        </ul>
        <div style={{marginTop:8}}>
          <h4>Add address</h4>
          <input placeholder="address" value={newAddr.address_details} onChange={e=>setNewAddr({...newAddr,address_details:e.target.value})} />
          <input placeholder="city" value={newAddr.city} onChange={e=>setNewAddr({...newAddr,city:e.target.value})} />
          <input placeholder="state" value={newAddr.state} onChange={e=>setNewAddr({...newAddr,state:e.target.value})} />
          <input placeholder="pin" value={newAddr.pin_code} onChange={e=>setNewAddr({...newAddr,pin_code:e.target.value})} />
          <button className="button" onClick={addAddress}>Add</button>
        </div>
      </div>
      <div style={{marginTop:12}}>
        <Link to={`/edit/${customer.id}`}>Edit Customer</Link> | <button className="button" onClick={deleteCustomer}>Delete Customer</button>
      </div>
    </div>
  );
}
