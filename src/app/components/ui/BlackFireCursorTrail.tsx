import React, { useEffect, useRef } from 'react';

const colors = [
  "#f7ff0a", "#a0f303", "#4ede05", "#0bca07", "#08b53b", "#09a266", "#0a8e84", "#0a607b"
];

const CIRCLE_COUNT = 20;

type CircleElement = HTMLDivElement & { x: number; y: number };

export function BlackFireCursorTrail() {
  const animationRef = useRef<number | null>(null);
  const coords = useRef({ x: 0, y: 0 });
  const circleRefs = useRef<(CircleElement | null)[]>([]);

  useEffect(() => {
    // Initialize circle refs
    circleRefs.current = circleRefs.current.slice(0, CIRCLE_COUNT);
    
    circleRefs.current.forEach((circle, index) => {
      if (circle) {
        circle.x = 0;
        circle.y = 0;
        circle.style.backgroundColor = colors[index % colors.length];
      }
    });

    const handleMouseMove = (e: MouseEvent) => {
      coords.current.x = e.clientX;
      coords.current.y = e.clientY;
    };

    function animateCircles() {
      let x = coords.current.x;
      let y = coords.current.y;
      
      circleRefs.current.forEach((circle, index) => {
        if (!circle) return;
        
        circle.style.left = x - 12 + "px";
        circle.style.top = y - 12 + "px";
        
        circle.style.scale = ((CIRCLE_COUNT - index) / CIRCLE_COUNT).toString();
        
        circle.x = x;
        circle.y = y;

        const nextCircle = circleRefs.current[index + 1] || circleRefs.current[0];
        if (nextCircle) {
          x += (nextCircle.x - x) * 0.3;
          y += (nextCircle.y - y) * 0.3;
        }
      });
     
      animationRef.current = requestAnimationFrame(animateCircles);
    }

    animateCircles();
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <>
      {Array.from({ length: CIRCLE_COUNT }).map((_, i) => (
        <div
          key={i}
          ref={(el) => { 
            if (el) {
              circleRefs.current[i] = el as CircleElement;
              circleRefs.current[i]!.x = 0;
              circleRefs.current[i]!.y = 0;
            }
          }}
          style={{
            height: '24px',
            width: '24px',
            borderRadius: '24px',
            backgroundColor: 'black',
            position: 'fixed', 
            top: '0',
            left: '0',
            pointerEvents: 'none',
            zIndex: '99999999',
          }}
        />
      ))}
    </>
  );
}
