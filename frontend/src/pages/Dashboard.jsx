import React, {useEffect, useState} from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

export default function Dashboard(){
  const [me, setMe] = useState(null);
  const [watchlist, setWatchlist] = useState([]);
  useEffect(()=>{
    const token = localStorage.getItem('token');
    if(!token) return;
    axios.get((import.meta.env.VITE_API_URL||'http://localhost:4000') + '/api/auth/me', { headers: { Authorization: 'Bearer '+token }})
      .then(r=>setMe(r.data.user))
      .catch(()=>{ localStorage.removeItem('token'); setMe(null); });
    axios.get((import.meta.env.VITE_API_URL||'http://localhost:4000') + '/api/stocks/watchlist', { headers: { Authorization: 'Bearer '+token }})
      .then(r=>setWatchlist(r.data.watchlist||[]));
  },[]);

  if(!me) return <div>Please login to see your dashboard</div>;
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <div className="bg-white p-4 rounded shadow mb-4">
        <div><strong>Email:</strong> {me.email}</div>
        <div><strong>Watchlist:</strong></div>
        <ul className="list-disc ml-6">
          {watchlist.map(s=> <li key={s}><Link to={'/stock/'+s} className="underline">{s}</Link></li>)}
        </ul>
      </div>
    </div>
  );
}
