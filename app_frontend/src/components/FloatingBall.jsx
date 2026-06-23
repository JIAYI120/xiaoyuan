import { useState, useRef, useEffect, useCallback } from 'react';
import styles from './FloatingBall.module.css';

function FloatingBall({ onClick }) {
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showParachute, setShowParachute] = useState(false);
  const [isSleeping, setIsSleeping] = useState(false);
  const ballRef = useRef(null);
  const startPosRef = useRef({ x: 0, y: 0 });
  const startBallPosRef = useRef({ x: 0, y: 0 });
  const currentBallPosRef = useRef({ x: 0, y: 0 });
  const sleepTimerRef = useRef(null);

  const resetSleepTimer = useCallback(() => {
    setIsSleeping(false);
    if (sleepTimerRef.current) clearTimeout(sleepTimerRef.current);
    sleepTimerRef.current = setTimeout(() => setIsSleeping(true), 10000);
  }, []);

  useEffect(() => {
    resetSleepTimer();
    return () => { if (sleepTimerRef.current) clearTimeout(sleepTimerRef.current); };
  }, [resetSleepTimer]);

  const snapToEdge = useCallback((ball, parent, withParachute) => {
    if (!ball || !parent) return;
    
    const targetY = parent.offsetHeight - ball.offsetHeight - 45;
    let currentX = parseInt(ball.style.left) || 0;
    const maxX = parent.offsetWidth - ball.offsetWidth;
    currentX = Math.max(0, Math.min(currentX, maxX));

    if (withParachute) {
      setShowParachute(true);
      ball.style.transition = 'top 2.5s ease-in-out, left 2.5s ease-in-out';
    } else {
      ball.style.transition = 'top 0.6s ease-out';
    }
    ball.style.left = `${currentX}px`;
    ball.style.top = `${targetY}px`;
    ball.style.right = 'auto';
    
    currentBallPosRef.current = { x: currentX, y: targetY };
    
    const duration = withParachute ? 2500 : 600;
    setTimeout(() => {
      if (ball) {
        ball.style.transition = '';
      }
      if (withParachute) {
        setShowParachute(false);
      }
    }, duration);
  }, []);

  const getClientPos = (e) => {
    if (e.touches && e.touches.length > 0) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    return { x: e.clientX, y: e.clientY };
  };

  const handleStart = useCallback((e) => {
    if (!ballRef.current) return;
    
    const ball = ballRef.current;
    const style = window.getComputedStyle(ball);
    const pos = getClientPos(e);
    
    startPosRef.current = pos;
    startBallPosRef.current = {
      x: parseInt(style.left) || 0,
      y: parseInt(style.top) || 0
    };
    currentBallPosRef.current = {
      x: parseInt(style.left) || 0,
      y: parseInt(style.top) || 0
    };
    
    ball.style.transition = '';
    setIsDragging(true);
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    const handleMove = (e) => {
      if (!ballRef.current) return;
      
      const ball = ballRef.current;
      const parent = ball.parentElement;
      if (!parent) return;
      
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const deltaX = clientX - startPosRef.current.x;
      const deltaY = clientY - startPosRef.current.y;
      
      let newX = startBallPosRef.current.x + deltaX;
      let newY = startBallPosRef.current.y + deltaY;
      
      const maxX = parent.offsetWidth - ball.offsetWidth;
      const maxY = parent.offsetHeight - ball.offsetHeight - 45;
      
      newX = Math.max(0, Math.min(newX, maxX));
      newY = Math.max(0, Math.min(newY, maxY));
      
      ball.style.left = `${newX}px`;
      ball.style.top = `${newY}px`;
      ball.style.right = 'auto';
      ball.style.bottom = 'auto';
      
      currentBallPosRef.current = { x: newX, y: newY };
    };

    const handleEnd = (e) => {
      setIsDragging(false);
      
      if (ballRef.current) {
        const clientX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
        const clientY = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;
        const deltaX = Math.abs(clientX - startPosRef.current.x);
        const deltaY = Math.abs(clientY - startPosRef.current.y);
        
        if (deltaX < 5 && deltaY < 5) {
          onClick?.();
        } else {
          const parent = ballRef.current.parentElement;
          const midY = parent ? parent.offsetHeight * 3 / 4 : 0;
          const currentY = parseInt(ballRef.current.style.top) || 0;
          const withParachute = currentY < midY;
          snapToEdge(ballRef.current, parent, withParachute);
        }
      }
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleMove);
    window.addEventListener('touchend', handleEnd);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, onClick, snapToEdge]);

  return (
    <div
      ref={ballRef}
      className={`${styles.floatingBall} ${isHovered ? styles.hovered : ''} ${isDragging ? styles.dragging : ''} ${isSleeping ? styles.sleeping : ''}`}
      onMouseEnter={() => { setIsHovered(true); resetSleepTimer(); }}
      onMouseLeave={() => setIsHovered(false)}
      onMouseDown={(e) => { resetSleepTimer(); handleStart(e); }}
      onTouchStart={(e) => { resetSleepTimer(); handleStart(e); }}
    >
      {showParachute && (
        <svg className={styles.parachute} viewBox="0 0 40 32" shapeRendering="crispEdges">
          <rect x="16" y="0" width="2" height="4" fill="#888"/>
          <rect x="22" y="0" width="2" height="4" fill="#888"/>
          <rect x="4" y="4" width="4" height="2" fill="#e04040"/>
          <rect x="8" y="2" width="4" height="2" fill="#e04040"/>
          <rect x="12" y="0" width="4" height="2" fill="#e04040"/>
          <rect x="16" y="0" width="8" height="2" fill="#e04040"/>
          <rect x="24" y="0" width="4" height="2" fill="#e04040"/>
          <rect x="28" y="2" width="4" height="2" fill="#e04040"/>
          <rect x="32" y="4" width="4" height="2" fill="#e04040"/>
          <rect x="2" y="6" width="4" height="2" fill="#e04040"/>
          <rect x="6" y="4" width="4" height="2" fill="#e04040"/>
          <rect x="30" y="4" width="4" height="2" fill="#e04040"/>
          <rect x="34" y="6" width="4" height="2" fill="#e04040"/>
          <line x1="6" y1="6" x2="16" y2="14" stroke="#888" strokeWidth="1"/>
          <line x1="34" y1="6" x2="24" y2="14" stroke="#888" strokeWidth="1"/>
          <line x1="20" y1="2" x2="20" y2="14" stroke="#888" strokeWidth="1"/>
        </svg>
      )}
      {isSleeping && (
        <div className={styles.zzz}>
          <span className={styles.zzzText}>Z</span>
          <span className={styles.zzzText2}>z</span>
          <span className={styles.zzzText3}>z</span>
        </div>
      )}
      <div className={styles.petContainer}>
        <svg viewBox="0 0 32 20" className={styles.pixelPet} shapeRendering="crispEdges">
          <rect x="6" y="2" width="20" height="12" fill="#e08860"/>
          <rect className={styles.leftArm} x="2" y="7" width="6" height="4" fill="#e08860"/>
          <rect className={styles.rightArm} x="24" y="7" width="6" height="4" fill="#e08860"/>
          {isSleeping ? (
            <g className={styles.sleepEyes}>
              <rect x="10" y="7" width="4" height="1" fill="#000"/>
              <rect x="18" y="7" width="4" height="1" fill="#000"/>
            </g>
          ) : (
            <g className={styles.eyes}>
              <rect x="10" y="6" width="2" height="3" fill="#000"/>
              <rect x="20" y="6" width="2" height="3" fill="#000"/>
            </g>
          )}
          <rect x="8" y="14" width="2" height="3" fill="#e08860"/>
          <rect x="12" y="14" width="2" height="3" fill="#e08860"/>
          <rect x="18" y="14" width="2" height="3" fill="#e08860"/>
          <rect x="22" y="14" width="2" height="3" fill="#e08860"/>
        </svg>
      </div>
    </div>
  );
}

export default FloatingBall;
