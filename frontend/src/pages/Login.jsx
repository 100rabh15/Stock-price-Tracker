import React, {useState} from 'react';
export default function Login({setUser}){
  const [email,setEmail]=useState(''); const [password,setPassword]=useState('');
  async function submit(e){
    e.preventDefault();
    const mode = 'login';
    const url = (import.meta.env.VITE_API_URL||'http://localhost:4000') + '/api/auth/' + mode;
    const r = await fetch(url, { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ email, password })});
    const j = await r.json();
    if(j.token){
      localStorage.setItem('token', j.token);
      setUser(j.user);
      window.location.href = '/';
    } else {
      alert(j.error || 'failed');
    }
  }
  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">Login</h2>
      <form onSubmit={submit} className="space-y-3">
        <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="email" className="w-full p-2 border rounded" />
        <input value={password} onChange={e=>setPassword(e.target.value)} placeholder="password" type="password" className="w-full p-2 border rounded" />
        <div className="flex gap-2">
          <button className="bg-blue-600 text-white px-3 py-2 rounded">Login</button>
        </div>
      </form>
    </div>
  );
}
