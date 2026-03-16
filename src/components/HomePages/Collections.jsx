import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay } from 'swiper/modules';
import { Link } from 'react-router-dom';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/pagination';

function Collections() {
  const items = [
    { src: 'images/p (7).png', title: 'Woody', category: 'Warm & Earthy' },
    { src: 'images/p (9).png', title: 'Citrus', category: 'Fresh & Zesty' },
    { src: 'images/p (10).png', title: 'Flower', category: 'Delicate Floral' },
    { src: 'images/p (8).png', title: 'Aromatic', category: 'Spicy & Herbal' },
  ];

  return (
    <section className="py-12 md:py-24 bg-white">
      <div className="max-w-[1400px] mx-auto">
        
        {/* Title Design */}
        <div className="mb-12 text-left md:text-left" data-aos="fade-up">
          <span className="text-[10px] md:text-[12px] text-[#640d14] uppercase tracking-[0.4em] font-bold mb-3 block">
            Most Wanted
          </span>
          <h2 className="text-2xl md:text-4xl font-serif text-neutral-900 uppercase tracking-widest">
            Our <span className="italic font-light">Collections</span>
          </h2>
        </div>

        <Swiper
          modules={[Pagination, Autoplay]}
          slidesPerView={4}
          spaceBetween={24}
          pagination={{ clickable: true, dynamicBullets: true }}
          autoplay={{ delay: 5000, disableOnInteraction: false }}
          breakpoints={{
            0: { slidesPerView: 1.2, spaceBetween: 16 },
            640: { slidesPerView: 2, spaceBetween: 20 },
            1024: { slidesPerView: 3, spaceBetween: 24 },
            1200: { slidesPerView: 4, spaceBetween: 30 },
          }}
          className="pb-16 !overflow-visible"
        >
          {items.map((item, index) => (
            <SwiperSlide key={index} className="h-full">
              <Link
                to={{
                  pathname: `/category/${encodeURIComponent(item.title)}`,
                  search: `?note=${encodeURIComponent(item.title)}`
                }}
                className="group relative block w-full aspect-[3/4] overflow-hidden bg-neutral-100"
              >
                {/* Image Wrapper */}
                <div className="absolute inset-0 z-0">
                  <img 
                    src={item.src} 
                    alt={item.title} 
                    className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110" 
                  />
                  {/* Subtle Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />
                </div>

                {/* Content Overlay */}
                <div className="absolute inset-0 z-10 flex flex-col justify-end p-6 text-white">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-300 mb-1 translate-y-2 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                    {item.category}
                  </p>
                  <h3 className="text-2xl font-serif tracking-wide mb-4">
                    {item.title}
                  </h3>
                  
                  {/* Animated Button */}
                  <div className="overflow-hidden">
                    <span className="inline-block text-[11px] uppercase tracking-widest border-b border-white/50 pb-1 transform -translate-x-full transition-transform duration-500 group-hover:translate-x-0">
                      View Discovery
                    </span>
                  </div>
                </div>

                {/* Corner Accent (Premium Detail) */}
                <div className="absolute top-4 right-4 w-8 h-[1px] bg-white/30 scale-x-0 transition-transform duration-500 origin-right group-hover:scale-x-100" />
              </Link>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      {/* Custom Swiper Pagination Styling (Add to your CSS or use global styles) */}
      <style jsx global>{`
        .swiper-pagination-bullet-active {
          background: #640d14 !important;
          width: 20px !important;
          border-radius: 4px !important;
        }
      `}</style>
    </section>
  );
}

export default Collections;