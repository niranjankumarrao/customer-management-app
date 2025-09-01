import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import CustomerListPage from './pages/CustomerListPage';
import CustomerDetailPage from './pages/CustomerDetailPage';
import CustomerFormPage from './pages/CustomerFormPage';

export default function App(){
  return (
    <BrowserRouter>
      <div className="container">
        <header>
          <h1>Customer Management</h1>
          <nav>
            <Link to="/">List</Link> | <Link to="/new">New Customer</Link>
          </nav>
        </header>
        <Routes>
          <Route path="/" element={<CustomerListPage/>} />
          <Route path="/customers/:id" element={<CustomerDetailPage/>} />
          <Route path="/new" element={<CustomerFormPage/>} />
          <Route path="/edit/:id" element={<CustomerFormPage editMode />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
