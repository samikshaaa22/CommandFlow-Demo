'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { Product, ProductVariant } from '@/lib/types';
import { ChevronDown, Edit2, Trash2, Eye } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

interface ProductRowProps {
  product: Product;
  onEdit?: (product: Product) => void;
  onDelete?: (product: Product) => void;
}

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=500&fit=crop';

export function ProductRow({ product, onEdit, onDelete }: ProductRowProps) {
  const { isAdmin, canMutate } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const variants = product.variants || [];
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    variants[0] || null
  );

  const totalStock = variants.reduce((sum, v) => sum + (v.stock || 0), 0);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400';
      case 'draft':
        return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400';
      case 'archived':
        return 'bg-gray-500/10 text-gray-700 dark:text-gray-400';
      default:
        return 'bg-secondary text-muted-foreground';
    }
  };

  const getStockColor = (stock: number) => {
    if (stock > 5) return 'text-emerald-600 dark:text-emerald-400';
    if (stock > 0) return 'text-orange-600 dark:text-orange-400';
    return 'text-destructive';
  };

  const displayImage = selectedVariant?.image || FALLBACK_IMAGE;

  return (
    <>
      {/* MAIN ROW */}
      <tr className="border-b border-border hover:bg-secondary/50 transition-colors">
        <td className="px-6 py-4 text-sm">
          <div className="flex items-center gap-3">
            {variants.length > 0 && (
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="hover:opacity-80 transition-opacity p-1 text-muted-foreground"
                title="Toggle variants"
              >
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${
                    isExpanded ? 'rotate-180' : ''
                  }`}
                />
              </button>
            )}

            <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-secondary/50 flex-shrink-0">
              <Image
                src={displayImage}
                alt={product.name}
                fill
                className="object-cover"
                sizes="40px"
              />
            </div>

            <div className="text-left">
              <Link
                href={`/products/${encodeURIComponent(product.productId)}`}
                className="font-medium text-foreground hover:text-accent transition-colors block"
              >
                {product.name}
              </Link>
              <p className="text-xs text-muted-foreground">
                {product.productId} • {variants.length} variant{variants.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </td>

        <td className="px-6 py-4 text-sm text-muted-foreground">
          {product.brand}
        </td>

        <td className="px-6 py-4 text-sm text-muted-foreground">
          {product.category}
        </td>

        <td className="px-6 py-4 text-sm font-medium text-accent">
          ₹{selectedVariant ? selectedVariant.price.toLocaleString() : 'N/A'}
        </td>

        <td className={`px-6 py-4 text-sm ${getStockColor(totalStock)}`}>
          {totalStock > 0 ? `${totalStock} units` : 'Out of stock'}
        </td>

        <td className="px-6 py-4 text-sm">
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(
              product.status
            )}`}
          >
            {product.status}
          </span>
        </td>

        <td className="px-6 py-4 text-sm">
          <div className="flex items-center gap-2">
            <Link
              href={`/products/${encodeURIComponent(product.productId)}`}
              className="p-2 hover:bg-secondary rounded-lg transition-colors text-muted-foreground hover:text-foreground"
              title="View Details"
            >
              <Eye className="w-4 h-4" />
            </Link>

            {canMutate && onEdit && (
              <button
                onClick={() => onEdit(product)}
                className="p-2 hover:bg-secondary rounded-lg transition-colors text-foreground"
                title="Edit Product (Admin/Manager)"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            )}

            {isAdmin && onDelete && (
              <button
                onClick={() => onDelete(product)}
                className="p-2 hover:bg-secondary rounded-lg transition-colors text-destructive hover:bg-destructive/10"
                title="Delete Product (Admin Only)"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </td>
      </tr>

      {/* VARIANTS COLLAPSIBLE ROWS */}
      {isExpanded &&
        variants.map((variant) => {
          const isSelected = selectedVariant?.sku === variant.sku;

          return (
            <tr
              key={variant.sku}
              onClick={() => setSelectedVariant(variant)}
              className={`cursor-pointer border-b ${
                isSelected ? 'bg-accent/10' : 'bg-secondary/20'
              }`}
            >
              <td className="px-6 py-3">
                <div className="flex items-center gap-2 pl-8">
                  <div className="relative w-8 h-8 rounded overflow-hidden bg-secondary/50 flex-shrink-0">
                    <Image
                      src={variant.image || FALLBACK_IMAGE}
                      alt={variant.color}
                      fill
                      className="object-cover"
                      sizes="32px"
                    />
                  </div>

                  <div>
                    <p className="text-sm font-medium">
                      {variant.color} / {variant.size}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {variant.sku}
                    </p>
                  </div>
                </div>
              </td>

              <td className="px-6 py-3 text-sm text-muted-foreground">-</td>

              <td className="px-6 py-3 text-sm text-muted-foreground">Variant</td>

              <td className="px-6 py-3 text-sm text-accent font-medium">
                ₹{variant.price.toLocaleString()}
              </td>

              <td className={`px-6 py-3 text-sm ${getStockColor(variant.stock)}`}>
                {variant.stock > 0 ? `${variant.stock} in stock` : 'Out of stock'}
              </td>

              <td className="px-6 py-3 text-sm text-muted-foreground">-</td>

              <td className="px-6 py-3 text-sm text-muted-foreground">
                {isSelected ? (
                  <span className="text-xs text-accent font-medium">Active variant</span>
                ) : (
                  <span className="text-xs text-muted-foreground">Click to view</span>
                )}
              </td>
            </tr>
          );
        })}
    </>
  );
}