'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Product } from '@/lib/types';
import { VariantSelector } from '@/components/variant-selector';
import { Edit2, Trash2, Eye, Heart } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

interface ProductCardProps {
  product: Product;
  onEdit?: (product: Product) => void;
  onDelete?: (product: Product) => void;
}

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=500&fit=crop';

export function ProductCard({ product, onEdit, onDelete }: ProductCardProps) {
  const { isAdmin, canMutate } = useAuth();
  const variants = product.variants || [];
  const [selectedVariant, setSelectedVariant] = useState(variants[0] || null);
  const [isFavorited, setIsFavorited] = useState(false);

  const totalStock = variants.reduce((sum, v) => sum + (v.stock || 0), 0);

  const getStockColor = (stock: number) => {
    if (stock > 5) return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400';
    if (stock > 0) return 'bg-orange-500/10 text-orange-700 dark:text-orange-400';
    return 'bg-destructive/10 text-destructive';
  };

  const getStockLabel = (stock: number) => {
    if (stock > 5) return 'In Stock';
    if (stock > 0) return 'Low Stock';
    return 'Out of Stock';
  };

  const displayImage = selectedVariant?.image || FALLBACK_IMAGE;

  return (
    <Card className="overflow-hidden border-border bg-card hover:shadow-lg transition-shadow duration-300 flex flex-col">
      {/* Image Container */}
      <div className="relative w-full h-56 bg-secondary/50 overflow-hidden group">
        <Link href={`/products/${encodeURIComponent(product.productId)}`} className="block w-full h-full">
          <Image
            src={displayImage}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </Link>
        {selectedVariant && selectedVariant.stock === 0 && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center pointer-events-none">
            <span className="text-white font-semibold text-sm">Out of Stock</span>
          </div>
        )}
        <button
          onClick={() => setIsFavorited(!isFavorited)}
          className="absolute top-2 right-2 p-2 rounded-full bg-background/80 hover:bg-background transition-colors"
        >
          <Heart
            className={`w-4 h-4 ${
              isFavorited ? 'fill-destructive text-destructive' : 'text-foreground'
            }`}
          />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3 flex-1 flex flex-col">
        {/* Brand Badge */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold bg-accent/10 text-accent">
              {product.brand}
            </span>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStockColor(totalStock)}`}>
            {getStockLabel(totalStock)}
          </span>
        </div>

        {/* Product Name */}
        <div>
          <Link
            href={`/products/${encodeURIComponent(product.productId)}`}
            className="hover:text-accent transition-colors"
          >
            <h3 className="font-semibold text-foreground line-clamp-2">
              {product.name}
            </h3>
          </Link>
          <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
            <span>{product.category}</span>
            <span className="font-mono text-[11px] text-muted-foreground/80">ID: {product.productId}</span>
          </div>
        </div>

        {/* Price */}
        <div className="pt-2 border-t border-border">
          <p className="text-2xl font-bold text-accent">
            ₹{selectedVariant ? selectedVariant.price.toLocaleString() : 'N/A'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {variants.length} variant{variants.length !== 1 ? 's' : ''} (Total Stock: {totalStock})
          </p>
        </div>

        {/* Variant Selector */}
        {variants.length > 0 && selectedVariant && (
          <div className="py-3 border-t border-border flex-1">
            <VariantSelector
              variants={variants}
              selectedVariant={selectedVariant}
              onVariantChange={setSelectedVariant}
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2 border-t border-border mt-auto">
          <Link href={`/products/${encodeURIComponent(product.productId)}`} className="flex-1">
            <Button size="sm" variant="outline" className="w-full gap-1.5 text-xs">
              <Eye className="w-3.5 h-3.5" />
              Details
            </Button>
          </Link>

          {canMutate && onEdit && (
            <Button
              size="sm"
              variant="ghost"
              className="px-2.5 hover:bg-secondary"
              onClick={() => onEdit(product)}
              title="Edit Product (Admin/Manager)"
            >
              <Edit2 className="w-4 h-4 text-foreground" />
            </Button>
          )}

          {isAdmin && onDelete && (
            <Button
              size="sm"
              variant="ghost"
              className="px-2.5 text-destructive hover:bg-destructive/10"
              onClick={() => onDelete(product)}
              title="Delete Product (Admin Only)"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
