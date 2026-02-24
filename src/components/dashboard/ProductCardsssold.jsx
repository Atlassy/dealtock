import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Package, TrendingUp, Truck, MoreVertical, Calendar, Clock, Edit, XCircle } from 'lucide-react';

const statusDisplayConfig = {
  available: { color: 'status-available', icon: Package, textColor: 'text-green-100' },
  sold: { color: 'status-sold', icon: TrendingUp, textColor: 'text-orange-100' },
  shipped: { color: 'status-delivered', icon: Truck, textColor: 'text-purple-100' },
  pending_approval: { color: 'status-pending', icon: Clock, textColor: 'text-yellow-100' },
  out_of_stock: { color: 'status-out-of-stock', icon: XCircle, textColor: 'text-red-100' },
  default: { color: 'status-unknown', icon: Clock, textColor: 'text-gray-100' }
};

export function ProductCard({ product, index, texts, appLanguage, formatDate, formatPrice, onOpenEditModal }) {
  const currentTexts = texts[appLanguage] || texts.fr;
  const config = statusDisplayConfig[product.status] || statusDisplayConfig.default;
  const StatusIcon = config.icon;

  return (
    <motion.div
      key={product.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 * index }}
    >
      <Card className="glass-effect border-white/20 card-hover overflow-hidden flex flex-col h-full">
        <div className="relative">
          <img   
            className="w-full h-48 object-cover"
            alt={`Image de ${product.name || 'produit'}`} 
            src={product.images && product.images.length > 0 ? product.images[0] : 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400'} 
          />
          <div className="absolute top-4 right-4">
            <Badge className={`${config.color} ${config.textColor} border-0`}>
              <StatusIcon className="w-3 h-3 mr-1" />
              {currentTexts[product.status] || product.status}
            </Badge>
          </div>
        </div>

        <CardHeader className="flex-grow">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <CardTitle className="text-lg text-white">{product.name}</CardTitle>
              <CardDescription className="text-gray-300">
                {product.category}
              </CardDescription>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="glass-effect border-white/20">
                <DropdownMenuLabel>{currentTexts.actions}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onOpenEditModal(product)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Modifier
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          <p className="text-sm text-gray-400 h-10 overflow-hidden">{product.description}</p>
          
          <div className="flex items-center text-sm text-gray-300">
            <Calendar className="w-4 h-4 mr-2 text-gray-400" />
            {currentTexts.entryDate} {formatDate(product.created_at)}
          </div>
          
          <div className="flex justify-between items-center pt-3 border-t border-white/10 mt-3">
            <span className="text-sm text-gray-400">Quantité: {product.quantity}</span>
            <span className="text-lg font-bold text-white">
              {formatPrice(product.unit_price)}
            </span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}