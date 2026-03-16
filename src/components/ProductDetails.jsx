import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { db } from './firebase';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { usePreloader } from '../context/PreloaderContext';
import WishlistButton from './WishlistButton';

// Premium Icons Component
const PremiumIcons = {
  Star: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
    </svg>
  ),
  Truck: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18 18.5c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5-1.5.67-1.5 1.5.67 1.5 1.5 1.5zM19.5 9.5H17V12h4.46L19.5 9.5zM6 18.5c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5-1.5.67-1.5 1.5.67 1.5 1.5 1.5zM20 8l3 4v5h-2c0 1.66-1.34 3-3 3s-3-1.34-3-3H9c0 1.66-1.34 3-3 3s-3-1.34-3-3H1V6c0-1.11.89-2 2-2h14v4h3z" />
    </svg>
  ),
  Shield: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
    </svg>
  ),
  Package: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M21 16.5c0 .38-.21.71-.53.88l-7.9 4.44c-.16.12-.36.18-.57.18-.21 0-.41-.06-.57-.18l-7.9-4.44A.991.991 0 013 16.5v-9c0-.38.21-.71.53-.88l7.9-4.44c.16-.12.36-.18.57-.18.21 0 .41.06.57.18l7.9 4.44c.32.17.53.5.53.88v9zM12 4.15L6.04 7.5 12 10.85l5.96-3.35L12 4.15z" />
    </svg>
  )
};

function ProductDetails() {
  // Context hooks
  const { id } = useParams();
  const location = useLocation();
  const { addToCart, isInCart } = useCart();
  const { showToast } = useToast();
  const { showPreloader, hidePreloader } = usePreloader();

  // State hooks
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [accordionOpen, setAccordionOpen] = useState('description');
  const [buttonLoading, setButtonLoading] = useState(false);
  const [selectedSizeIdx, setSelectedSizeIdx] = useState(0);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [relatedLoading, setRelatedLoading] = useState(true);

  // Memoized callbacks
  const handleQuantityChange = useCallback((delta) => {
    setQuantity((prev) => Math.max(1, prev + delta));
  }, []);

  const getProductPrimaryImage = useCallback((p) => {
    if (!p) return '';
    if (Array.isArray(p.sizes)) {
      const size50 = p.sizes.find(sz => sz && typeof sz === 'object' && sz.size === '50ml');
      if (size50 && Array.isArray(size50.images) && size50.images[0]) return size50.images[0];
      for (const sz of p.sizes) {
        if (sz && Array.isArray(sz.images) && sz.images[0]) return sz.images[0];
      }
    }
    return p.image || p.hoverImage || p.image3 || p.image4 || '';
  }, []);

  const formatPrice = useCallback((price) => {
    const num = typeof price === 'string' ? parseFloat(price) : price;
    return isNaN(num) ? '0.00' : num.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }, []);

  // Memoized values
  const sizesArr = useMemo(() => {
    if (!product) return [];

    const p = product;
    const baseSizes = Array.isArray(p.sizes) && p.sizes.length > 0
      ? p.sizes
      : [{
        size: p.size || 'Standard',
        price: p.price || 0,
        oldPrice: p.oldPrice || '',
        images: [p.image, p.hoverImage, p.image3, p.image4].filter(Boolean),
        stock: p.stock,
        isOutOfStock: !!p.isOutOfStock
      }];

    return baseSizes.map(sz => {
      // Logic: Out of stock if stock field exists and is <= 0
      // If stock is undefined or null, we assume it's in stock (backwards compatibility)
      const stockVal = sz.stock !== undefined && sz.stock !== null ? Number(sz.stock) : null;
      const isOOS = (stockVal !== null && stockVal <= 0) || sz.isOutOfStock === true;

      return {
        ...sz,
        isOutOfStock: !!isOOS
      };
    });
  }, [product]);

  const finalDefaultIdx = useMemo(() => {
    if (sizesArr.length === 0) return 0;
    if (location.state?.fromBannerFresh) {
      const defaultIdx = sizesArr.findIndex(s => (s && s.size) === '10ml');
      const fallbackIdx = sizesArr.findIndex(s => (s && s.size) === '50ml');
      return defaultIdx >= 0 ? defaultIdx : (fallbackIdx >= 0 ? fallbackIdx : 0);
    } else {
      if (location.state?.preferredSize) {
        const preferredIdx = sizesArr.findIndex(s => (s && s.size) === location.state.preferredSize);
        if (preferredIdx >= 0) return preferredIdx;
      }

      const defaultIdx = sizesArr.findIndex(s => (s && s.size) === '50ml');
      if (defaultIdx >= 0) return defaultIdx;

      let highestIdx = 0;
      let highestValue = -1;
      sizesArr.forEach((sz, idx) => {
        if (sz && sz.size) {
          const match = sz.size.toString().match(/(\d+(?:\.\d+)?)/);
          const value = match ? parseFloat(match[1]) : null;
          if (value !== null && value > highestValue) {
            highestValue = value;
            highestIdx = idx;
          }
        }
      });
      return highestIdx;
    }
  }, [sizesArr, location.state?.fromBannerFresh, location.state?.preferredSize]);

  const preferredSizeIndex = useMemo(() => {
    if (sizesArr.length === 0) return 0;
    const preferredIdx = finalDefaultIdx ?? 0;
    if (sizesArr[preferredIdx] && !sizesArr[preferredIdx].isOutOfStock) {
      return preferredIdx;
    }
    const firstAvailable = sizesArr.findIndex(sz => !sz.isOutOfStock);
    return firstAvailable !== -1 ? firstAvailable : preferredIdx;
  }, [sizesArr, finalDefaultIdx]);

  const productImages = useMemo(() => {
    if (sizesArr.length === 0) return [];
    const selected = sizesArr[selectedSizeIdx] || sizesArr[preferredSizeIndex] || sizesArr[0];
    return Array.isArray(selected?.images) && selected.images.length > 0
      ? selected.images
      : (product
        ? [product.image,
        (product.hoverImage && product.hoverImage !== product.image) ? product.hoverImage : null,
        product.image3,
        product.image4
        ].filter(Boolean)
        : []);
  }, [sizesArr, selectedSizeIdx, preferredSizeIndex, product]);

  const selectedSize = sizesArr[selectedSizeIdx] || sizesArr[preferredSizeIndex] || sizesArr[0] || {};
  const isPreOrder = !!product?.isPreOrder;
  const isSelectedSizeOut = !isPreOrder && !!selectedSize?.isOutOfStock;
  const isAlreadyInCart = useMemo(() => {
    if (!product || !selectedSize) return false;
    return isInCart(product.id, selectedSize.size);
  }, [product?.id, selectedSize?.size, isInCart]);

  const getWhatsAppNotifyUrl = useCallback(() => {
    const phoneNumber = '919584826112';
    const productName = product?.name || 'product';
    const sizeLabel = selectedSize?.size ? ` (${selectedSize.size})` : '';
    const message = `Hi! I'm interested in "${productName}${sizeLabel}". Please notify me when it's back in stock.`;
    return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
  }, [product?.name, selectedSize?.size]);

  const handlePreOrderWhatsApp = useCallback(() => {
    const phoneNumber = '919584826112';
    const productName = product?.name || 'product';
    const sizeLabel = selectedSize?.size ? ` (${selectedSize.size})` : '';
    const message = `Hi! I'm interested in Pre-ordering the "${productName}${sizeLabel}". Please let me know how to proceed.`;
    window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, '_blank');
  }, [product?.name, selectedSize?.size]);

  const handleAddToCart = useCallback(async () => {
    if (isPreOrder) {
      handlePreOrderWhatsApp();
      return;
    }
    if (isSelectedSizeOut || isAlreadyInCart) return;
    setButtonLoading(true);
    await new Promise(res => setTimeout(res, 600));
    addToCart({ ...product, quantity, selectedSize });
    showToast('Product added to cart', 'success');
    setButtonLoading(false);
    const offcanvas = document.getElementById('shoppingCart');
    const bsOffcanvas = new window.bootstrap.Offcanvas(offcanvas);
    bsOffcanvas.show();
  }, [isSelectedSizeOut, isAlreadyInCart, addToCart, product, quantity, selectedSize, showToast, isPreOrder, handlePreOrderWhatsApp]);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const docRef = doc(db, 'products', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProduct({ id: docSnap.id, ...docSnap.data() });
        }
      } catch (error) {
        console.error('Error fetching product:', error);
      }
      setLoading(false);
    };
    fetchProduct();
  }, [id]);

  useEffect(() => {
    const fetchRelatedProducts = async () => {
      setRelatedLoading(true);
      try {
        const querySnapshot = await getDocs(collection(db, 'products'));
        const productsList = querySnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(p => p.id !== id)
          .slice(0, 8);
        setRelatedProducts(productsList);
      } catch (error) {
        console.error('Error fetching related products:', error);
      }
      setRelatedLoading(false);
    };
    fetchRelatedProducts();
  }, [id]);

  useEffect(() => {
    setSelectedSizeIdx(preferredSizeIndex);
  }, [preferredSizeIndex]);

  useEffect(() => {
    setSelectedImage(productImages[0] || '');
  }, [productImages]);

  const premiumFeatures = useMemo(() => [
    { icon: <PremiumIcons.Shield />, text: 'Authentic Scent', desc: '100% Genuine' },
    { icon: <PremiumIcons.Truck />, text: 'India Shipping', desc: 'Express Delivery' },
    { icon: <PremiumIcons.Star />, text: 'Rare Quality', desc: 'Artisanal Batch' },
    { icon: <PremiumIcons.Package />, text: 'Luxury Box', desc: 'Premium Unboxing' }
  ], []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="relative">
          <div className="w-16 h-16 border-2 border-neutral-100 rounded-full"></div>
          <div className="absolute top-0 left-0 w-16 h-16 border-2 border-[#640d14] border-t-transparent rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-1 h-1 bg-[#640d14] rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4">
        <h3 className="text-xl font-serif text-neutral-900 mb-2 uppercase tracking-widest">Masterpiece Not Found</h3>
        <Link to="/" className="mt-6 px-8 py-3 bg-neutral-900 text-white rounded-full text-[14px] font-black uppercase tracking-widest hover:bg-[#640d14] transition-all">
          Return to Gallery
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen selection:bg-[#640d14]/10 selection:text-[#640d14] [&_a]:no-underline">
      {/* Breadcrumb */}
      <nav className="max-w-7xl mx-auto px-6 py-8 text-[9px] font-black uppercase tracking-[0.4em] text-neutral-400 flex items-center gap-3">
        <Link to="/" className="hover:text-[#640d14] transition-colors">Home</Link>
        <span className="opacity-30">/</span>
        <Link to="/category" className="hover:text-[#640d14] transition-colors">Collection</Link>
        <span className="opacity-30">/</span>
        <span className="text-[#640d14] truncate max-w-[200px]">{product.name}</span>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 lg:px-12 pb-32">
        <div className="flex flex-col lg:flex-row gap-20 lg:gap-28 items-start">

          {/* Gallery Section */}
          <div className="w-full lg:w-[55%] lg:sticky lg:top-24 space-y-8">
            <div className="relative aspect-[4/5] bg-[#fdfdfd] rounded-[64px] overflow-hidden border border-neutral-100 group shadow-[0_30px_60px_-15px_rgba(0,0,0,0.03)] transition-all duration-1000 hover:shadow-[0_50px_80px_-20px_rgba(0,0,0,0.08)]">
              <img
                src={selectedImage}
                alt={product.name}
                className={`w-full h-full object-contain p-8 md:p-16 lg:p-20 transition-all duration-1000 group-hover:scale-110 ${isSelectedSizeOut ? 'grayscale opacity-40' : ''}`}
                onError={(e) => { e.target.src = 'https://via.placeholder.com/800x1000/f9f9f7/666?text=Perfume'; }}
              />

              {/* Overlay elements */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>

              {product.badge && (
                <div className="absolute top-12 left-12">
                  <div className="relative group/badge">
                    <div className="absolute inset-0 bg-[#640d14]/20 blur-xl rounded-full animate-pulse"></div>
                    <div className="relative px-6 py-2.5 bg-[#640d14] text-white text-[9px] font-black uppercase tracking-[0.5em] rounded-full shadow-2xl backdrop-blur-md">
                      {product.badge}
                    </div>
                  </div>
                </div>
              )}

              {isSelectedSizeOut && !isPreOrder && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-[4px] flex items-center justify-center pointer-events-none">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-px bg-neutral-900/20"></div>
                    <span className="px-10 py-4 bg-neutral-900 text-white text-[11px] font-black uppercase tracking-[0.5em] rounded-full shadow-2xl">Currently Unavailable</span>
                    <div className="w-16 h-px bg-neutral-900/20"></div>
                  </div>
                </div>
              )}

              {isPreOrder && (
                <div className="absolute top-12 right-12">
                  <div className="px-6 py-2.5 bg-amber-500 text-white text-[9px] font-black uppercase tracking-[0.5em] rounded-full shadow-2xl backdrop-blur-md">
                    Pre-Order
                  </div>
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {productImages.length > 1 && (
              <div className="flex gap-5 overflow-x-auto py-4 no-scrollbar px-2 justify-center lg:justify-start">
                {productImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(img)}
                    className={`flex-shrink-0 w-28 h-28 rounded-[32px] overflow-hidden border transition-all duration-700 relative group ${selectedImage === img ? 'border-[#640d14] ring-[6px] ring-[#640d14]/5 scale-105' : 'border-neutral-100 opacity-60 hover:opacity-100 hover:border-neutral-200'}`}
                  >
                    <img src={img} alt={`${product.name} view ${idx + 1}`} className="w-full h-full object-contain p-4 bg-[#fdfdfd]" />
                    {selectedImage === img && (
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#640d14] rounded-full"></div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info Section */}
          <div className="w-full lg:w-[40%] space-y-8 pt-4 antialiased">
            {/* Header: Brand & Essence */}
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <span className="text-[14px] font-bold uppercase tracking-[0.4em] text-[#640d14]">
                  {product.brand}
                </span>
                {product.note && (
                  <>
                    <div className="w-[1px] h-3 bg-neutral-200"></div>
                    <span className="text-[9px] font-medium uppercase tracking-[0.3em] text-neutral-400 italic">
                      {product.note} Essence
                    </span>
                  </>
                )}
              </div>

              <div className="space-y-2">
                <h1 className="text-3xl lg:text-4xl font-serif text-neutral-900 leading-tight tracking-tight uppercase">
                  {product.name}
                </h1>
                <div className="flex items-baseline gap-4">
                  <span className="text-3xl font-light text-neutral-900 italic">
                    ₹{formatPrice(selectedSize.price)}
                  </span>
                  {selectedSize.oldPrice && (
                    <span className="text-sm text-neutral-300 line-through font-light">
                      ₹{formatPrice(selectedSize.oldPrice)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Selection: Variants */}
            <div className="space-y-4">
              <div className="flex justify-between items-end border-b border-neutral-100 pb-2">
                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-neutral-400">Select Volume</span>
                <span className="text-[9px] font-medium text-neutral-300 uppercase tracking-widest">{sizesArr.length} Editions</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {sizesArr.map((sz, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedSizeIdx(idx)}
                    className={`relative py-3 px-2 rounded-sm border transition-all duration-500 group ${selectedSizeIdx === idx
                      ? 'border-[#640d14] bg-[#640d14]/[0.02]'
                      : 'border-neutral-100 hover:border-neutral-300'
                      } ${sz.isOutOfStock ? 'opacity-30 cursor-not-allowed' : ''}`}
                  >
                    <span className={`text-[11px] font-bold uppercase tracking-wider block ${selectedSizeIdx === idx ? 'text-[#640d14]' : 'text-neutral-600'}`}>
                      {sz.size}
                    </span>
                    {selectedSizeIdx === idx && !sz.isOutOfStock && (
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-[2px] bg-[#640d14]"></div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* CTA & Quantity Section */}
            <div className="space-y-4">
              <div className="flex items-stretch gap-3 h-14">
                {/* Compact Quantity */}
                <div className="flex items-center bg-neutral-50 px-4 rounded-sm border border-neutral-100">
                  <button
                    onClick={() => handleQuantityChange(-1)}
                    disabled={quantity <= 1 || isSelectedSizeOut}
                    className="text-neutral-400 hover:text-[#640d14] transition-colors p-2"
                  >
                    <i className="fas fa-minus text-[9px]"></i>
                  </button>
                  <span className="text-sm font-bold text-neutral-900 w-10 text-center tabular-nums">{quantity}</span>
                  <button
                    onClick={() => handleQuantityChange(1)}
                    disabled={isSelectedSizeOut}
                    className="text-neutral-400 hover:text-[#640d14] transition-colors p-2"
                  >
                    <i className="fas fa-plus text-[9px]"></i>
                  </button>
                </div>

                {/* Premium Add to Cart / Pre-Order */}
                <button
                  onClick={handleAddToCart}
                  disabled={(!isPreOrder && (isSelectedSizeOut || isAlreadyInCart)) || buttonLoading}
                  className={`flex-1 relative flex items-center justify-center overflow-hidden rounded-sm
  transition-all duration-500 h-[46px] group
  ${isPreOrder 
      ? "bg-amber-600 text-white hover:bg-amber-700 shadow-lg shadow-amber-600/20" 
      : (isSelectedSizeOut || isAlreadyInCart
          ? "bg-neutral-100 text-neutral-400 cursor-not-allowed"
          : "bg-neutral-900 text-white hover:bg-[#640d14]")
    }`}
                >
                  {/* Premium shine effect */}
                  {!isSelectedSizeOut && !isAlreadyInCart && !buttonLoading && (
                    <span className="absolute inset-0 overflow-hidden">
                      <span className="absolute -left-[120%] top-0 h-full w-[60%] bg-white/10 blur-md
      group-hover:left-[120%] transition-all duration-1000"></span>
                    </span>
                  )}

                  {/* Button content */}
                  <div className="relative flex items-center justify-center gap-3 text-[14px] font-bold uppercase tracking-[0.4em]">

                    {buttonLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Adding...</span>
                      </>
                    ) : (
                      <>
                        <i className={`fas ${isPreOrder ? "fa-whatsapp" : (isSelectedSizeOut ? "fa-ban" : (isAlreadyInCart ? "fa-check" : "fa-shopping-bag"))} text-xs`}></i>
                        <span>{isPreOrder ? "Pre-Order Now" : (isSelectedSizeOut ? "Sold Out" : (isAlreadyInCart ? "Added to Cart" : "Add to Collection"))}</span>
                      </>
                    )}

                  </div>
                </button>
              </div>

              {/* Wishlist Link */}
              <WishlistButton
                product={product}
                className="w-full flex items-center justify-center gap-2 py-2 text-[9px] font-bold uppercase tracking-[0.2em] text-neutral-400 hover:text-neutral-900 transition-colors"
              />
            </div>

            {/* Footer: Details & Features */}
            <div className="pt-6 border-t border-neutral-100 space-y-6">
              {/* Ultra-compact Features */}
              <div className="flex justify-between items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
                {premiumFeatures.map((feature, i) => (
                  <div key={i} className="flex items-center gap-2 shrink-0">
                    <div className="text-[#640d14] text-[14px]">{feature.icon}</div>
                    <span className="text-[8px] font-bold uppercase tracking-widest text-neutral-500 whitespace-nowrap">{feature.text}</span>
                  </div>
                ))}
              </div>

              {/* Refined Accordion */}
              <div className="divide-y divide-neutral-50 border-y border-neutral-50">
                {['description', 'shipping'].map((tab) => (
                  <div key={tab} className="group">
                    <button
                      onClick={() => setAccordionOpen(accordionOpen === tab ? '' : tab)}
                      className="w-full flex items-center justify-between py-4 group"
                    >
                      <span className="text-[14px] font-bold uppercase tracking-[0.3em] text-neutral-800 group-hover:text-[#640d14] transition-colors">
                        {tab === 'description' ? 'Olfactory Journey' : 'Provenance & Care'}
                      </span>
                      <span className={`text-[14px] transition-transform duration-500 ${accordionOpen === tab ? 'rotate-45 text-[#640d14]' : 'text-neutral-300'}`}>
                        <i className="fas fa-plus"></i>
                      </span>
                    </button>
                    <div className={`overflow-hidden transition-all duration-700 ease-in-out ${accordionOpen === tab ? 'max-h-60 pb-6' : 'max-h-0'}`}>
                      <p className="text-[15px] leading-relaxed text-neutral-500 font-medium italic pr-4">
                        {tab === 'description'
                          ? (product.data || 'An artisanal blend of rare essences, balanced to define modern luxury.')
                          : 'Secure, temperature-controlled shipping. 100% genuine verified batch codes.'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Related Curation */}
      <section className="bg-[#fafafa] py-32 border-t border-neutral-100 relative overflow-hidden">
        {/* Subtle background element */}
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-white/50 to-transparent pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="flex flex-col items-center text-center space-y-4 mb-20">
            <span className="text-[11px] font-black text-[#640d14] uppercase tracking-[0.6em]">Recommended</span>
            <h2 className="text-3xl md:text-4xl font-serif text-neutral-900 uppercase tracking-[0.2em]">The Curation</h2>
            <div className="w-16 h-px bg-gradient-to-r from-transparent via-[#640d14]/20 to-transparent"></div>
          </div>

          {relatedLoading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-2 border-[#640d14]/10 border-t-[#640d14] rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
              {relatedProducts.map((p) => {
                const rPrice = p.sizes?.[0]?.price || p.price;
                return (
                  <Link key={p.id} to={`/product/${p.id}`} className="group space-y-6">
                    <div className="relative aspect-[4/5] bg-white rounded-[48px] overflow-hidden border border-neutral-100 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.02)] transition-all duration-1000 group-hover:shadow-[0_40px_60px_-20px_rgba(0,0,0,0.1)] group-hover:-translate-y-3">
                      <img
                        src={getProductPrimaryImage(p)}
                        alt={p.name}
                        className="w-full h-full object-contain p-8 transition-transform duration-1000 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-700 flex items-center justify-center backdrop-blur-[2px]">
                        <span className="px-8 py-3 bg-white text-neutral-900 text-[14px] font-black uppercase tracking-[0.3em] rounded-full transform translate-y-6 group-hover:translate-y-0 transition-all duration-700 shadow-xl">Explore</span>
                      </div>
                    </div>
                    <div className="space-y-2 text-center">
                      <p className="text-[9px] font-black text-[#640d14] uppercase tracking-[0.4em] opacity-50">{p.brand}</p>
                      <h3 className="text-[12px] font-serif text-neutral-900 group-hover:text-[#640d14] transition-colors duration-500 uppercase tracking-widest truncate px-4">{p.name}</h3>
                      <div className="flex items-center justify-center gap-3">
                        <span className="text-[11px] font-black text-neutral-900">₹{formatPrice(rPrice)}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default ProductDetails;
