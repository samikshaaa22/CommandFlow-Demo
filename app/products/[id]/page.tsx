'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Product, ProductVariant } from '@/lib/types';
import { getProductById, deleteProduct } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';
import { ArrowLeft, Edit2, Trash2, Package, ShieldAlert, CheckCircle2 } from 'lucide-react';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=500&fit=crop';

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const productId = resolvedParams.id;
  const router = useRouter();
  const { token, isAdmin, canMutate } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    async function fetchProduct() {
      try {
        setLoading(true);
        setError(null);
        const data = await getProductById(productId);
        setProduct(data);
        if (data.variants && data.variants.length > 0) {
          setSelectedVariant(data.variants[0]);
        }
      } catch (err: any) {
        console.error('Failed to load product details', err);
        setError(err.message || 'Product not found');
      } finally {
        setLoading(false);
      }
    }

    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  const handleDelete = async () => {
    if (!product) return;
    if (!confirm(`Are you sure you want to delete product "${product.name}" (${product.productId})?`)) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteProduct(product.productId, token);
      toast.success('Product deleted successfully');
      router.push('/products');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete product');
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-12 text-center space-y-4">
        <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full mx-auto" />
        <p className="text-muted-foreground">Loading product details from backend...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <Card className="p-8 border-border bg-card space-y-4">
          <Package className="w-12 h-12 text-muted-foreground mx-auto" />
          <h2 className="text-xl font-bold text-foreground">Product Not Found</h2>
          <p className="text-sm text-muted-foreground">
            {error || `Unable to locate product with ID: "${productId}"`}
          </p>
          <Link href="/products">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Catalog
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  const variants = product.variants || [];
  const totalStock = variants.reduce((sum, v) => sum + (v.stock || 0), 0);
  const displayImage = selectedVariant?.image || FALLBACK_IMAGE;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header and Back Button */}
      <div className="flex items-center justify-between">
        <Link href="/products">
          <Button variant="ghost" size="sm" className="gap-2 hover:bg-secondary">
            <ArrowLeft className="w-4 h-4" />
            Back to Products
          </Button>
        </Link>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}
              className="gap-2"
            >
              <Trash2 className="w-4 h-4" />
              {isDeleting ? 'Deleting...' : 'Delete Product'}
            </Button>
          )}
        </div>
      </div>

      {/* Main Product Info Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Product Image & Variant Gallery */}
        <div className="space-y-4">
          <Card className="overflow-hidden border-border bg-card relative aspect-square flex items-center justify-center">
            <Image
              src={displayImage}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
            />
          </Card>

          {/* Variant Thumbnails */}
          {variants.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {variants.map((v) => {
                const isSelected = selectedVariant?.sku === v.sku;
                return (
                  <button
                    key={v.sku}
                    onClick={() => setSelectedVariant(v)}
                    className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all ${
                      isSelected
                        ? 'border-accent ring-2 ring-accent/30'
                        : 'border-border hover:border-accent/50'
                    }`}
                  >
                    <Image
                      src={v.image || FALLBACK_IMAGE}
                      alt={v.color}
                      fill
                      className="object-cover"
                    />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Product Details & Specs */}
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-accent/10 text-accent">
                {product.brand}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-secondary text-muted-foreground uppercase">
                {product.category}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                  product.status === 'active'
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : 'bg-yellow-500/10 text-yellow-400'
                }`}
              >
                {product.status}
              </span>
            </div>

            <h1 className="text-3xl font-bold text-foreground">{product.name}</h1>
            <p className="text-xs font-mono text-muted-foreground">Product ID: {product.productId}</p>
          </div>

          <div className="p-4 rounded-xl bg-secondary/30 border border-border flex items-baseline justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Variant Price</p>
              <p className="text-3xl font-bold text-accent mt-1">
                ₹{selectedVariant ? selectedVariant.price.toLocaleString() : 'N/A'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Variant Stock</p>
              <p
                className={`text-lg font-semibold mt-1 ${
                  selectedVariant && selectedVariant.stock > 0
                    ? 'text-emerald-400'
                    : 'text-destructive'
                }`}
              >
                {selectedVariant ? `${selectedVariant.stock} units available` : 'Out of stock'}
              </p>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-2">Description</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {product.description || 'No description provided for this product.'}
            </p>
          </div>

          {/* Active Variant Specs */}
          {selectedVariant && (
            <Card className="p-4 border-border bg-card space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Selected Variant Details</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <div>
                  <span className="text-xs text-muted-foreground block">SKU</span>
                  <span className="font-mono text-foreground font-medium">{selectedVariant.sku}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Color</span>
                  <span className="text-foreground font-medium">{selectedVariant.color}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Size</span>
                  <span className="text-foreground font-medium">{selectedVariant.size}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Units</span>
                  <span className="text-foreground font-medium">{selectedVariant.stock}</span>
                </div>
              </div>
            </Card>
          )}

          {/* Total Catalog Metadata */}
          <div className="pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
            <span>Total Catalog Stock: {totalStock} units</span>
            {product.createdAt && (
              <span>Added: {new Date(product.createdAt).toLocaleDateString()}</span>
            )}
          </div>
        </div>
      </div>

      {/* Variants Table */}
      <Card className="border-border bg-card overflow-hidden mt-8">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">All Variants ({variants.length})</h2>
          <span className="text-xs text-muted-foreground font-mono">Live PostgreSQL Database Record</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/20">
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-muted-foreground">
                  Variant
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-muted-foreground">
                  SKU
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-muted-foreground">
                  Color
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-muted-foreground">
                  Size
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-muted-foreground">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-muted-foreground">
                  Stock
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {variants.map((v) => (
                <tr
                  key={v.sku}
                  onClick={() => setSelectedVariant(v)}
                  className={`cursor-pointer hover:bg-secondary/30 transition-colors ${
                    selectedVariant?.sku === v.sku ? 'bg-accent/10' : ''
                  }`}
                >
                  <td className="px-6 py-3">
                    <div className="relative w-10 h-10 rounded overflow-hidden bg-secondary/50">
                      <Image
                        src={v.image || FALLBACK_IMAGE}
                        alt={v.color}
                        fill
                        className="object-cover"
                      />
                    </div>
                  </td>
                  <td className="px-6 py-3 text-sm font-mono text-foreground">{v.sku}</td>
                  <td className="px-6 py-3 text-sm text-muted-foreground">{v.color}</td>
                  <td className="px-6 py-3 text-sm text-muted-foreground">{v.size}</td>
                  <td className="px-6 py-3 text-sm font-semibold text-accent">
                    ₹{v.price.toLocaleString()}
                  </td>
                  <td className="px-6 py-3 text-sm">
                    <span
                      className={
                        v.stock > 5
                          ? 'text-emerald-400 font-medium'
                          : v.stock > 0
                          ? 'text-orange-400 font-medium'
                          : 'text-destructive font-medium'
                      }
                    >
                      {v.stock} in stock
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
