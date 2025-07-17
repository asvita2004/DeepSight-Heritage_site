
import React, { useEffect, useState, useRef } from "react";
import "./SidebarImageOverlay.css";

const images = import.meta.glob('../assets/images/*.{jpg,jpeg,png}', {
  eager: true,
  import: 'default',
});

const prepareImages = () =>
  Object.entries(images).map(([path, src]) => {
    const fileName = path.split('/').pop();
    const [namePart] = fileName.split(".");
    const [title, location] = namePart.split(" – ").map(str => str.trim());
    return { src, title, location };
  });

const shuffleArray = (arr) => {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const SidebarImageOverlay = () => {
  const [shuffledImages, setShuffledImages] = useState(() => shuffleArray(prepareImages()));
  const sidebarRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const scrollSpeed = 25;

  useEffect(() => {
    const interval = setInterval(() => {
      setShuffledImages(shuffleArray(prepareImages()));
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const sidebar = sidebarRef.current;
    if (!isOpen || !sidebar) return;

    const handleMouseMove = (e) => {
      const rect = sidebar.getBoundingClientRect();
      const y = e.clientY - rect.top;
      const edgeThreshold = 60;
      if (y < edgeThreshold) {
        sidebar.scrollTop -= scrollSpeed;
      } else if (y > rect.height - edgeThreshold) {
        sidebar.scrollTop += scrollSpeed;
      }
    };

    sidebar.addEventListener("mousemove", handleMouseMove);
    return () => sidebar.removeEventListener("mousemove", handleMouseMove);
  }, [isOpen]);

  const handleWheel = (e) => {
    if (!sidebarRef.current) return;
    sidebarRef.current.scrollTop += e.deltaY;
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (e.clientX <= 40 && !isOpen) {
        setIsOpen(true);
      } else if (e.clientX > 300 && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [isOpen]);

  return (

    <div
      className={`sidebar ${isOpen ? "open" : "closed"}`}
      ref={sidebarRef}
      onWheel={handleWheel}
      style={{ width: isOpen ? '300px' : '40px', backgroundColor: isOpen ? '#dddddd62' : 'transparent' }}
    >

      <div className="sidebar-header">
        <h2 className="sidebar-title">Suggestions</h2>
      </div>
      <div className="overflow-y-auto max-h-[40]">
      <div className="image-stack overflow-y-hidden max-h-[40]">
        {shuffledImages.map((img, index) => (
          <div key={index} className="img-wrapper">
            <img src={img.src} alt={img.title} />
            <div className="overlay">
              <h3>{img.title}</h3>
              <p>{img.location}</p>
            </div>
          </div>
        ))}
      </div>
      </div>
    </div>
  );
};

export default SidebarImageOverlay;

