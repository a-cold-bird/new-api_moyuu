import React, { useEffect, useRef } from "react";

export function InteractiveHero({ children }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let currentX = 0;
    let currentY = 0;
    let targetX = 0;
    let targetY = 0;
    let animationFrameId;

    const handleMouseMove = (e) => {
      const { left, top, width, height } = container.getBoundingClientRect();
      targetX = (e.clientX - left) / width - 0.5;
      targetY = (e.clientY - top) / height - 0.5;
    };

    const update = () => {
      currentX += (targetX - currentX) * 0.08;
      currentY += (targetY - currentY) * 0.08;
      
      container.style.setProperty("--mouse-x", currentX.toFixed(4));
      container.style.setProperty("--mouse-y", currentY.toFixed(4));
      
      animationFrameId = requestAnimationFrame(update);
    };

    container.addEventListener("mousemove", handleMouseMove);
    animationFrameId = requestAnimationFrame(update);
    
    return () => {
      container.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <section 
      ref={containerRef} 
      className="home-hero-shell w-full relative overflow-hidden"
    >
      <div className="home-hero-overlay w-full" />
      
      <div 
        className="absolute inset-0 z-0 pointer-events-none will-change-transform"
        style={{
          transform: "translate3d(calc(var(--mouse-x, 0) * 160px), calc(var(--mouse-y, 0) * 160px), 0)"
        }}
      >
        <div className="home-orb home-orb-a" />
      </div>
      
      <div 
        className="absolute inset-0 z-0 pointer-events-none will-change-transform"
        style={{
          transform: "translate3d(calc(var(--mouse-x, 0) * -120px), calc(var(--mouse-y, 0) * -120px), 0)"
        }}
      >
        <div className="home-orb home-orb-b" />
      </div>
      
      <div 
        className="absolute inset-0 z-0 pointer-events-none will-change-transform"
        style={{
          transform: "translate3d(calc(var(--mouse-x, 0) * 80px), calc(var(--mouse-y, 0) * -150px), 0)"
        }}
      >
        <div className="home-orb home-orb-c" />
      </div>

      <div className="relative z-10 w-full">{children}</div>
    </section>
  );
}
