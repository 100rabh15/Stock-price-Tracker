import React, {useState} from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
export default function Home({apiUrl}){
  const [q,setQ] = useState('');
  const [results,setResults] = useState([]);
  const nav = useNavigate();
  async function search(e){
    e.preventDefault();
    if(!q) return;
    const res = await axios.get((apiUrl||import.meta.env.VITE_API_URL) + '/api/stocks/search?q='+encodeURIComponent(q));
    setResults(res.data.matches||[]);
  }
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Search Stocks</h1>
      <form onSubmit={search} className="space-x-2 mb-4">
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="e.g. AAPL or Microsoft" className="border p-2 rounded" />
        <button className="bg-blue-600 text-white px-3 py-2 rounded">Search</button>
      </form>
      <div>
        {results.map(r=>(
          <div key={r.symbol} className="p-3 bg-white rounded shadow mb-2 flex justify-between items-center">
            <div>
              <div className="font-bold">{r.symbol}</div>
              <div className="text-sm">{r.name} — {r.region}</div>
            </div>
            <div>
              <button onClick={()=>nav('/stock/'+r.symbol)} className="mr-2 underline">View</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
