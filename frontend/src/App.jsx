import React, {useEffect, useState} from 'react';
import { Link, Routes, Route, useNavigate } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Watchlist from './pages/Watchlist';
import Dashboard from './pages/Dashboard';
import StockDetail from './pages/StockDetail';
function App(){
  const [user,setUser] = useState(null);
  useEffect(()=>{
    const token = localStorage.getItem('token');
    if(token) {
      fetch(import.meta.env.VITE_API_URL + '/api/auth/me', { headers: { Authorization: 'Bearer '+token }})
        .then(r=>r.json()).then(j=>{ if(j.user) setUser(j.user); else localStorage.removeItem('token') }).catch(()=>localStorage.removeItem('token'));
    }
  },[]);
  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="p-4 bg-white shadow flex justify-between">
        <div className="font-bold text-xl">Stock Price Tracker</div>
        <div className="space-x-4">
          <Link to="/" className="hover:underline">Home</Link>
          <Link to="/watchlist" className="hover:underline">Watchlist</Link>\n                  <Link to="/dashboard" className="hover:underline">Dashboard</Link>
          {user ? <span>{user.email}</span> : <Link to="/login">Login</Link>}
        </div>
      </nav>
      <main className="p-6">
        <Routes>
          <Route path="/" element={<Home apiUrl={import.meta.env.VITE_API_URL} />} />
          <Route path="/login" element={<Login setUser={setUser} />} />
          <Route path="/watchlist" element={<Watchlist user={user} />} />\n                  <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/stock/:symbol" element={<StockDetail apiUrl={import.meta.env.VITE_API_URL} />} />
        </Routes>
      </main>
    </div>
  );
}
export default App;
