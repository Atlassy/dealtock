// src/hooks/useDeliveryOptions.js - FIXED WITH useCallback
import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

export function useDeliveryOptions() {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Wrap calculateOptions in useCallback to prevent recreation on every render
  const calculateOptions = useCallback(async (productId, destinationCity, weight) => {
    // Don't call if missing required data
    if (!destinationCity || destinationCity.length < 2 || !productId) {
      setOptions([]);
      return;
    }

    // Prevent excessive calls - add a small debounce
    const timeoutId = setTimeout(async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('🔵 Calculating options for:', destinationCity);

        // Get product weight
        let productWeight = weight;
        if (!productWeight) {
          const { data: product } = await supabase
            .from('products')
            .select('weight_kg')
            .eq('id', productId)
            .single();
          productWeight = product?.weight_kg || 1;
        }

        // Get all active delivery companies
        const { data: companies, error: companiesError } = await supabase
          .from('delivery_companies')
          .select(`
            id,
            name,
            service_type,
            base_fee_multiplier,
            cod_fee,
            average_rating,
            is_active,
            escrow_enabled
          `)
          .eq('is_active', true);

        if (companiesError) throw companiesError;

        // Create options based on service type
        const calculatedOptions = (companies || []).map(company => {
          let baseFee = 25;
          let perKgFee = 5;
          let estimatedDays = 3;

          if (company.service_type === 'express') {
            baseFee = 35;
            perKgFee = 8;
            estimatedDays = 1;
          } else if (company.service_type === 'economy') {
            baseFee = 15;
            perKgFee = 3;
            estimatedDays = 5;
          }

          const multiplier = company.base_fee_multiplier || 1;
          const totalFee = (baseFee * multiplier) + (perKgFee * productWeight);

          return {
            id: company.id,
            name: company.name,
            service_type: company.service_type || 'standard',
            calculatedFee: Math.round(totalFee * 100) / 100,
            cod_fee: company.cod_fee || 10,
            estimatedDays: estimatedDays,
            base_fee_multiplier: multiplier,
            average_rating: company.average_rating || 5,
            escrow_enabled: company.escrow_enabled || false,
            is_active: company.is_active
          };
        });

        // Sort by price
        calculatedOptions.sort((a, b) => a.calculatedFee - b.calculatedFee);

        setOptions(calculatedOptions);

      } catch (err) {
        console.error('❌ Error:', err);
        setError(err.message);
        setOptions([]);
      } finally {
        setLoading(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, []); // Empty dependency array - calculateOptions never changes

  return { options, loading, error, calculateOptions };
}