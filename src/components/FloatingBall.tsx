'use client';
import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';

const FloatingBall = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartY, setDragStartY] = useState(0);
  const floatingBallRef = useRef<HTMLDivElement>(null);
  const clickThreshold = 5;

  const startDrag = (
    e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>
  ) => {
    setIsDragging(true);
    const clientX = 'clientX' in e ? e.clientX : e.touches[0].clientX;
    const clientY = 'clientY' in e ? e.clientY : e.touches[0].clientY;
    setDragStartX(clientX);
    setDragStartY(clientY);
    e.preventDefault();
  };

  const onDrag = (e: MouseEvent | TouchEvent) => {
    if (isDragging && floatingBallRef.current) {
      const clientX = 'clientX' in e ? e.clientX : e.touches[0].clientX;
      const clientY = 'clientY' in e ? e.clientY : e.touches[0].clientY;
      const floatingBall = floatingBallRef.current;

      floatingBall.style.right = `${
        window.innerWidth - clientX - floatingBall.offsetWidth / 2
      }px`;
      floatingBall.style.top = `${clientY - floatingBall.offsetHeight / 2}px`;
      floatingBall.style.left = 'auto';

      e.preventDefault();
    }
  };

  const endDrag = (e: MouseEvent | TouchEvent) => {
    if (isDragging && floatingBallRef.current) {
      setIsDragging(false);
      const endX = 'clientX' in e ? e.clientX : e.changedTouches[0].clientX;
      const endY = 'clientY' in e ? e.clientY : e.changedTouches[0].clientY;

      const dx = endX - dragStartX;
      const dy = endY - dragStartY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < clickThreshold) {
        // 触发点击事件
        console.log('Floating ball clicked'); // 在这里处理点击事件，例如路由跳转
      } else {
        floatingBallRef.current.style.right =
          window.innerWidth - endX < window.innerWidth / 2 ? '0' : 'auto';
        floatingBallRef.current.style.left =
          window.innerWidth - endX >= window.innerWidth / 2 ? '0' : 'auto';
      }

      e.preventDefault();
    }
  };

  useEffect(() => {
    // 组件挂载时添加全局监听器
    document.addEventListener('mousemove', onDrag);
    document.addEventListener('mouseup', endDrag);
    document.addEventListener('touchmove', onDrag, { passive: false });
    document.addEventListener('touchend', endDrag);

    // 组件卸载时移除监听器
    return () => {
      document.removeEventListener('mousemove', onDrag);
      document.removeEventListener('mouseup', endDrag);
      document.removeEventListener('touchmove', onDrag);
      document.removeEventListener('touchend', endDrag);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDragging]); // 依赖项数组中加上 isDragging 确保事件处理器使用的状态是最新的

  return (
    <div
      ref={floatingBallRef}
      id="floatingBall"
      onMouseDown={startDrag}
      onTouchStart={startDrag}
      className="fixed right-0 top-[30vh] cursor-pointer z-50"
    >
      <Image
        width={70}
        height={70}
        src="/images/home-levitated.png"
        alt="floating ball"
      />
    </div>
  );
};

export default FloatingBall;
