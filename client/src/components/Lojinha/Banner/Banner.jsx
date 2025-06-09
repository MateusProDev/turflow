import React, { useState, useEffect, useRef } from "react";
import "./Banner.css";

const SLIDE_INTERVAL = 5000; // 5 segundos

const Banner = ({ banners }) => {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const timeoutRef = useRef(null);

  // Avança o slide automaticamente
  useEffect(() => {
    if (paused || banners.length <= 1) return;
    timeoutRef.current = setTimeout(() => {
      setCurrent((prev) => (prev + 1) % banners.length);
    }, SLIDE_INTERVAL);
    return () => clearTimeout(timeoutRef.current);
  }, [current, paused, banners.length]);

  // Funções de navegação
  const goTo = (idx) => setCurrent(idx);
  const prev = () => setCurrent((prev) => (prev - 1 + banners.length) % banners.length);
  const next = () => setCurrent((prev) => (prev + 1) % banners.length);

  // Pausa ao mouse/touch
  const handlePause = () => setPaused(true);
  const handleResume = () => setPaused(false);

  if (!banners || banners.length === 0) return null;

  return (
    <div
      className="lojinha-banner slider"
      onMouseEnter={handlePause}
      onMouseLeave={handleResume}
      onTouchStart={handlePause}
      onTouchEnd={handleResume}
    >
      {/* Setas */}
      {banners.length > 1 && (
        <>
          <button className="slider-arrow left" onClick={prev} aria-label="Anterior">
            &#60;
          </button>
          <button className="slider-arrow right" onClick={next} aria-label="Próximo">
            &#62;
          </button>
        </>
      )}

      {/* Slides */}
      {banners.map((img, idx) => (
        <img
          key={idx}
          src={img}
          alt={`Banner ${idx + 1}`}
          className={`slider-img${idx === current ? " active" : ""}`}
          style={{ opacity: idx === current ? 1 : 0, zIndex: idx === current ? 2 : 1 }}
          draggable={false}
        />
      ))}

      {/* Bolinhas animadas */}
      <div className="slider-dots">
        {banners.map((_, idx) => (
          <div
            key={idx}
            className={`slider-dot${idx === current ? " active" : ""}`}
            onClick={() => goTo(idx)}
          >
            {idx === current && !paused && (
              <div
                className="slider-dot-progress"
                style={{ animationDuration: `${SLIDE_INTERVAL}ms` }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Banner;