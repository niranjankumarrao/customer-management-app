import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';

export default function CustomerFormPage(props){
  const { id } = useParams();
  const editMode = Boolean(id);
  const [form, setForm] = useState({first_name:'', last_name:'', phone_number:''});
  const navigate = useNavigate();

  useEffect(()=>{
    if(editMode){
      axios.get(`http://localhost:5000/api/customers/${id}`)
        .then(r=> {
          const c = r.data.data;
          setForm({ first_name: c.first_name, last_name: c.last_name, phone_number: c.phone_number });
        })
        .catch(e=> console.error(e));
    }
  }, [id]);

  function save(){
    if(!form.first_name || !form.last_name || !form.phone_number){
      alert('Please fill required fields');
      return;
    }
    if(editMode){
      axios.put(`http://localhost:5000/api/customers/${id}`, form)
        .then(()=> { alert('Updated'); navigate(`/customers/${id}`); })
        .catch(e=> alert('Error: '+(e.response?.data?.error||e.message)));
    } else {
      axios.post('http://localhost:5000/api/customers', {...form})
        .then(r=> { alert('Created'); navigate(`/customers/${r.data.data.id}`); })
        .catch(e=> alert('Error: '+(e.response?.data?.error||e.message)));
    }
  }

  return (
    <div>
      <h2>{editMode ? 'Edit' : 'New'} Customer</h2>
      <div>
        <label>First name</label>
        <input value={form.first_name} onChange={e=>setForm({...form, first_name: e.target.value})} />
        <label>Last name</label>
        <input value={form.last_name} onChange={e=>setForm({...form, last_name: e.target.value})} />
        <label>Phone</label>
        <input value={form.phone_number} onChange={e=>setForm({...form, phone_number: e.target.value})} />
        <div>
          <button className="button" onClick={save}>{editMode ? 'Update' : 'Create'}</button>
          <button className="button" onClick={()=> navigate(-1)}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
