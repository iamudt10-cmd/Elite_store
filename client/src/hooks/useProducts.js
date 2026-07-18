import { useState, useEffect } from 'react';
import api from '../lib/api';

export default function useProducts(filters = {}) {
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const filterKey = JSON.stringify(filters);

  useEffect(() => {
    let isMounted = true;
    const fetchProducts = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const queryParams = new URLSearchParams();
        
        Object.entries(filters).forEach(([key, val]) => {
          if (val !== undefined && val !== null && val !== '') {
            queryParams.append(key, val);
          }
        });

        const { data } = await api.get(`/products?${queryParams.toString()}`);
        if (isMounted && data.success) {
          setProducts(data.products);
          setTotal(data.total);
          setPages(data.pages);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.response?.data?.message || 'Failed to fetch products');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchProducts();

    return () => {
      isMounted = false;
    };
  }, [filterKey]);

  return { products, total, pages, isLoading, error };
}
