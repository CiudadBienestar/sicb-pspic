import React, { useEffect, useRef } from "react";
import logo from "../assets/Somos CB.png";

const ParticleLogo = ({
  imageSrc = logo,
  particleGap = 5,
  particleSize = 2.5,
  forceRadius = 120,
  attractionForce = 0.015,
  repulsionForce = 1.2,
  friction = 0.88,
}) => {
  const canvasRef = useRef(null);
  const particles = useRef([]);
  const mouse = useRef({ x: -9999, y: -9999 });
  const animationId = useRef(null);
  const img = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const setCanvasSize = () => {
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = canvas.parentElement.clientHeight;
    };

    setCanvasSize();

    img.current = new Image();
    img.current.src = imageSrc;

    img.current.onload = () => {
      createParticles();
      animate();
    };

    const createParticles = () => {
      const offCanvas = document.createElement("canvas");
      offCanvas.width = canvas.width;
      offCanvas.height = canvas.height;
      const offCtx = offCanvas.getContext("2d");
      offCtx.drawImage(img.current, 0, 0, canvas.width, canvas.height);
      const imageData = offCtx.getImageData(0, 0, canvas.width, canvas.height);

      particles.current = [];

      for (let y = 0; y < imageData.height; y += particleGap) {
        for (let x = 0; x < imageData.width; x += particleGap) {
          const i = (y * imageData.width + x) * 4;
          const a = imageData.data[i + 3];
          if (a > 128) {
            particles.current.push({
              x: Math.random() * canvas.width,
              y: Math.random() * canvas.height,
              targetX: x,
              targetY: y,
              vx: 0,
              vy: 0,
              color: `rgba(${imageData.data[i]},${imageData.data[i + 1]},${imageData.data[i + 2]},${a / 255})`,
            });
          }
        }
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.current.forEach((p) => {
        const dx = p.targetX - p.x;
        const dy = p.targetY - p.y;
        const forceX = dx * attractionForce;
        const forceY = dy * attractionForce;

        const dxMouse = p.x - mouse.current.x;
        const dyMouse = p.y - mouse.current.y;
        const distMouse = Math.sqrt(dxMouse ** 2 + dyMouse ** 2);

        let repelForceX = 0;
        let repelForceY = 0;

        if (distMouse < forceRadius) {
          const angle = Math.atan2(dyMouse, dxMouse);
          const strength = (forceRadius - distMouse) / forceRadius;
          repelForceX = Math.cos(angle) * strength * repulsionForce;
          repelForceY = Math.sin(angle) * strength * repulsionForce;
        }

        p.vx += forceX + repelForceX;
        p.vy += forceY + repelForceY;
        p.vx *= friction;
        p.vy *= friction;
        p.x += p.vx;
        p.y += p.vy;

        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, particleSize, particleSize);
      });

      animationId.current = requestAnimationFrame(animate);
    };

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.current.x = e.clientX - rect.left;
      mouse.current.y = e.clientY - rect.top;
    };

    const handleTouchMove = (e) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      mouse.current.x = e.touches[0].clientX - rect.left;
      mouse.current.y = e.touches[0].clientY - rect.top;
    };

    const handleMouseLeave = () => {
      mouse.current.x = -9999;
      mouse.current.y = -9999;
    };

    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
    canvas.addEventListener("mouseleave", handleMouseLeave);

    const handleResize = () => {
      cancelAnimationFrame(animationId.current);
      setCanvasSize();
      createParticles();
      animate();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationId.current);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("touchmove", handleTouchMove);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("resize", handleResize);
    };
  }, [imageSrc, particleGap, attractionForce, repulsionForce, friction, forceRadius, particleSize]);

  return (
      <div className="w-full h-[150px] sm:h-[150px] md:h-[200px] lg:h-[220px] xl:h-[500px] flex items-center justify-center">
      <canvas ref={canvasRef} className="rounded-lg w-full h-full" />
    </div>
  );
};

export default ParticleLogo;