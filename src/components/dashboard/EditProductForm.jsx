// In EditProductForm.jsx - Add this validation and SKU handling

const EditProductForm = ({ product, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    sku: '',
    purchase_price: 0,
    quantity: 0,
    location: '',
    condition: 'new',
    image_url: '',
    available_for_sale: true,
    status: 'available'
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [originalSku, setOriginalSku] = useState(''); // Store original SKU

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        category: product.category || '',
        sku: product.sku || '',
        purchase_price: product.purchase_price || 0,
        quantity: product.quantity || 0,
        location: product.location || '',
        condition: product.condition || 'new',
        image_url: product.image_url || '',
        available_for_sale: product.available_for_sale !== false,
        status: product.status || 'available'
      });
      setOriginalSku(product.sku || ''); // Store original SKU
    }
  }, [product]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : 
              name === 'purchase_price' ? (value === '' ? '' : Number(value)) :
              name === 'quantity' ? (value === '' ? '' : parseInt(value) || 0) :
              value
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = async () => {
    const newErrors = {};
    
    // Required fields
    if (!formData.name?.trim()) newErrors.name = 'Product name is required';
    if (!formData.purchase_price || formData.purchase_price <= 0) {
      newErrors.purchase_price = 'Price must be greater than 0';
    }
    if (!formData.quantity || formData.quantity < 0) {
      newErrors.quantity = 'Quantity cannot be negative';
    }
    if (!formData.location?.trim()) {
      newErrors.location = 'Location is required for shipping';
    }

    // SKU UNIQUE VALIDATION - Only check if SKU changed
    if (formData.sku && formData.sku !== originalSku) {
      try {
        const { data: existingProduct, error } = await supabase
          .from('products')
          .select('id, sku')
          .eq('sku', formData.sku)
          .neq('id', product.id) // Exclude current product
          .maybeSingle();

        if (existingProduct) {
          newErrors.sku = 'This SKU already exists. Please use a different SKU.';
        }
      } catch (error) {
        console.error('SKU validation error:', error);
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const isValid = await validateForm();
    if (!isValid) {
      toast.error('Please fix the errors in the form');
      return;
    }
    
    setLoading(true);
    
    // Prepare submission data
    const submissionData = {
      ...formData,
      // If SKU is empty, generate one
      sku: formData.sku?.trim() || `SKU-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      purchase_price: parseFloat(formData.purchase_price) || 0,
      quantity: parseInt(formData.quantity) || 0,
      // Don't send sale_price - marketplace calculates it
    };

    await onSubmit(submissionData);
    setLoading(false);
  };

  // Rest of your component remains the same...
};