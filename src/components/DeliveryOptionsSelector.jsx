// DeliveryOptionsSelector.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const DeliveryOptionsSelector = ({ 
  fromCity, 
  toCity, 
  weight = 1, 
  onOptionSelected 
}) => {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);

  useEffect(() => {
    const fetchOptions = async () => {
      if (!fromCity || !toCity) return;
      
      setLoading(true);
      try {
        const { data, error } = await supabase
          .rpc('calculate_delivery_options', {
            p_from_city: fromCity,
            p_to_city: toCity,
            p_weight_kg: weight,
            p_is_cod: true
          });

        if (!error && data.success) {
          setOptions(data.options || []);
          if (data.options?.length > 0) {
            // Auto-select cheapest option
            setSelectedOption(data.options[0]);
            onOptionSelected(data.options[0]);
          }
        }
      } catch (err) {
        console.error('Error fetching delivery options:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOptions();
  }, [fromCity, toCity, weight]);

  const handleSelectOption = (option) => {
    setSelectedOption(option);
    onOptionSelected(option);
  };

  if (loading) return <div>Loading delivery options...</div>;
  if (options.length === 0) return <div>No delivery options available</div>;

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-lg">Choose Delivery Option</h3>
      
      {options.map((option, index) => (
        <div 
          key={index}
          className={`border rounded-lg p-4 cursor-pointer transition-all ${
            selectedOption?.carrier === option.carrier && 
            selectedOption?.fees?.total_fee === option.fees?.total_fee
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-200 hover:border-gray-300'
          }`}
          onClick={() => handleSelectOption(option)}
        >
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold">{option.carrier}</span>
                <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                  {option.delivery?.service_type || 'standard'}
                </span>
              </div>
              <p className="text-sm text-gray-600">
                {option.delivery?.estimated_days} business days
              </p>
            </div>
            
            <div className="text-right">
              <p className="font-bold text-lg">
                {option.fees?.total_fee} MAD
              </p>
              <p className="text-sm text-gray-500">
                {option.fees?.base_fee} + {option.fees?.cod_fee} COD
              </p>
            </div>
          </div>
          
          {/* Breakdown */}
          <div className="mt-3 text-sm text-gray-500 border-t pt-2">
            <p>📦 {option.delivery?.from_city} → {option.delivery?.to_city}</p>
            {option.breakdown?.filter(item => item).map((item, idx) => (
              <div key={idx} className="flex justify-between">
                <span>{item.item}:</span>
                <span>{item.amount} MAD</span>
              </div>
            ))}
          </div>
        </div>
      ))}
      
      <div className="text-xs text-gray-500 mt-4">
        <p>💡 Tip: Select the option that best fits your budget and delivery timeline</p>
      </div>
    </div>
  );
};