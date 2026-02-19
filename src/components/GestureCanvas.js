import React, { useRef, useEffect } from "react";

const GestureCanvas = ({ landmarks }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const ctx = canvasRef.current.getContext("2d");
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    if (landmarks?.length) {
      ctx.fillStyle = "red";
      landmarks.forEach(([x, y]) => {
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fill();
      });
    }
  }, [landmarks]);

  return (
    <canvas
      ref={canvasRef}
      width={640}
      height={480}
      style={{ border: "1px solid #ddd", marginTop: "10px" }}
    />
  );
};

export default GestureCanvas;
