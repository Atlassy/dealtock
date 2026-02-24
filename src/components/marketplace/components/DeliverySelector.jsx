// src/components/marketplace/components/DeliverySelector.jsx
import React from 'react';
import { Truck, Clock, Star, AlertCircle } from 'lucide-react';

export default function DeliverySelector({ 
  options, 
  loading, 
  selectedId, 
  onSelect,
  destinationCity 
}) {
  if (!destinationCity || destinationCity.length < 3) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-center text-gray-500">
        <Truck className="h-8 w-8 mx-auto mb-2" />
        <p>Enter shipping city to see delivery options</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-center">
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-gray-200 rounded"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (options.length === 0) {
    return (
      <div className="bg-yellow-50 rounded-lg p-6 text-center">
        <AlertCircle className="h-8 w-8 mx-auto mb-2 text-yellow-600" />
        <p className="text-yellow-800">No delivery companies available for this city</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 rounded-lg p-6">
      <h3 className="font-semibold text-lg mb-4">Select Delivery Company</h3>
      
      <div className="space-y-3">
        {options.map((company) => (
          <div
            key={company.id}
            onClick={() => onSelect(company)}
            className={`p-4 border rounded-lg cursor-pointer transition-all ${
              selectedId === company.id
                ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                : 'border-gray-200 hover:border-primary/50 hover:bg-gray-50'
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <h4 className="font-medium">{company.name}</h4>
                <p className="text-sm text-gray-600">{company.service_type}</p>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold text-primary">
                  {company.calculatedFee.toFixed(2)} MAD
                </span>
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <Clock className="h-4 w-4" />
                  <span>{company.estimatedDays} days</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 text-yellow-400 fill-current" />
                <span>{company.average_rating?.toFixed(1) || '5.0'}</span>
              </div>
              {company.cod_fee > 0 && (
                <span className="text-gray-500">COD Fee: {company.cod_fee} MAD</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}