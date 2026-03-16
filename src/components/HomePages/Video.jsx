import React, { useState, useEffect, useRef } from 'react';
import './VideoBanner.css';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

const HeroVideo = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [videoUrl, setVideoUrl] = useState(''); // no default
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && videoRef.current.readyState >= 3) {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    // Load directly from Firestore - uploaded videos take priority
    const ref = doc(db, 'siteConfig', 'videos');
    const unsub = onSnapshot(
      ref,
      (snap) => {
        const data = snap.exists() ? snap.data() : {};
        const nextUrl = data?.heroVideoUrl || '';
        console.log('[Hero Video] Firestore data:', data);
        console.log('[Hero Video] Setting URL to:', nextUrl);
        setVideoUrl(nextUrl);
      },
      (error) => {
        console.error('[Hero Video] Error loading from Firestore:', error);
      }
    );

    return () => unsub();
  }, []);

  if (!videoUrl) return null;

  return (
    <section className={`premium-hero ${isLoaded ? 'is-visible' : ''}`}>
      {/* The Grain Overlay adds a "film" texture to the video */}
      <div className="film-grain"></div>
      
      {/* The Vignette creates depth around the edges */}
      <div className="vignette"></div>

      <div className="video-frame">
        <video
          key={videoUrl}
          ref={videoRef}
          className="hero-video-element"
          autoPlay
          loop
          muted
          playsInline
          onLoadedData={() => setIsLoaded(true)}
          src={videoUrl}
        />
      </div>

      {/* Minimalist edge accent */}
      <div className="edge-accent top"></div>
      <div className="edge-accent bottom"></div>
    </section>
  );
};

export default HeroVideo;