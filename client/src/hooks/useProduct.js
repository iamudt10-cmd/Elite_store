import { useState, useEffect } from 'react';
import api from '../lib/api';

export default function useProduct(slug) {
  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!slug) return;
    let isMounted = true;

    const fetchProduct = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const { data } = await api.get(`/products/${slug}`);
        if (isMounted && data.success) {
          setProduct(data.product);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.response?.data?.message || 'Product not found');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchProduct();

    return () => {
      isMounted = false;
    };
  }, [slug]);

  return { product, setProduct, isLoading, error };
}
