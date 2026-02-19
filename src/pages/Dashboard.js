import React, { useState, useRef, useEffect } from 'react';
import { Hands } from '@mediapipe/hands';
import * as cam from '@mediapipe/camera_utils';
import { Camera, CameraOff, Zap, Shield } from 'lucide-react';

const Dashboard = () => {
  const videoRef = useRef(null);
  const [isLive, setIsLive] = useState(false);
  const [prediction, setPrediction] = useState('Idle');
  let camera = null;

  const onResults = async (results) => {
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      const landmarks = results.multiHandLandmarks[0]; // Get first hand
      
      // SEND TO BACKEND (GesturePro)
      try {
        const response = await fetch('http://localhost:8000/process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ landmarks })
        });
        const data = await response.json();
        setPrediction(data.prediction); // e.g., "Palm_Open" -> Mutes Desktop
      } catch (err) {
        console.error("Backend Error", err);
      }
    }
  };

  useEffect(() => {
    if (isLive) {
      const hands = new Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
      });

      hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      hands.onResults(onResults);

      if (videoRef.current) {
        camera = new cam.Camera(videoRef.current, {
          onFrame: async () => {
            await hands.send({ image: videoRef.current });
          },
          width: 640,
          height: 480,
        });
        camera.start();
      }
    }
    return () => { if (camera) camera.stop(); };
  }, [isLive]);

  return (
    <div className="p-10 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-black text-white">Live Control</h1>
        <button 
          onClick={() => setIsLive(!isLive)}
          className={`px-8 py-4 rounded-2xl font-bold flex items-center gap-3 transition-all ${
            isLive ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-indigo-600 text-white'
          }`}
        >
          {isLive ? <><CameraOff size={20}/> Stop System</> : <><Camera size={20}/> Start System</>}
        </button>
      </div>
      
      <div className="grid grid-cols-3 gap-8">
        <div className="col-span-2 relative bg-[#161b22] rounded-[3rem] overflow-hidden aspect-video border border-slate-800">
            <video ref={videoRef} className="w-full h-full object-cover mirror" />
            {!isLive && <div className="absolute inset-0 bg-slate-900 flex items-center justify-center text-slate-500 uppercase font-black tracking-widest">System Offline</div>}
        </div>
        <div className="bg-[#161b22] p-8 rounded-[2.5rem] border border-slate-800">
            <p className="text-slate-500 text-xs font-black uppercase tracking-widest">Active Prediction</p>
            <h2 className="text-4xl font-black text-white mt-2">{prediction}</h2>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;