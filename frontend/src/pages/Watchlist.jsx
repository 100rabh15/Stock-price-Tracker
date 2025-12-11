import React, {useEffect, useState} from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import io from 'socket.io-client';
let socket;
export default function Watchlist({user}){
  const [list, setList] = useState([]);
  useEffect(()=>{
    if(!user) return;
    const token = localStorage.getItem('token');
    axios.get((import.meta.env.VITE_API_URL||'http://localhost:4000') + '/api/stocks/watchlist', { headers:{ Authorization: 'Bearer '+token }})
      .then(r=>setList(r.data.watchlist||[]));
    socket = io(import.meta.env.VITE_API_URL||'http://localhost:4000');
    return ()=>socket && socket.disconnect();
  },[user]);

  // subscribe to price updates for items in list
  useEffect(()=>{
    if(!socket) return;
    list.forEach(s=>socket.emit('subscribe', s));
    socket.on('price_update', p=>{
      // simple notification (could be richer)
      console.log('price update', p);
    });
  },[list]);

  if(!user) return <div>Please login to view watchlist</div>;
  return (
    <div>
      <h2 className="text-xl font-bold mb-3">Watchlist</h2>
      {list.map(s=>(
        <div key={s} className="p-3 bg-white rounded shadow mb-2 flex justify-between items-center">
          <div><Link to={'/stock/'+s} className="font-bold">{s}</Link></div>
        </div>
      ))}
    </div>
  );
}
