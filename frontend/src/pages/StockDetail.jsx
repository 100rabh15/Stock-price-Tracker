import React, {useEffect, useState, useRef} from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { Chart, LineController, LineElement, PointElement, LinearScale, Title, CategoryScale, TimeScale } from 'chart.js';
Chart.register(LineController, LineElement, PointElement, LinearScale, Title, CategoryScale, TimeScale);
export default function StockDetail({apiUrl}){
  const { symbol } = useParams();
  const [series, setSeries] = useState([]);
  const canvasRef = useRef();
  useEffect(()=>{
    async function load(){
      const res = await axios.get((apiUrl||import.meta.env.VITE_API_URL) + '/api/stocks/history/'+symbol);
      setSeries(res.data.series || []);
    }
    load();
  },[symbol]);
  useEffect(()=>{
    if(!series.length) return;
    const ctx = canvasRef.current.getContext('2d');
    const labels = series.map(s=>s.date);
    const data = series.map(s=>parseFloat(s['4. close']));
    // destroy previous chart if exists
    if(window.__last_chart) window.__last_chart.destroy();
    window.__last_chart = new Chart(ctx, {
      type: 'line',
      data: { labels, datasets: [{ label: symbol + ' close', data }] },
      options: { responsive: true, maintainAspectRatio: false }
    });
  },[series, symbol]);
  return (
    <div>
      <h2 className="text-xl font-bold mb-4">{symbol} — Historical</h2>
      <div className="h-96 bg-white p-4 rounded shadow">
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
}
