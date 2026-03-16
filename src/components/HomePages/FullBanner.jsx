import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

const FullScreenBanner = () => {
  const navigate = useNavigate();
  const [videoUrl, setVideoUrl] = useState(''); // no default
  const [isVideo, setIsVideo] = useState(false); // default to false

  const handleClick = () => {
    navigate('/category');
  };

  useEffect(() => {
    // Load directly from Firestore - uploaded videos take priority
    const ref = doc(db, 'siteConfig', 'videos');
    const unsub = onSnapshot(
      ref,
      (snap) => {
        const data = snap.exists() ? snap.data() : {};
        const nextUrl = data?.bannerVideoUrl || '';
        if (nextUrl) {
          setVideoUrl(nextUrl);
          setIsVideo(true);
        } else {
          setVideoUrl('');
          setIsVideo(false);
        }
      },
      (error) => {
        console.error('Error loading banner video config:', error);
        setIsVideo(false);
      }
    );

    return () => unsub();
  }, []);

  if (!isVideo || !videoUrl) return null; // Only show if we have an uploaded video

  return (
    <div
      onClick={handleClick}
      className="cursor-pointer"
      data-aos="zoom-in"
      data-aos-duration="800"
      data-aos-delay="200"
      style={{ position: 'relative', overflow: 'hidden' }}
    >
      <video
        key={videoUrl}
        src={videoUrl}
        alt="Mahirash Perfume Banner"
        className="mb-5"
        autoPlay
        loop
        muted
        playsInline
        style={{ width: '100%', height: 'auto', objectFit: 'cover' }}
      />
    </div>
  );
};

export default FullScreenBanner;
