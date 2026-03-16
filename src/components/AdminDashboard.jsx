// src/components/AdminDashboard.jsx
import React, { useEffect, useState } from 'react';
import { collection, getDocs, deleteDoc, doc, updateDoc, addDoc, setDoc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import { Link, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';
import UploadItemForm from './UploadItemForm';
import axios from 'axios';

const genderOptions = ['men', 'women', 'unisex'];
const perfumeNotes = ['Woody', 'Citrus', 'Flower', 'Aromatic', 'Custom'];

const AdminDashboard = () => {
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [reviews, setReviews] = useState([]);
  const [orders, setOrders] = useState([]);
  const [isOrdersLoading, setIsOrdersLoading] = useState(false);
  const [isReviewsLoading, setIsReviewsLoading] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [isCsvUploading, setIsCsvUploading] = useState(false);
  const [csvUploadProgress, setCsvUploadProgress] = useState({ current: 0, total: 0, errors: [] });
  const { adminUser, adminLogout } = useAdminAuth();
  const navigate = useNavigate();

  // Video management states
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [videoFiles, setVideoFiles] = useState({ heroVideo: null, stageVideo: null, bannerVideo: null });
  const [currentVideos, setCurrentVideos] = useState({ heroVideoUrl: '', stageVideoUrl: '', bannerVideoUrl: '' });
  const [isVideoUploading, setIsVideoUploading] = useState(false);

  // Static brand list for dropdown (same as UploadItemForm)
  const brands = [
    "ACQUA DI PARMA",
    "AFNAN",
    "AJMAL",
    "ANNA SUI",
    "ANTONIO BANDERAS",
    "AQUOLINA",
    "ARD AL ZAAFRAN",
    "ARIANA GRANDE",
    "ARMAF",
    "AZZARO",
    "BENTLEY",
    "BOUCHERON",
    "BRITNEY SPEARS",
    "BURBERRY",
    "BVLGARI",
    "BYREDO",
    "CAROLINA HERRERA",
    "CARTIER",
    "CHANEL",
    "CHLOE",
    "CHOPARD",
    "CALVIN KLEIN",
    "CLINIQUE",
    "COACH",
    "DAVID BECKHAM",
    "DAVIDOFF",
    "DIOR",
    "DIRHAM",
    "DKNY",
    "DOLCE & GABBANA",
    "DUNHILL",
    "ELIE SAAB",
    "ELIZABETH ARDEN",
    "EMPER",
    "ESCADA",
    "ESTEE LAUDER",
    "FENDI",
    "FERRARI",
    "GIORGIO ARMANI",
    "GIVENCHY",
    "GUCCI",
    "GUERLAIN PARIS",
    "GUESS",
    "GUY LAROCHE",
    "HALLOWEEN",
    "HERMES",
    "HUGO BOSS",
    "ISSEY MIYAKE",
    "JAGUAR",
    "JEAN PAUL GAULTIER",
    "JENNIFER LOPEZ",
    "JIMMY CHOO",
    "JO MALONE",
    "JOHN VARVATOS",
    "JUICY COUTURE",
    "JULIETTE HAS A GUN",
    "KENNETH COLE",
    "KENZO",
    "LACOSTE",
    "LANCOME",
    "LANVIN",
    "LATTAFA",
    "LE CHAMEAU",
    "MAISON ALHAMBRA",
    "MAJESTIC",
    "MANCERA",
    "MARC JACOBS",
    "MERCEDEZ BENZ",
    "MICHAEL KORS",
    "MONT BLANC",
    "MOSCHINO",
    "MUGLER",
    "NARCISO RODRIGUEZ",
    "NAUTICA",
    "NINA RICCI",
    "NISHANE",
    "PACO RABANNE",
    "PARFUMS DE MARLY",
    "PARIS HILTON",
    "POLO",
    "PRADA",
    "RALPH LAUREN",
    "RASASI",
    "REPLICA",
    "RIHANNA",
    "RIIFFS",
    "RUE BROCA",
    "SALVATORE FERRAGAMO",
    "SARAH JESSICA PARKER",
    "ST DUPONT",
    "TOM FORD",
    "TOMMY HILFIGER",
    "UCB",
    "VERSACE",
    "VIKTOR & ROLF",
    "VICTORIA SECRET",
    "YVES SAINT LAURENT"
  ];

  // Helper function to safely format price
  const formatPrice = (price) => {
    if (!price) return '0.00';
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return isNaN(numPrice) ? '0.00' : numPrice.toFixed(2);
  };

  const fetchOrders = async () => {
    try {
      setIsOrdersLoading(true);
      const snapshot = await getDocs(collection(db, 'orders'));
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setOrders(list.sort((a, b) => (b?.createdAt?.seconds || 0) - (a?.createdAt?.seconds || 0)));
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setIsOrdersLoading(false);
    }
  };

  // Helper function to get category icon and color
  const getCategoryInfo = (badge) => {
    if (!badge) return { icon: 'fa-tag', bg: 'linear-gradient(135deg, #640d14, #9b7645)' };

    const badgeLower = badge.toLowerCase();
    switch (badgeLower) {
      case 'designer':
        return { icon: 'fa-user-tie', bg: 'linear-gradient(135deg, #640d14, #9b7645)' };
      case 'middle eastern':
        return { icon: 'fa-mosque', bg: 'linear-gradient(135deg, #C9B37E, #D4B04C)' };
      case 'niche':
        return { icon: 'fa-gem', bg: 'linear-gradient(135deg, #A63A27, #D32F2F)' };
      case 'vials':
        return { icon: 'fa-vial', bg: 'linear-gradient(135deg, #2196F3, #1976D2)' };
      case 'gift sets':
        return { icon: 'fa-gift', bg: 'linear-gradient(135deg, #E91E63, #C2185B)' };
      case 'combo':
        return { icon: 'fa-cubes', bg: 'linear-gradient(135deg, #FF6B35, #F7931E)' };
      case 'custom':
        return { icon: 'fa-star', bg: 'linear-gradient(135deg, #3FC53A, #4CAF50)' };
      default:
        return { icon: 'fa-tag', bg: 'linear-gradient(135deg, #640d14, #9b7645)' };
    }
  };

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const querySnapshot = await getDocs(collection(db, 'products'));
      const productList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProducts(productList);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      setIsReviewsLoading(true);
      const snapshot = await getDocs(collection(db, 'reviews'));
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setReviews(list);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setIsReviewsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) return;
    try {
      await deleteDoc(doc(db, 'products', id));
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Failed to delete product. Please try again.');
    }
  };

  const handleDeleteReview = async (id) => {
    if (!window.confirm('Delete this testimonial?')) return;
    try {
      await deleteDoc(doc(db, 'reviews', id));
      setReviews(prev => prev.filter(r => r.id !== id));
    } catch (error) {
      console.error('Error deleting review:', error);
      alert('Failed to delete review. Please try again.');
    }
  };

  const handleDeleteOrder = async (id) => {
    if (!window.confirm('Are you sure you want to delete this order? This action cannot be undone.')) return;
    try {
      await deleteDoc(doc(db, 'orders', id));
      setOrders(prev => prev.filter(o => o.id !== id));
    } catch (error) {
      console.error('Error deleting order:', error);
      alert('Failed to delete order. Please try again.');
    }
  };

  const handleEditClick = (item) => {
    setEditItem(item);
    // Normalize gender to array for checkbox UI
    const normalizedGenderArray = genderOptions.includes(item.gender) ? [item.gender] : [];
    // Enhance sizes with imagesFiles and imagesPreview and customSize handling
    const enhancedSizes = Array.isArray(item.sizes)
      ? item.sizes.map(s => ({
        size: s.size || '',
        price: s.price || '',
        oldPrice: s.oldPrice || '',
        customSize: '',
        imagesFiles: Array.isArray(s.images) ? [...s.images] : [],
        imagesPreview: Array.isArray(s.images) ? [...s.images] : [],
        stock: typeof s.stock === 'number' ? s.stock : Number(s.stock || 0) || 0,
        isOutOfStock: (typeof s.stock === 'number' ? s.stock : Number(s.stock || 0)) <= 0
      }))
      : [];
    setFormData({
      ...item,
      brand: item.brand || '',
      gender: normalizedGenderArray,
      sizes: enhancedSizes,
      note: item.note || '',
      customNote: '',
      customBadge: '',
      badge: item.badge || '',
      isAdminLogin: item.isAdminLogin || false,
      isPreOrder: item.isPreOrder || false
    });
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => {
      const newState = { ...prev, [name]: type === 'checkbox' ? checked : value };
      if (name === 'badge' && value !== 'custom') newState.customBadge = '';
      if (name === 'note' && value !== 'Custom') newState.customNote = '';
      return newState;
    });
  };

  const handleGenderChange = (e) => {
    const value = e.target.value;
    setFormData(prev => {
      const current = Array.isArray(prev.gender) ? prev.gender : [];
      if (value === 'unisex') {
        return { ...prev, gender: ['unisex'] };
      }
      const withoutUnisex = current.filter(g => g !== 'unisex');
      const exists = withoutUnisex.includes(value);
      const updated = exists ? withoutUnisex.filter(g => g !== value) : [...withoutUnisex, value];
      return { ...prev, gender: updated };
    });
  };

  const handleSizeChange = (idx, field, value) => {
    setFormData(prev => {
      const sizes = Array.isArray(prev.sizes) ? [...prev.sizes] : [];
      if (!sizes[idx]) return prev;
      if (field === 'size' && value !== 'custom') {
        sizes[idx] = { ...sizes[idx], size: value, customSize: '' };
      } else {
        sizes[idx] = { ...sizes[idx], [field]: value };
        // Automatically update isOutOfStock based on stock value
        if (field === 'stock') {
          const stockValue = Number(value || 0);
          sizes[idx] = { ...sizes[idx], isOutOfStock: stockValue <= 0 };
        }
      }
      return { ...prev, sizes };
    });
  };

  const handleSizeImagesChange = (idx, filesList) => {
    const newFiles = Array.from(filesList);
    setFormData(prev => {
      const sizes = Array.isArray(prev.sizes) ? [...prev.sizes] : [];
      if (!sizes[idx]) return prev;
      const existingFiles = sizes[idx].imagesFiles || [];
      const combined = [...existingFiles, ...newFiles].slice(0, 4);
      const previews = combined.map(f => (typeof f === 'string' ? f : URL.createObjectURL(f)));
      sizes[idx] = { ...sizes[idx], imagesFiles: combined, imagesPreview: previews };
      return { ...prev, sizes };
    });
  };

  const handleRemoveSizeImage = (idx, imgIdx) => {
    setFormData(prev => {
      const sizes = Array.isArray(prev.sizes) ? [...prev.sizes] : [];
      if (!sizes[idx]) return prev;
      const files = [...(sizes[idx].imagesFiles || [])];
      const previews = [...(sizes[idx].imagesPreview || [])];
      files.splice(imgIdx, 1);
      previews.splice(imgIdx, 1);
      sizes[idx] = { ...sizes[idx], imagesFiles: files, imagesPreview: previews };
      return { ...prev, sizes };
    });
  };

  const uploadToCloudinary = async (file) => {
    const data = new FormData();
    data.append('file', file);
    data.append('upload_preset', 'Mahirash');
    const res = await axios.post('https://api.cloudinary.com/v1_1/djmfxpemz/image/upload', data);
    return res.data.secure_url;
  };

  // Upload video to Cloudinary
  const uploadVideoToCloudinary = async (file) => {
    const data = new FormData();
    data.append('file', file);
    data.append('upload_preset', 'Mahirash');
    const res = await axios.post('https://api.cloudinary.com/v1_1/djmfxpemz/video/upload', data);
    return res.data.secure_url;
  };

  // Fetch current video URLs
  const fetchCurrentVideos = async () => {
    try {
      const docRef = doc(db, 'siteConfig', 'videos');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setCurrentVideos({
          heroVideoUrl: data.heroVideoUrl || '',
          stageVideoUrl: data.stageVideoUrl || '',
          bannerVideoUrl: data.bannerVideoUrl || ''
        });
      }
    } catch (error) {
      console.error('Error fetching current videos:', error);
    }
  };

  // Handle video upload
  const handleVideoUpload = async () => {
    setIsVideoUploading(true);
    try {
      const updatedVideos = { ...currentVideos };

      // Upload hero video to Cloudinary only (skip Firebase to avoid CORS issues)
      if (videoFiles.heroVideo) {
        const cloudinaryUrl = await uploadVideoToCloudinary(videoFiles.heroVideo);
        updatedVideos.heroVideoUrl = cloudinaryUrl;
      }

      // Upload stage video to Cloudinary only
      if (videoFiles.stageVideo) {
        const cloudinaryUrl = await uploadVideoToCloudinary(videoFiles.stageVideo);
        updatedVideos.stageVideoUrl = cloudinaryUrl;
      }

      // Upload banner video to Cloudinary only
      if (videoFiles.bannerVideo) {
        const cloudinaryUrl = await uploadVideoToCloudinary(videoFiles.bannerVideo);
        updatedVideos.bannerVideoUrl = cloudinaryUrl;
      }

      // Save to Firestore
      await setDoc(doc(db, 'siteConfig', 'videos'), updatedVideos);

      // Update local state
      setCurrentVideos(updatedVideos);
      setVideoFiles({ heroVideo: null, stageVideo: null, bannerVideo: null });
      setShowVideoModal(false);
      alert('Videos uploaded successfully!');
    } catch (error) {
      console.error('Error uploading videos:', error);
      alert('Failed to upload videos. Please try again.');
    } finally {
      setIsVideoUploading(false);
    }
  };

  const handleUpdate = async () => {
    try {
      setIsUpdating(true);
      // Compute gender string
      const selected = Array.isArray(formData.gender) ? formData.gender : [];
      let finalGender = 'unisex';
      if (selected.includes('unisex')) {
        finalGender = 'unisex';
      } else if (selected.length === 1) {
        finalGender = selected[0];
      }

      const finalBadge = formData.badge === 'custom' ? formData.customBadge : formData.badge;
      const finalNote = formData.note === 'Custom' ? formData.customNote : formData.note;

      // Prepare sizes and upload new images
      const preparedSizes = [];
      for (const s of (Array.isArray(formData.sizes) ? formData.sizes : [])) {
        if (!(s.size && s.price)) continue;
        const imagesFiles = s.imagesFiles || [];
        if (imagesFiles.length === 0) {
          throw new Error('Each size must have at least 1 image.');
        }
        let finalSize = s.size;
        if (s.size === 'custom' && s.customSize) {
          finalSize = s.customSize;
        }
        const uploadedUrls = [];
        for (const f of imagesFiles.slice(0, 4)) {
          if (typeof f === 'string') {
            uploadedUrls.push(f);
          } else {
            const url = await uploadToCloudinary(f);
            uploadedUrls.push(url);
          }
        }
        const numericStock = formData.isPreOrder ? 999 : Number(s.stock || 0);
        // Automatically set isOutOfStock based on stock (0 or less = out of stock)
        const isOutOfStock = formData.isPreOrder ? false : numericStock <= 0;
        preparedSizes.push({ size: finalSize, price: s.price, oldPrice: s.oldPrice || '', stock: isNaN(numericStock) ? 0 : numericStock, images: uploadedUrls, isOutOfStock });
      }

      // Automatically calculate product-level isOutOfStock based on all sizes
      // Product is out of stock if all sizes are out of stock (stock <= 0)
      const productIsOutOfStock = !formData.isPreOrder && preparedSizes.length > 0 && preparedSizes.every(sz => sz.isOutOfStock || (Number(sz.stock || 0) <= 0));

      const payload = {
        name: formData.name || '',
        brand: formData.brand || '',
        data: formData.data || '',
        badge: finalBadge || '',
        isOutOfStock: productIsOutOfStock,
        tags: Array.isArray(formData.tags) ? formData.tags : [],
        gender: finalGender,
        note: finalNote || '',
        sizes: preparedSizes,
        isAdminLogin: formData.isAdminLogin || false,
        isPreOrder: formData.isPreOrder || false
      };

      const itemRef = doc(db, 'products', editItem.id);
      await updateDoc(itemRef, payload);
      setEditItem(null);
      fetchProducts();
    } catch (error) {
      console.error('Error updating item:', error);
      alert(error?.message || 'Failed to update product. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogout = () => {
    adminLogout();
    navigate('/admin');
  };

  // CSV Parser function
  const parseCSV = (text) => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) throw new Error('CSV file must have at least a header row and one data row');

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
    const rows = [];

    for (let i = 1; i < lines.length; i++) {
      const values = [];
      let currentValue = '';
      let insideQuotes = false;

      for (let j = 0; j < lines[i].length; j++) {
        const char = lines[i][j];
        if (char === '"') {
          insideQuotes = !insideQuotes;
        } else if (char === ',' && !insideQuotes) {
          values.push(currentValue.trim());
          currentValue = '';
        } else {
          currentValue += char;
        }
      }
      values.push(currentValue.trim());

      if (values.length === headers.length) {
        const row = {};
        headers.forEach((header, idx) => {
          row[header] = values[idx] || '';
        });
        rows.push(row);
      }
    }

    return rows;
  };

  // Transform CSV row to product format
  const transformCsvRowToProduct = (row) => {
    // Normalize column names (handle variations)
    const getValue = (keys) => {
      for (const key of keys) {
        if (row[key] !== undefined && row[key] !== '') return row[key];
      }
      return '';
    };

    const name = getValue(['name', 'product name', 'productname']);
    const brand = getValue(['brand']);
    const data = getValue(['data', 'description', 'desc']);
    const badge = getValue(['badge', 'category', 'cat']);
    const note = getValue(['note', 'perfume note', 'perfumenote']);
    const gender = getValue(['gender', 'gend']);
    const size = getValue(['size']);
    const price = getValue(['price']);
    const oldPrice = getValue(['oldprice', 'old price', 'oldprice']);
    const stock = getValue(['stock', 'quantity', 'qty']);
    const imageUrls = getValue(['imageurls', 'image urls', 'images', 'image', 'imageurl']);
    const isOutOfStock = getValue(['isoutofstock', 'out of stock', 'outofstock', 'oos']);
    const tags = getValue(['tags', 'tag']);

    // Validate required fields
    if (!name || !brand || !size || !price) {
      throw new Error(`Missing required fields: name, brand, size, or price`);
    }

    // Parse images (comma or semicolon separated URLs)
    const images = imageUrls
      ? imageUrls.split(/[,;]/).map(url => url.trim()).filter(url => url.length > 0)
      : [];

    if (images.length === 0) {
      throw new Error(`Product "${name}" must have at least one image URL`);
    }

    // Parse gender
    let finalGender = 'unisex';
    if (gender) {
      const genderLower = gender.toLowerCase();
      if (genderLower.includes('men') || genderLower === 'm') {
        finalGender = 'men';
      } else if (genderLower.includes('women') || genderLower === 'w' || genderLower === 'f') {
        finalGender = 'women';
      } else if (genderLower.includes('unisex') || genderLower === 'u') {
        finalGender = 'unisex';
      }
    }

    // Parse tags
    const parsedTags = tags
      ? tags.split(/[,;]/).map(t => t.trim()).filter(t => t.length > 0)
      : [];

    // Parse stock
    const numericStock = Number(stock) || 0;
    // Automatically set isOutOfStock based on stock (0 or less = out of stock)
    const isOutOfStockBool = numericStock <= 0;

    // Build size object
    const sizeObj = {
      size: size,
      price: price,
      oldPrice: oldPrice || '',
      stock: numericStock,
      images: images.slice(0, 4), // Max 4 images
      isOutOfStock: isOutOfStockBool
    };

    return {
      name: name.trim(),
      brand: brand.trim(),
      data: data.trim(),
      badge: badge.trim() || '',
      note: note.trim() || '',
      gender: finalGender,
      sizes: [sizeObj],
      tags: parsedTags,
      isOutOfStock: isOutOfStockBool
    };
  };

  // Handle CSV file upload
  const handleCsvFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'text/csv' || file.name.endsWith('.csv')) {
      setCsvFile(file);
    } else {
      alert('Please select a valid CSV file');
      e.target.value = '';
    }
  };

  // Download sample CSV template
  const downloadSampleCSV = () => {
    const sampleData = [
      {
        name: 'Sample Perfume 1',
        brand: 'CHANEL',
        size: '50ml',
        price: '2999',
        oldPrice: '3499',
        imageUrls: 'https://example.com/image1.jpg,https://example.com/image2.jpg',
        data: 'A luxurious fragrance with notes of jasmine and rose',
        badge: 'Premium',
        note: 'Flower',
        gender: 'women',
        stock: '50',
        isOutOfStock: 'false',
        tags: 'Top Sales,New Arrivals'
      },
      {
        name: 'Sample Perfume 2',
        brand: 'DIOR',
        size: '100ml',
        price: '4999',
        oldPrice: '',
        imageUrls: 'https://example.com/image3.jpg',
        data: 'A fresh and modern scent perfect for everyday wear',
        badge: 'New',
        note: 'Citrus',
        gender: 'unisex',
        stock: '30',
        isOutOfStock: 'false',
        tags: 'Top Ratings'
      }
    ];

    const headers = ['name', 'brand', 'size', 'price', 'oldPrice', 'imageUrls', 'data', 'badge', 'note', 'gender', 'stock', 'isOutOfStock', 'tags'];
    const csvContent = [
      headers.join(','),
      ...sampleData.map(row =>
        headers.map(header => {
          const value = row[header] || '';
          // Escape quotes and wrap in quotes if contains comma
          if (value.includes(',') || value.includes('"') || value.includes('\n')) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'product_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Process and upload CSV products
  const handleCsvUpload = async () => {
    if (!csvFile) {
      alert('Please select a CSV file first');
      return;
    }

    setIsCsvUploading(true);
    setCsvUploadProgress({ current: 0, total: 0, errors: [] });

    try {
      const text = await csvFile.text();
      const rows = parseCSV(text);

      if (rows.length === 0) {
        throw new Error('No data rows found in CSV file');
      }

      setCsvUploadProgress({ current: 0, total: rows.length, errors: [] });
      const errors = [];
      let successCount = 0;

      // Group products by name+brand (in case CSV has multiple sizes per product)
      const productMap = new Map();

      for (let i = 0; i < rows.length; i++) {
        try {
          const product = transformCsvRowToProduct(rows[i]);
          const key = `${product.name}_${product.brand}`;

          if (productMap.has(key)) {
            // Add size to existing product
            const existing = productMap.get(key);
            existing.sizes.push(...product.sizes);
          } else {
            productMap.set(key, product);
          }
        } catch (error) {
          errors.push(`Row ${i + 2}: ${error.message}`);
        }
      }

      // Upload products
      const productsToUpload = Array.from(productMap.values());
      setCsvUploadProgress({ current: 0, total: productsToUpload.length, errors });

      for (let i = 0; i < productsToUpload.length; i++) {
        try {
          const product = productsToUpload[i];

          // Automatically update isOutOfStock based on all sizes
          // Product is out of stock if all sizes are out of stock (stock <= 0)
          const allSizesOut = product.sizes.every(sz => sz.isOutOfStock || (Number(sz.stock || 0) <= 0));
          product.isOutOfStock = allSizesOut;

          await addDoc(collection(db, 'products'), product);
          successCount++;
          setCsvUploadProgress(prev => ({ ...prev, current: i + 1 }));
        } catch (error) {
          errors.push(`Product "${productsToUpload[i].name}": ${error.message}`);
        }
      }

      // Show results
      const message = `Upload complete!\n\nSuccessfully uploaded: ${successCount} products\nErrors: ${errors.length}`;
      if (errors.length > 0) {
        alert(`${message}\n\nErrors:\n${errors.slice(0, 10).join('\n')}${errors.length > 10 ? `\n... and ${errors.length - 10} more` : ''}`);
      } else {
        alert(message);
      }

      // Refresh products list
      fetchProducts();
      setCsvFile(null);
      setShowCsvModal(false);
      // Reset file input
      const fileInput = document.getElementById('csv-file-input');
      if (fileInput) fileInput.value = '';
    } catch (error) {
      console.error('CSV upload error:', error);
      alert(`Failed to process CSV file: ${error.message}`);
    } finally {
      setIsCsvUploading(false);
      setCsvUploadProgress({ current: 0, total: 0, errors: [] });
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchReviews();
    fetchOrders();
    fetchCurrentVideos();
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #F8F5F2 0%, #EFE8DC 100%)',
      padding: '20px'
    }}>
      <div className="container-fluid">
        {/* Header */}
        <div style={{
          background: '#fff',
          borderRadius: '20px',
          padding: '30px',
          marginBottom: '30px',
          boxShadow: '0 10px 40px rgba(123, 84, 33, 0.1)',
          border: '1px solid rgba(201, 179, 126, 0.2)'
        }}>
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div>
              <h1 style={{
                color: '#3B2F2F',
                fontSize: '32px',
                fontWeight: '600',
                margin: 0,
                fontFamily: 'serif'
              }}>
                <i className="fas fa-crown me-3" style={{ color: '#640d14' }}></i>
                Admin Dashboard
              </h1>
              <p style={{
                color: '#640d14',
                fontSize: '14px',
                margin: '8px 0 0 0',
                opacity: 0.8
              }}>
                Welcome back, {adminUser?.displayName || 'Administrator'}
              </p>
            </div>
            <div className="d-flex gap-2">
              <button
                className="btn"
                onClick={() => setShowVideoModal(true)}
                style={{
                  background: 'linear-gradient(135deg, #FF6B35, #F7931E)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '12px 24px',
                  fontWeight: '600',
                  boxShadow: '0 8px 25px rgba(255, 107, 53, 0.3)',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 12px 35px rgba(255, 107, 53, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 8px 25px rgba(255, 107, 53, 0.3)';
                }}
              >
                <i className="fas fa-video me-2"></i>
                Manage Videos
              </button>
              <button
                className="btn"
                onClick={() => setShowUploadModal(true)}
                style={{
                  background: 'linear-gradient(135deg, #640d14, #9b7645)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '12px 24px',
                  fontWeight: '600',
                  boxShadow: '0 8px 25px rgba(123, 84, 33, 0.3)',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 12px 35px rgba(123, 84, 33, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 8px 25px rgba(123, 84, 33, 0.3)';
                }}
              >
                <i className="fas fa-plus me-2"></i>
                Add Product
              </button>
              <button
                className="btn"
                onClick={() => setShowCsvModal(true)}
                style={{
                  background: 'linear-gradient(135deg, #2196F3, #1976D2)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '12px 24px',
                  fontWeight: '600',
                  boxShadow: '0 8px 25px rgba(33, 150, 243, 0.3)',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 12px 35px rgba(33, 150, 243, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 8px 25px rgba(33, 150, 243, 0.3)';
                }}
              >
                <i className="fas fa-file-csv me-2"></i>
                Upload CSV
              </button>
              <button
                className="btn"
                onClick={handleLogout}
                style={{
                  background: '#fff',
                  color: '#640d14',
                  border: '2px solid #640d14',
                  borderRadius: '12px',
                  padding: '12px 24px',
                  fontWeight: '600',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#640d14';
                  e.target.style.color = '#fff';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = '#fff';
                  e.target.style.color = '#640d14';
                }}
              >
                <i className="fas fa-sign-out-alt me-2"></i>
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="row mb-4">
          <div className="col-md-3 col-sm-6 mb-3">
            <div style={{
              background: '#fff',
              borderRadius: '16px',
              padding: '25px',
              textAlign: 'center',
              boxShadow: '0 8px 25px rgba(123, 84, 33, 0.1)',
              border: '1px solid rgba(201, 179, 126, 0.2)'
            }}>
              <div style={{
                width: '60px',
                height: '60px',
                background: 'linear-gradient(135deg, #640d14, #9b7645)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 15px'
              }}>
                <i className="fas fa-box" style={{ color: '#fff', fontSize: '24px' }}></i>
              </div>
              <h3 style={{ color: '#3B2F2F', fontSize: '28px', margin: '0 0 5px 0' }}>
                {products.length}
              </h3>
              <p style={{ color: '#640d14', fontSize: '14px', margin: 0 }}>Total Products</p>
            </div>
          </div>
          <div className="col-md-3 col-sm-6 mb-3">
            <div style={{
              background: '#fff',
              borderRadius: '16px',
              padding: '25px',
              textAlign: 'center',
              boxShadow: '0 8px 25px rgba(123, 84, 33, 0.1)',
              border: '1px solid rgba(201, 179, 126, 0.2)'
            }}>
              <div style={{
                width: '60px',
                height: '60px',
                background: 'linear-gradient(135deg, #C9B37E, #D4B04C)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 15px'
              }}>
                <i className="fas fa-star" style={{ color: '#fff', fontSize: '24px' }}></i>
              </div>
              <h3 style={{ color: '#3B2F2F', fontSize: '28px', margin: '0 0 5px 0' }}>
                {products.filter(p => p.badge === 'Premium').length}
              </h3>
              <p style={{ color: '#640d14', fontSize: '14px', margin: 0 }}>Premium Products</p>
            </div>
          </div>
          <div className="col-md-3 col-sm-6 mb-3">
            <div style={{
              background: '#fff',
              borderRadius: '16px',
              padding: '25px',
              textAlign: 'center',
              boxShadow: '0 8px 25px rgba(123, 84, 33, 0.1)',
              border: '1px solid rgba(201, 179, 126, 0.2)'
            }}>
              <div style={{
                width: '60px',
                height: '60px',
                background: 'linear-gradient(135deg, #A63A27, #D32F2F)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 15px'
              }}>
                <i className="fas fa-exclamation-triangle" style={{ color: '#fff', fontSize: '24px' }}></i>
              </div>
              <h3 style={{ color: '#3B2F2F', fontSize: '28px', margin: '0 0 5px 0' }}>
                {products.filter(p => p.isOutOfStock).length}
              </h3>
              <p style={{ color: '#640d14', fontSize: '14px', margin: 0 }}>Out of Stock</p>
            </div>
          </div>
          <div className="col-md-3 col-sm-6 mb-3">
            <div style={{
              background: '#fff',
              borderRadius: '16px',
              padding: '25px',
              textAlign: 'center',
              boxShadow: '0 8px 25px rgba(123, 84, 33, 0.1)',
              border: '1px solid rgba(201, 179, 126, 0.2)'
            }}>
              <div style={{
                width: '60px',
                height: '60px',
                background: 'linear-gradient(135deg, #3FC53A, #4CAF50)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 15px'
              }}>
                <i className="fas fa-check-circle" style={{ color: '#fff', fontSize: '24px' }}></i>
              </div>
              <h3 style={{ color: '#3B2F2F', fontSize: '28px', margin: '0 0 5px 0' }}>
                {products.filter(p => !p.isOutOfStock).length}
              </h3>
              <p style={{ color: '#640d14', fontSize: '14px', margin: 0 }}>In Stock</p>
            </div>
          </div>
        </div>

        {/* Products Table */}
        <div style={{
          background: '#fff',
          borderRadius: '20px',
          padding: '30px',
          boxShadow: '0 10px 40px rgba(123, 84, 33, 0.1)',
          border: '1px solid rgba(201, 179, 126, 0.2)'
        }}>
          <h3 style={{
            color: '#3B2F2F',
            fontSize: '24px',
            fontWeight: '600',
            marginBottom: '25px',
            fontFamily: 'serif'
          }}>
            <i className="fas fa-list me-2" style={{ color: '#640d14' }}></i>
            Product Management
          </h3>

          <div className="row g-2 mb-3">
            <div className="col-md-6">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by product name or brand..."
                className="form-control"
                style={{ border: '2px solid #E8EBDD', borderRadius: '12px', padding: '12px 14px', background: '#F8F5F2' }}
              />
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-5">
              <div style={{
                width: '60px',
                height: '60px',
                background: 'linear-gradient(135deg, #640d14, #9b7645)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
                animation: 'spin 1s linear infinite'
              }}>
                <i className="fas fa-spinner" style={{ color: '#fff', fontSize: '24px' }}></i>
              </div>
              <p style={{ color: '#640d14', fontSize: '16px' }}>Loading products...</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover" style={{ margin: 0 }}>
                <thead>
                  <tr style={{
                    background: 'linear-gradient(135deg, #F8F5F2, #EFE8DC)',
                    border: 'none'
                  }}>
                    <th style={{
                      border: 'none',
                      color: '#3B2F2F',
                      fontWeight: '600',
                      padding: '15px',
                      fontSize: '14px'
                    }}>Image</th>
                    <th style={{
                      border: 'none',
                      color: '#3B2F2F',
                      fontWeight: '600',
                      padding: '15px',
                      fontSize: '14px'
                    }}>Name</th>
                    <th style={{
                      border: 'none',
                      color: '#3B2F2F',
                      fontWeight: '600',
                      padding: '15px',
                      fontSize: '14px'
                    }}>Brand</th>

                    <th style={{
                      border: 'none',
                      color: '#3B2F2F',
                      fontWeight: '600',
                      padding: '15px',
                      fontSize: '14px'
                    }}>Category</th>
                    <th style={{
                      border: 'none',
                      color: '#3B2F2F',
                      fontWeight: '600',
                      padding: '15px',
                      fontSize: '14px'
                    }}>Stock</th>
                    {/* <th style={{
                      border: 'none',
                      color: '#3B2F2F',
                      fontWeight: '600',
                      padding: '15px',
                      fontSize: '14px'
                    }}>Sizes</th> */}
                    <th style={{
                      border: 'none',
                      color: '#3B2F2F',
                      fontWeight: '600',
                      padding: '15px',
                      fontSize: '14px'
                    }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.filter(p => {
                    if (!searchQuery) return true;
                    const q = searchQuery.toLowerCase();
                    return (p.name || '').toLowerCase().includes(q) || (p.brand || '').toLowerCase().includes(q);
                  }).length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-5">
                        <div style={{
                          color: '#640d14',
                          fontSize: '16px',
                          opacity: 0.7
                        }}>
                          <i className="fas fa-box-open mb-3" style={{ fontSize: '48px', display: 'block' }}></i>
                          No products found. Add your first product to get started.
                        </div>
                      </td>
                    </tr>
                  ) : products.filter(p => {
                    if (!searchQuery) return true;
                    const q = searchQuery.toLowerCase();
                    return (p.name || '').toLowerCase().includes(q) || (p.brand || '').toLowerCase().includes(q);
                  }).map(product => {
                    const sizeList = Array.isArray(product.sizes) ? product.sizes : [];
                    const sizeOutCount = sizeList.filter(sz => sz?.isOutOfStock).length;
                    const allSizesOut = sizeList.length > 0 && sizeOutCount === sizeList.length;
                    const finalOutOfStock = product.isOutOfStock || allSizesOut;
                    return (
                      <tr key={product.id} style={{
                        borderBottom: '1px solid #E8EBDD',
                        transition: 'all 0.3s ease'
                      }}>
                        <td style={{ padding: '15px' }}>
                          <img
                            src={(Array.isArray(product.sizes) && product.sizes.find(s => s.size === '50ml' && Array.isArray(s.images) && s.images[0])?.images?.[0])
                              || (Array.isArray(product.sizes) && product.sizes[0] && Array.isArray(product.sizes[0].images) && product.sizes[0].images[0])
                              || product.image}
                            alt={product.name}
                            style={{
                              width: '60px',
                              height: '60px',
                              objectFit: 'cover',
                              borderRadius: '8px',
                              border: '2px solid #E8EBDD'
                            }} />
                        </td>
                        <td style={{
                          padding: '15px',
                          color: '#3B2F2F',
                          fontWeight: '500'
                        }}>
                          {product.name}
                        </td>
                        <td style={{
                          padding: '15px',
                          color: '#3B2F2F',
                          fontWeight: '500'
                        }}>
                          {product.brand}
                        </td>


                        <td style={{ padding: '15px' }}>
                          {(() => {
                            const categoryInfo = getCategoryInfo(product.badge);
                            return (
                              <span style={{
                                background: categoryInfo.bg,
                                color: '#fff',
                                padding: '4px 12px',
                                borderRadius: '20px',
                                fontSize: '12px',
                                fontWeight: '500',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px'
                              }}>
                                <i className={`fas ${categoryInfo.icon}`} style={{ fontSize: '10px' }}></i>
                                {product.badge || 'Standard'}
                              </span>
                            );
                          })()}
                        </td>
                        <td style={{ padding: '15px' }}>
                          <div className="d-flex flex-column gap-1">
                            {product.isPreOrder ? (
                              <span style={{ color: '#F59E0B', fontWeight: '600' }}>
                                <i className="fas fa-clock me-1"></i>
                                Pre-Order
                              </span>
                            ) : (
                              <>
                                {sizeList.length > 0 ? (
                                  sizeList.map((sz, idx) => {
                                    const isOOS = sz.isOutOfStock || Number(sz.stock || 0) <= 0;
                                    return (
                                      <div key={idx} style={{ 
                                        fontSize: '12px', 
                                        color: isOOS ? '#D32F2F' : '#4CAF50',
                                        fontWeight: '600',
                                        whiteSpace: 'nowrap'
                                      }}>
                                        <span style={{ opacity: 0.8 }}>{sz.size}:</span> {sz.stock || 0}
                                        {isOOS && <span className="ms-1" style={{ fontSize: '10px' }}>(OOS)</span>}
                                      </div>
                                    );
                                  })
                                ) : (
                                  <span style={{ color: '#D32F2F', fontWeight: '600' }}>
                                    {finalOutOfStock ? '❌ Out of Stock' : '⚠️ No stock data'}
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                        {/* <td style={{ padding: '15px' }}>
              {product.data ? (
                <span style={{ color: '#3B2F2F', fontWeight: 400, fontSize: '13px' }}>
                  {product.data}
                </span>
              ) : (
                <span style={{ color: '#aaa', fontSize: '12px' }}>-</span>
              )}
            </td> */}

                        <td style={{ padding: '15px' }}>
                          <div className="d-flex gap-2">
                            <button
                              className="btn btn-sm"
                              onClick={() => handleEditClick(product)}
                              style={{
                                background: 'linear-gradient(135deg, #640d14, #9b7645)',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '8px 16px',
                                fontSize: '12px',
                                fontWeight: '500',
                                transition: 'all 0.3s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.transform = 'translateY(-1px)';
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.transform = 'translateY(0)';
                              }}
                            >
                              <i className="fas fa-edit me-1"></i>
                              Edit
                            </button>
                            <button
                              className="btn btn-sm"
                              onClick={() => handleDelete(product.id)}
                              style={{
                                background: '#fff',
                                color: '#D32F2F',
                                border: '2px solid #D32F2F',
                                borderRadius: '8px',
                                padding: '8px 16px',
                                fontSize: '12px',
                                fontWeight: '500',
                                transition: 'all 0.3s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.background = '#D32F2F';
                                e.target.style.color = '#fff';
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.background = '#fff';
                                e.target.style.color = '#D32F2F';
                              }}
                            >
                              <i className="fas fa-trash me-1"></i>
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Purchases & Payments */}
        <div className="mt-4" style={{
          background: '#fff',
          borderRadius: '20px',
          padding: '30px',
          boxShadow: '0 10px 40px rgba(123, 84, 33, 0.1)',
          border: '1px solid rgba(201, 179, 126, 0.2)'
        }}>
          <h3 style={{
            color: '#3B2F2F',
            fontSize: '24px',
            fontWeight: '600',
            marginBottom: '20px',
            fontFamily: 'serif'
          }}>
            <i className="fas fa-receipt me-2" style={{ color: '#640d14' }}></i>
            Purchases & Payments
          </h3>
          {isOrdersLoading ? (
            <div className="text-center py-4" style={{ color: '#640d14' }}>
              <i className="fas fa-spinner fa-spin me-2"></i>
              Loading orders...
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover" style={{ margin: 0 }}>
                <thead>
                  <tr style={{ background: 'linear-gradient(135deg, #F8F5F2, #EFE8DC)' }}>
                    <th style={{ border: 'none', padding: '12px', fontSize: 14, color: '#3B2F2F' }}>Date</th>
                    <th style={{ border: 'none', padding: '12px', fontSize: 14, color: '#3B2F2F' }}>Customer</th>
                    <th style={{ border: 'none', padding: '12px', fontSize: 14, color: '#3B2F2F' }}>Items</th>
                    <th style={{ border: 'none', padding: '12px', fontSize: 14, color: '#3B2F2F' }}>Total</th>
                    <th style={{ border: 'none', padding: '12px', fontSize: 14, color: '#3B2F2F' }}>Status</th>
                    <th style={{ border: 'none', padding: '12px', fontSize: 14, color: '#3B2F2F' }}>Payment ID</th>
                    <th style={{ border: 'none', padding: '12px', fontSize: 14, color: '#3B2F2F' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-4" style={{ color: '#640d14' }}>
                        No orders yet
                      </td>
                    </tr>
                  ) : (
                    orders.map(o => {
                      const dt = o.createdAt && o.createdAt.seconds ? new Date(o.createdAt.seconds * 1000) : null;
                      const name = `${o?.customerInfo?.firstName || ''} ${o?.customerInfo?.lastName || ''}`.trim() || (o?.customerInfo?.email || 'Guest');
                      const itemCount = Array.isArray(o.items) ? o.items.reduce((n, it) => n + (Number(it.quantity || 1)), 0) : 0;
                      return (
                        <tr key={o.id} style={{ borderBottom: '1px solid #E8EBDD' }}>
                          <td style={{ padding: '12px', color: '#3B2F2F' }}>{dt ? dt.toLocaleString() : '-'}</td>
                          <td style={{ padding: '12px', color: '#3B2F2F' }}>{name}</td>
                          <td style={{ padding: '12px', color: '#3B2F2F' }}>{itemCount}</td>
                          <td style={{ padding: '12px', color: '#3B2F2F', fontWeight: 600 }}>₹{formatPrice(o.total)}</td>
                          <td style={{ padding: '12px' }}>
                            <span style={{
                              background: o.status === 'paid' ? 'linear-gradient(135deg, #3FC53A, #4CAF50)' : 'linear-gradient(135deg, #E91E63, #C2185B)',
                              color: '#fff', padding: '4px 10px', borderRadius: 16, fontSize: 12, fontWeight: 600
                            }}>
                              {o.status || 'pending'}
                            </span>
                          </td>
                          <td style={{ padding: '12px', color: '#3B2F2F' }}>{o.paymentId || '-'}</td>
                          <td style={{ padding: '12px' }}>
                            <button
                              className="btn btn-sm"
                              onClick={() => handleDeleteOrder(o.id)}
                              style={{ background: '#fff', color: '#D32F2F', border: '2px solid #D32F2F', borderRadius: '8px', padding: '6px 12px', fontSize: '12px' }}
                            >
                              <i className="fas fa-trash me-1"></i>
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Testimonials Management */}
        <div className="mt-4" style={{
          background: '#fff',
          borderRadius: '20px',
          padding: '30px',
          boxShadow: '0 10px 40px rgba(123, 84, 33, 0.1)',
          border: '1px solid rgba(201, 179, 126, 0.2)'
        }}>
          <h3 style={{
            color: '#3B2F2F',
            fontSize: '24px',
            fontWeight: '600',
            marginBottom: '20px',
            fontFamily: 'serif'
          }}>
            <i className="fas fa-comments me-2" style={{ color: '#640d14' }}></i>
            Testimonials
          </h3>

          {isReviewsLoading ? (
            <div className="text-center py-4" style={{ color: '#640d14' }}>
              <i className="fas fa-spinner fa-spin me-2"></i> Loading testimonials...
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-4" style={{ color: '#640d14', opacity: 0.8 }}>
              No testimonials found.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover" style={{ margin: 0 }}>
                <thead>
                  <tr style={{ background: 'linear-gradient(135deg, #F8F5F2, #EFE8DC)' }}>
                    <th style={{ border: 'none', padding: '12px', fontSize: '14px', color: '#3B2F2F' }}>User</th>
                    <th style={{ border: 'none', padding: '12px', fontSize: '14px', color: '#3B2F2F' }}>Rating</th>
                    <th style={{ border: 'none', padding: '12px', fontSize: '14px', color: '#3B2F2F' }}>Message</th>
                    <th style={{ border: 'none', padding: '12px', fontSize: '14px', color: '#3B2F2F' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reviews.map(r => (
                    <tr key={r.id} style={{ borderBottom: '1px solid #E8EBDD' }}>
                      <td style={{ padding: '12px' }}>
                        <div className="d-flex align-items-center gap-2">
                          {r.image ? (
                            <img src={r.image} alt={r.name} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', border: '1px solid #E8EBDD' }} />
                          ) : (
                            <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#f3ede2' }}></div>
                          )}
                          <span style={{ color: '#3B2F2F', fontWeight: 500 }}>{r.name || 'Anonymous'}</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px', color: '#640d14', fontWeight: 600 }}>{r.rating || 0}/5</td>
                      <td style={{ padding: '12px', color: '#3B2F2F' }}>
                        <span style={{ display: 'inline-block', maxWidth: 480, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {r.message}
                        </span>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <button
                          className="btn btn-sm"
                          onClick={() => handleDeleteReview(r.id)}
                          style={{ background: '#fff', color: '#D32F2F', border: '2px solid #D32F2F', borderRadius: '8px', padding: '6px 12px', fontSize: '12px' }}
                        >
                          <i className="fas fa-trash me-1"></i>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="modal show d-block" tabIndex="-1" style={{
          background: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(10px)'
        }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content" style={{
              borderRadius: '20px',
              border: '1px solid rgba(201, 179, 126, 0.2)',
              boxShadow: '0 20px 60px rgba(123, 84, 33, 0.2)'
            }}>
              <div className="modal-header" style={{
                borderBottom: '1px solid #E8EBDD',
                padding: '25px 30px'
              }}>
                <h5 className="modal-title" style={{
                  color: '#3B2F2F',
                  fontWeight: '600',
                  fontSize: '20px'
                }}>
                  <i className="fas fa-plus me-2" style={{ color: '#640d14' }}></i>
                  Add New Product
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowUploadModal(false)}
                  style={{ fontSize: '18px' }}
                />
              </div>
              <div className="modal-body" style={{ padding: '30px' }}>
                <UploadItemForm onUploadSuccess={() => {
                  fetchProducts();
                  setShowUploadModal(false);
                }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CSV Upload Modal */}
      {showCsvModal && (
        <div className="modal show d-block" tabIndex="-1" style={{
          background: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(10px)',
          zIndex: 1050
        }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content" style={{
              borderRadius: '24px',
              border: '1px solid #e0d6c3',
              boxShadow: '0 16px 48px rgba(123, 84, 33, 0.18)',
              background: 'linear-gradient(135deg, #fff 80%, #f8f5f2 100%)',
              overflow: 'hidden'
            }}>
              <div className="modal-header" style={{
                borderBottom: '1px solid #f3ede2',
                padding: '32px 36px',
                background: 'linear-gradient(90deg, #f8f5f2 60%, #efe8dc 100%)'
              }}>
                <h4 className="modal-title" style={{
                  color: '#3B2F2F',
                  fontWeight: '700',
                  fontSize: '22px',
                  letterSpacing: '0.5px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <i className="fas fa-file-csv" style={{ color: '#2196F3', fontSize: 22 }}></i>
                  Upload Products from CSV
                </h4>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowCsvModal(false);
                    setCsvFile(null);
                    const fileInput = document.getElementById('csv-file-input');
                    if (fileInput) fileInput.value = '';
                  }}
                  style={{ fontSize: '20px', outline: 'none' }}
                />
              </div>
              <div className="modal-body" style={{ padding: '36px 36px 24px 36px', background: '#fff' }}>
                <div className="mb-4">
                  <label className="form-label" style={{ color: '#3B2F2F', fontWeight: '600', fontSize: 15, marginBottom: '12px' }}>
                    <i className="fas fa-file me-2" style={{ color: '#2196F3' }}></i>
                    Select CSV File
                  </label>
                  <input
                    id="csv-file-input"
                    type="file"
                    accept=".csv"
                    onChange={handleCsvFileChange}
                    className="form-control"
                    style={{
                      border: '2px solid #E8EBDD',
                      borderRadius: '14px',
                      padding: '15px 18px',
                      fontSize: '16px',
                      background: '#F8F5F2',
                      boxShadow: '0 2px 8px rgba(123, 84, 33, 0.04)'
                    }}
                  />
                  {csvFile && (
                    <div className="mt-2" style={{ color: '#4CAF50', fontSize: '14px' }}>
                      <i className="fas fa-check-circle me-2"></i>
                      Selected: {csvFile.name}
                    </div>
                  )}
                </div>

                {/* CSV Format Guide */}
                <div style={{
                  background: '#F8F5F2',
                  borderRadius: '12px',
                  padding: '20px',
                  marginBottom: '20px',
                  border: '1px solid #E8EBDD'
                }}>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 style={{ color: '#3B2F2F', fontWeight: '600', margin: 0 }}>
                      <i className="fas fa-info-circle me-2" style={{ color: '#2196F3' }}></i>
                      CSV Format Guide
                    </h6>
                    <button
                      type="button"
                      onClick={downloadSampleCSV}
                      className="btn btn-sm"
                      style={{
                        background: 'linear-gradient(135deg, #2196F3, #1976D2)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '6px 12px',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}
                    >
                      <i className="fas fa-download me-1"></i>
                      Download Template
                    </button>
                  </div>
                  <p style={{ color: '#640d14', fontSize: '13px', marginBottom: '10px', fontWeight: '600' }}>
                    Required columns: name, brand, size, price, imageUrls
                  </p>
                  <p style={{ color: '#3B2F2F', fontSize: '12px', marginBottom: '8px' }}>
                    <strong>Optional columns:</strong> data (description), badge (category), note (perfume note), gender, oldPrice, stock, isOutOfStock, tags
                  </p>
                  <p style={{ color: '#3B2F2F', fontSize: '12px', marginBottom: '8px' }}>
                    <strong>Image URLs:</strong> Comma or semicolon separated (e.g., "url1,url2,url3")
                  </p>
                  <p style={{ color: '#3B2F2F', fontSize: '12px', marginBottom: '8px' }}>
                    <strong>Tags:</strong> Comma or semicolon separated (e.g., "Top Sales,New Arrivals")
                  </p>
                  <p style={{ color: '#3B2F2F', fontSize: '12px' }}>
                    <strong>Note:</strong> Multiple sizes for the same product (same name+brand) will be grouped automatically
                  </p>
                </div>

                {/* Progress Indicator */}
                {isCsvUploading && csvUploadProgress.total > 0 && (
                  <div className="mb-3">
                    <div className="d-flex justify-content-between mb-2">
                      <span style={{ color: '#3B2F2F', fontSize: '14px', fontWeight: '600' }}>
                        Uploading products...
                      </span>
                      <span style={{ color: '#640d14', fontSize: '14px', fontWeight: '600' }}>
                        {csvUploadProgress.current} / {csvUploadProgress.total}
                      </span>
                    </div>
                    <div className="progress" style={{ height: '24px', borderRadius: '12px', overflow: 'hidden' }}>
                      <div
                        className="progress-bar"
                        role="progressbar"
                        style={{
                          width: `${(csvUploadProgress.current / csvUploadProgress.total) * 100}%`,
                          background: 'linear-gradient(135deg, #2196F3, #1976D2)',
                          transition: 'width 0.3s ease'
                        }}
                      >
                        {Math.round((csvUploadProgress.current / csvUploadProgress.total) * 100)}%
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer" style={{
                borderTop: '1px solid #f3ede2',
                padding: '28px 36px',
                background: '#f8f5f2'
              }}>
                <button
                  className="btn"
                  onClick={() => {
                    setShowCsvModal(false);
                    setCsvFile(null);
                    const fileInput = document.getElementById('csv-file-input');
                    if (fileInput) fileInput.value = '';
                  }}
                  disabled={isCsvUploading}
                  style={{
                    background: '#fff',
                    color: '#640d14',
                    border: '2px solid #640d14',
                    borderRadius: '14px',
                    padding: '12px 28px',
                    fontWeight: '700',
                    fontSize: '16px',
                    marginRight: '10px',
                    boxShadow: '0 2px 8px rgba(123, 84, 33, 0.04)',
                    opacity: isCsvUploading ? 0.6 : 1
                  }}
                >
                  Cancel
                </button>
                <button
                  className="btn"
                  onClick={handleCsvUpload}
                  disabled={isCsvUploading || !csvFile}
                  style={{
                    background: isCsvUploading || !csvFile
                      ? '#C9B37E'
                      : 'linear-gradient(135deg, #2196F3, #1976D2)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '14px',
                    padding: '12px 28px',
                    fontWeight: '700',
                    fontSize: '16px',
                    boxShadow: '0 4px 16px rgba(33, 150, 243, 0.10)',
                    cursor: isCsvUploading || !csvFile ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isCsvUploading ? (
                    <>
                      <i className="fas fa-spinner fa-spin me-2"></i>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-upload me-2"></i>
                      Upload CSV
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Video Management Modal */}
      {showVideoModal && (
        <div className="modal show d-block" tabIndex="-1" style={{
          background: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(10px)',
          zIndex: 1050
        }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content" style={{
              borderRadius: '24px',
              border: '1px solid #e0d6c3',
              boxShadow: '0 16px 48px rgba(123, 84, 33, 0.18)',
              background: 'linear-gradient(135deg, #fff 80%, #f8f5f2 100%)',
              overflow: 'hidden'
            }}>
              <div className="modal-header" style={{
                borderBottom: '1px solid #f3ede2',
                padding: '32px 36px',
                background: 'linear-gradient(90deg, #f8f5f2 60%, #efe8dc 100%)'
              }}>
                <h4 className="modal-title" style={{
                  color: '#3B2F2F',
                  fontWeight: '700',
                  fontSize: '22px',
                  letterSpacing: '0.5px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <i className="fas fa-video" style={{ color: '#FF6B35', fontSize: 22 }}></i>
                  Manage Homepage Videos
                </h4>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowVideoModal(false)}
                  style={{ fontSize: '20px', outline: 'none' }}
                />
              </div>
              <div className="modal-body" style={{ padding: '36px 36px 24px 36px', background: '#fff' }}>
                <div className="row g-4">
                  {/* Hero Video */}
                  <div className="col-md-4">
                    <div style={{
                      background: '#F8F5F2',
                      borderRadius: '16px',
                      padding: '20px',
                      border: '2px solid #E8EBDD'
                    }}>
                      <h6 style={{ color: '#3B2F2F', fontWeight: '600', marginBottom: '15px' }}>
                        <i className="fas fa-play-circle me-2" style={{ color: '#FF6B35' }}></i>
                        Hero Video
                      </h6>
                      {currentVideos.heroVideoUrl && (
                        <div style={{ marginBottom: '15px' }}>
                          <video
                            src={currentVideos.heroVideoUrl}
                            style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '8px' }}
                            muted
                          />
                        </div>
                      )}
                      <input
                        type="file"
                        accept="video/*"
                        onChange={(e) => setVideoFiles(prev => ({ ...prev, heroVideo: e.target.files[0] }))}
                        className="form-control"
                        style={{
                          border: '2px solid #E8EBDD',
                          borderRadius: '12px',
                          padding: '10px',
                          fontSize: '14px',
                          background: '#fff'
                        }}
                      />
                    </div>
                  </div>

                  {/* Stage Video */}
                  <div className="col-md-4">
                    <div style={{
                      background: '#F8F5F2',
                      borderRadius: '16px',
                      padding: '20px',
                      border: '2px solid #E8EBDD'
                    }}>
                      <h6 style={{ color: '#3B2F2F', fontWeight: '600', marginBottom: '15px' }}>
                        <i className="fas fa-film me-2" style={{ color: '#FF6B35' }}></i>
                        Stage Video
                      </h6>
                      {currentVideos.stageVideoUrl && (
                        <div style={{ marginBottom: '15px' }}>
                          <video
                            src={currentVideos.stageVideoUrl}
                            style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '8px' }}
                            muted
                          />
                        </div>
                      )}
                      <input
                        type="file"
                        accept="video/*"
                        onChange={(e) => setVideoFiles(prev => ({ ...prev, stageVideo: e.target.files[0] }))}
                        className="form-control"
                        style={{
                          border: '2px solid #E8EBDD',
                          borderRadius: '12px',
                          padding: '10px',
                          fontSize: '14px',
                          background: '#fff'
                        }}
                      />
                    </div>
                  </div>

                  {/* Banner Video */}
                  <div className="col-md-4">
                    <div style={{
                      background: '#F8F5F2',
                      borderRadius: '16px',
                      padding: '20px',
                      border: '2px solid #E8EBDD'
                    }}>
                      <h6 style={{ color: '#3B2F2F', fontWeight: '600', marginBottom: '15px' }}>
                        <i className="fas fa-image me-2" style={{ color: '#FF6B35' }}></i>
                        Banner Video
                      </h6>
                      {currentVideos.bannerVideoUrl && (
                        <div style={{ marginBottom: '15px' }}>
                          <video
                            src={currentVideos.bannerVideoUrl}
                            style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '8px' }}
                            muted
                          />
                        </div>
                      )}
                      <input
                        type="file"
                        accept="video/*"
                        onChange={(e) => setVideoFiles(prev => ({ ...prev, bannerVideo: e.target.files[0] }))}
                        className="form-control"
                        style={{
                          border: '2px solid #E8EBDD',
                          borderRadius: '12px',
                          padding: '10px',
                          fontSize: '14px',
                          background: '#fff'
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div style={{
                  background: '#FFF8E1',
                  borderRadius: '12px',
                  padding: '20px',
                  marginTop: '20px',
                  border: '1px solid #FFE082'
                }}>
                  <p style={{ color: '#3B2F2F', fontSize: '14px', margin: 0 }}>
                    <i className="fas fa-info-circle me-2" style={{ color: '#FF6B35' }}></i>
                    <strong>Note:</strong> Videos will be uploaded to both Firebase Storage and Cloudinary for optimal performance.
                    Only select files if you want to replace the current videos. Leave empty to keep existing videos.
                  </p>
                </div>
              </div>
              <div className="modal-footer" style={{
                borderTop: '1px solid #f3ede2',
                padding: '28px 36px',
                background: '#f8f5f2'
              }}>
                <button
                  className="btn"
                  onClick={() => setShowVideoModal(false)}
                  disabled={isVideoUploading}
                  style={{
                    background: '#fff',
                    color: '#640d14',
                    border: '2px solid #640d14',
                    borderRadius: '14px',
                    padding: '12px 28px',
                    fontWeight: '700',
                    fontSize: '16px',
                    marginRight: '10px',
                    boxShadow: '0 2px 8px rgba(123, 84, 33, 0.04)',
                    opacity: isVideoUploading ? 0.6 : 1
                  }}
                >
                  Cancel
                </button>
                <button
                  className="btn"
                  onClick={handleVideoUpload}
                  disabled={isVideoUploading || (!videoFiles.heroVideo && !videoFiles.stageVideo && !videoFiles.bannerVideo)}
                  style={{
                    background: isVideoUploading
                      ? '#C9B37E'
                      : 'linear-gradient(135deg, #FF6B35, #F7931E)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '14px',
                    padding: '12px 28px',
                    fontWeight: '700',
                    fontSize: '16px',
                    boxShadow: '0 4px 16px rgba(255, 107, 53, 0.10)',
                    cursor: isVideoUploading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isVideoUploading ? (
                    <>
                      <i className="fas fa-spinner fa-spin me-2"></i>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-upload me-2"></i>
                      Upload Videos
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {editItem && (
        <div className="fixed inset-0 z-[1050] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">

          <div className="bg-white w-full max-w-5xl rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-neutral-100 flex flex-col max-h-[95vh]">

            {/* Header */}
            <div className="bg-neutral-900 py-8 px-8 flex items-center justify-between">
              <div>
                <h3 className="text-white text-2xl font-light tracking-widest uppercase font-serif">
                  Edit Product
                </h3>
                <p className="text-neutral-400 text-xs mt-1 tracking-widest uppercase">
                  Update Inventory Item
                </p>
              </div>

              <button
                className="w-10 h-10 rounded-full flex items-center justify-center text-white hover:bg-white/10 transition"
                onClick={() => setEditItem(null)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>


            {/* Body */}
            <div className="p-10 overflow-y-auto space-y-10">

              {/* Basic Info */}
              <section className="space-y-6">
                <h4 className="text-neutral-900 text-sm font-bold tracking-widest uppercase border-b border-neutral-100 pb-2">
                  01. Essential Details
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold tracking-[0.2em] text-neutral-500 uppercase">
                      Product Name
                    </label>
                    <input
                      name="name"
                      value={formData.name || ''}
                      onChange={handleFormChange}
                      className="bg-neutral-50 rounded-xl p-3 border-none focus:ring-2 focus:ring-neutral-900 outline-none"
                    />
                  </div>


                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold tracking-[0.2em] text-neutral-500 uppercase">
                      Brand
                    </label>
                    <select
                      name="brand"
                      value={formData.brand || ''}
                      onChange={handleFormChange}
                      className="bg-neutral-50 rounded-xl p-3 border-none focus:ring-2 focus:ring-neutral-900 outline-none"
                    >
                      <option value="">Select Brand</option>
                      {brands.map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>


                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold tracking-[0.2em] text-neutral-500 uppercase">
                      Category
                    </label>
                    <select
                      name="badge"
                      value={formData.badge || ''}
                      onChange={handleFormChange}
                      className="bg-neutral-50 rounded-xl p-3 border-none focus:ring-2 focus:ring-neutral-900 outline-none"
                    >
                      <option value="">Select Category</option>
                      <option value="Designer">Designer</option>
                      <option value="Middle eastern">Middle eastern</option>
                      <option value="niche">niche</option>
                      <option value="Vials">Vials</option>
                      <option value="Gift sets">Gift sets</option>
                      <option value="Combo">Combo</option>
                      <option value="custom">custom</option>
                    </select>
                    {formData.badge === 'custom' && (
                      <input
                        name="customBadge"
                        value={formData.customBadge || ''}
                        onChange={handleFormChange}
                        placeholder="Enter custom category"
                        className="mt-2 bg-neutral-50 rounded-xl p-3 border-none focus:ring-2 focus:ring-neutral-900 outline-none"
                      />
                    )}
                  </div>


                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold tracking-[0.2em] text-neutral-500 uppercase">
                      Fragrance Note
                    </label>
                    <select
                      name="note"
                      value={formData.note || ''}
                      onChange={handleFormChange}
                      className="bg-neutral-50 rounded-xl p-3 border-none focus:ring-2 focus:ring-neutral-900 outline-none"
                    >
                      <option value="">Select Note</option>
                      {perfumeNotes.map(n => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                    {formData.note === 'Custom' && (
                      <input
                        name="customNote"
                        value={formData.customNote || ''}
                        onChange={handleFormChange}
                        placeholder="Enter custom perfume node"
                        className="mt-2 bg-neutral-50 rounded-xl p-3 border-none focus:ring-2 focus:ring-neutral-900 outline-none"
                      />
                    )}
                  </div>

                </div>
              </section>


              {/* Variants */}
              <section className="space-y-6">
                <h4 className="text-neutral-900 text-sm font-bold tracking-widest uppercase border-b border-neutral-100 pb-2">
                  02. Variants & Inventory
                </h4>

                <div className="space-y-8">
                  {formData.sizes?.map((sz, idx) => (
                    <div key={idx} className="p-6 bg-neutral-50 rounded-2xl border border-neutral-100">

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

                        {/* Size Select */}
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-bold uppercase text-neutral-500 ml-1">Size</label>
                          <select
                            value={sz.size}
                            onChange={e => handleSizeChange(idx, 'size', e.target.value)}
                            className="bg-white rounded-lg p-3 text-sm border-none focus:ring-2 focus:ring-neutral-900"
                          >
                            <option value="">Select Size</option>
                            <option value="10ml">10ml</option>
                            <option value="20ml">20ml</option>
                            <option value="50ml">50ml</option>
                            <option value="100ml">100ml</option>
                            <option value="custom">Custom</option>
                          </select>
                        </div>

                        {/* Current Price */}
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-bold uppercase text-neutral-500 ml-1">Price ($)</label>
                          <input
                            type="number"
                            value={sz.price}
                            placeholder="0.00"
                            onChange={e => handleSizeChange(idx, 'price', e.target.value)}
                            className="bg-white rounded-lg p-3 text-sm border-none focus:ring-2 focus:ring-neutral-900"
                          />
                        </div>

                        {/* Old Price */}
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-bold uppercase text-neutral-500 ml-1">Old Price ($)</label>
                          <input
                            type="number"
                            value={sz.oldPrice}
                            placeholder="0.00"
                            onChange={e => handleSizeChange(idx, 'oldPrice', e.target.value)}
                            className="bg-white rounded-lg p-3 text-sm border-none focus:ring-2 focus:ring-neutral-900"
                          />
                        </div>

                        {/* Stock Count */}
                        {!formData.isPreOrder && (
                          <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-bold uppercase text-neutral-500 ml-1">Inventory (Stock)</label>
                            <input
                              type="number"
                              value={sz.stock}
                              placeholder="0"
                              onChange={e => handleSizeChange(idx, 'stock', e.target.value)}
                              className="bg-white rounded-lg p-3 text-sm border-none focus:ring-2 focus:ring-neutral-900"
                            />
                          </div>
                        )}

                      </div>

                      {/* Image Upload Section */}
                      <div className="mt-6 pt-6 border-t border-neutral-200/50">
                        <label className="text-[10px] font-bold uppercase text-neutral-500 block mb-3 ml-1">
                          Variant Images
                        </label>

                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          className="text-xs file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-bold file:uppercase file:bg-neutral-900 file:text-white hover:file:bg-neutral-700 cursor-pointer"
                          onChange={e => handleSizeImagesChange(idx, e.target.files)}
                        />

                        <div className="flex gap-3 mt-4 flex-wrap">
                          {sz.imagesPreview?.map((src, i) => (
                            <div key={i} className="relative group w-20 h-24 rounded-lg overflow-hidden border border-neutral-200">
                              <img src={src} className="w-full h-full object-cover" alt={`Preview ${i}`} />
                              <button
                                type="button"
                                className="absolute inset-0 bg-black/60 text-white text-[10px] font-bold uppercase opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => handleRemoveSizeImage(idx, i)}
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              </section>


              {/* Order Type & Gender */}
              <section className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="flex flex-col gap-4">
                    <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Order Type</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <input
                          type="checkbox"
                          name="isPreOrder"
                          className="w-5 h-5 accent-neutral-900 rounded"
                          checked={formData.isPreOrder}
                          onChange={handleFormChange}
                        />
                        <span className="text-xs uppercase tracking-tighter text-neutral-600 group-hover:text-black transition-colors">Pre-Order Item</span>
                      </label>
                    </div>
                  </div>
                </div>
              </section>

              {/* Description */}
              <section>
                <label className="text-[10px] font-bold tracking-[0.2em] text-neutral-500 uppercase">
                  Product Narrative
                </label>

                <textarea
                  name="data"
                  rows="4"
                  value={formData.data}
                  onChange={handleFormChange}
                  className="mt-2 w-full bg-neutral-50 rounded-xl p-4 border-none focus:ring-2 focus:ring-neutral-900 outline-none"
                />
              </section>

            </div>


            {/* Footer */}
            <div className="p-6 border-t border-neutral-100 flex justify-end gap-4">

              <button
                className="px-8 py-3 border border-neutral-300 rounded-full text-sm font-bold hover:bg-neutral-100"
                onClick={() => setEditItem(null)}
              >
                Cancel
              </button>


              <button
                onClick={handleUpdate}
                disabled={isUpdating}
                className="px-10 py-3 bg-neutral-900 text-white rounded-full text-sm font-bold hover:bg-black transition"
              >
                {isUpdating ? "Updating..." : "Save Changes"}
              </button>

            </div>

          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard;
