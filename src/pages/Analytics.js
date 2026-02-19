import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// IMPORTANT: This registration must happen outside the component
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const Analytics = () => {
  const [stats, setStats] = useState({ precision: '0%', epochs: 0, latency: '0ms' });
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        const response = await fetch('http://localhost:8000/metrics');
        const data = await response.json();
        
        if (data.labels && data.labels.length > 0) {
          setChartData({
            labels: data.labels,
            datasets: [{
              label: 'Precision %',
              data: data.accuracies,
              backgroundColor: 'rgba(99, 102, 241, 0.8)',
              borderRadius: 8
            }]
          });
          setStats({
            precision: data.overall_precision + '%',
            epochs: data.total_epochs || 1,
            latency: data.avg_latency + 'ms'
          });
        }
      } catch (e) {
        console.error("Could not sync metrics", e);
      }
    };
    loadMetrics();
  }, []);

  return (
    <div className="p-10 space-y-10 text-white animate-in fade-in duration-700">
      <header>
        <h1 className="text-4xl font-black">System Analytics</h1>
        <p className="text-slate-500 mt-2">Real-time performance metrics for GesturePro</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Model Precision', val: stats.precision },
          { label: 'Training Epochs', val: stats.epochs },
          { label: 'Avg Latency', val: stats.latency }
        ].map((s, i) => (
          <div key={i} className="bg-[#161b22] p-8 rounded-[2rem] border border-slate-800 shadow-xl">
            <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">{s.label}</p>
            <h3 className="text-3xl font-bold mt-2">{s.val}</h3>
          </div>
        ))}
      </div>

      {/* Chart Section */}
      <div className="bg-[#161b22] p-10 rounded-[3rem] border border-slate-800 shadow-2xl">
        <h2 className="text-xl font-bold mb-8">Gesture Accuracy Breakdown</h2>
        <div className="h-[400px]">
          {chartData ? (
            <Bar 
              data={chartData} 
              options={{ 
                responsive: true, 
                maintainAspectRatio: false,
                scales: { y: { beginAtZero: true, grid: { color: '#1e293b' } } } 
              }} 
            />
          ) : (
            <div className="h-full flex items-center justify-center border-2 border-dashed border-slate-800 rounded-3xl">
              <p className="text-slate-600 font-medium">No training data available. Run the Trainer first.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Analytics;