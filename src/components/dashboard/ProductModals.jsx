import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

export function ProductModals({
  isSoldModalOpen,
  setIsSoldModalOpen,
  isShippedModalOpen,
  setIsShippedModalOpen,
  currentProduct,
  salePrice,
  setSalePrice,
  carrier,
  setCarrier,
  trackingLink,
  setTrackingLink,
  deliveryProof,
  setDeliveryProof,
  onMarkAsSold,
  onMarkAsShipped,
  texts,
  appLanguage
}) {
  const currentTexts = texts[appLanguage] || texts.fr;

  return (
    <>
      <Dialog open={isSoldModalOpen} onOpenChange={setIsSoldModalOpen}>
        <DialogContent className="glass-effect border-white/20 text-white">
          <DialogHeader>
            <DialogTitle>{currentTexts.markAsSold}</DialogTitle>
            <DialogDescription>{currentTexts.enterSalePrice} {currentTexts.product?.toLowerCase()} "{currentProduct?.name}".</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="salePrice" className="text-right">{currentTexts.salePrice}</Label>
              <Input
                id="salePrice"
                type="number"
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value)}
                className="col-span-3 glass-effect border-white/20"
                placeholder="Ex: 1500"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSoldModalOpen(false)} className="glass-effect border-white/20">{currentTexts.cancel}</Button>
            <Button onClick={onMarkAsSold} className="bg-kraft-700">{currentTexts.confirm}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isShippedModalOpen} onOpenChange={setIsShippedModalOpen}>
        <DialogContent className="glass-effect border-white/20 text-white">
          <DialogHeader>
            <DialogTitle>{currentTexts.markAsShipped}</DialogTitle>
            <DialogDescription>{currentTexts.enterShippingInfo} {currentTexts.product?.toLowerCase()} "{currentProduct?.name}".</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="carrier" className="text-right">{currentTexts.carrier}</Label>
              <Input
                id="carrier"
                value={carrier}
                onChange={(e) => setCarrier(e.target.value)}
                className="col-span-3 glass-effect border-white/20"
                placeholder="Ex: Chronopost"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="trackingLink" className="text-right">{currentTexts.trackingLink}</Label>
              <Input
                id="trackingLink"
                value={trackingLink}
                onChange={(e) => setTrackingLink(e.target.value)}
                className="col-span-3 glass-effect border-white/20"
                placeholder="Ex: https://..."
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="deliveryProof" className="text-right">{currentTexts.deliveryProof}</Label>
              <Input
                id="deliveryProof"
                value={deliveryProof}
                onChange={(e) => setDeliveryProof(e.target.value)}
                className="col-span-3 glass-effect border-white/20"
                placeholder="Ex: signature.pdf ou photo.jpg"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsShippedModalOpen(false)} className="glass-effect border-white/20">{currentTexts.cancel}</Button>
            <Button onClick={onMarkAsShipped} className="bg-gradient-to-r from-purple-500 to-indigo-500">{currentTexts.confirm}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}