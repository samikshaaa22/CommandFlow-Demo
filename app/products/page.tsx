'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useMemo, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ProductCard } from '@/components/product-card';
import { ProductRow } from '@/components/product-row';
import { Product, CreateProductInput, UpdateProductInput } from '@/lib/types';
import { getProducts, createProduct, updateProduct, deleteProduct } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';
import {
  Plus,
  Search,
  Grid3x3,
  List,
  RefreshCw,
  X,
  ShieldAlert,
  Trash2,
  Edit2,
  PackagePlus,
  Check,
} from 'lucide-react';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=500&fit=crop';

export default function ProductsPage() {
  const { user, token, isAdmin, isManager, canMutate } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'price-low' | 'price-high'>('name');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modal States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Create Form State
  const [newProductId, setNewProductId] = useState('');
  const [newName, setNewName] = useState('');
  const [newBrand, setNewBrand] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newStatus, setNewStatus] = useState('active');
  const [newSku, setNewSku] = useState('');
  const [newColor, setNewColor] = useState('Black');
  const [newSize, setNewSize] = useState('Standard');
  const [newPrice, setNewPrice] = useState('2999');
  const [newStock, setNewStock] = useState('10');
  const [newImage, setNewImage] = useState('');

  // Edit Form State
  const [editName, setEditName] = useState('');
  const [editBrand, setEditBrand] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editStatus, setEditStatus] = useState('active');

  const fetchCatalog = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getProducts();
      setProducts(data);
    } catch (err: any) {
      console.error('Failed to fetch products', err);
      setError(err.message || 'Failed to load products from backend API');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, []);

  // Get unique brands and categories
  const brands = useMemo(() => {
    return Array.from(new Set(products.map((p) => p.brand).filter(Boolean))).sort();
  }, [products]);

  const categories = useMemo(() => {
    return Array.from(new Set(products.map((p) => p.category).filter(Boolean))).sort();
  }, [products]);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let filtered = products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.productId.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesBrand = selectedBrand === 'all' || p.brand === selectedBrand;
      const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;

      return matchesSearch && matchesBrand && matchesCategory;
    });

    // Sort
    if (sortBy === 'price-low') {
      filtered.sort((a, b) => {
        const aPrice = a.variants?.[0]?.price || 0;
        const bPrice = b.variants?.[0]?.price || 0;
        return aPrice - bPrice;
      });
    } else if (sortBy === 'price-high') {
      filtered.sort((a, b) => {
        const aPrice = a.variants?.[0]?.price || 0;
        const bPrice = b.variants?.[0]?.price || 0;
        return bPrice - aPrice;
      });
    } else {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    }

    return filtered;
  }, [products, searchTerm, selectedBrand, selectedCategory, sortBy]);

  const getProductTotalStock = (product: Product) => {
    return (product.variants || []).reduce((sum, variant) => sum + (variant.stock || 0), 0);
  };

  // Handlers for Add, Edit, Delete
  const handleOpenCreate = () => {
    if (!token) {
      toast.error('Authentication required. Please sign in first.');
      return;
    }
    if (!canMutate) {
      toast.error('Access denied. Admin or Manager role required to create products.');
      return;
    }

    const autoId = `P${Math.floor(1000 + Math.random() * 9000)}`;
    setNewProductId(autoId);
    setNewName('');
    setNewBrand('');
    setNewCategory('');
    setNewDescription('');
    setNewStatus('active');
    setNewSku(`${autoId}-BLK-STD`);
    setNewColor('Black');
    setNewSize('Standard');
    setNewPrice('2999');
    setNewStock('10');
    setNewImage(FALLBACK_IMAGE);
    setIsCreateOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductId.trim() || !newName.trim() || !newBrand.trim() || !newCategory.trim()) {
      toast.error('Please fill in all required product fields');
      return;
    }

    setSubmitting(true);
    try {
      const payload: CreateProductInput = {
        productId: newProductId.trim(),
        name: newName.trim(),
        brand: newBrand.trim(),
        category: newCategory.trim(),
        description: newDescription.trim() || undefined,
        status: newStatus,
        variants: [
          {
            sku: newSku.trim() || `${newProductId.trim()}-VAR-1`,
            color: newColor.trim() || 'Default',
            size: newSize.trim() || 'Standard',
            price: parseFloat(newPrice) || 0,
            stock: parseInt(newStock, 10) || 0,
            image: newImage.trim() || FALLBACK_IMAGE,
          },
        ],
      };

      const created = await createProduct(payload, token);
      toast.success(`Product "${created.name}" created successfully!`);
      setIsCreateOpen(false);
      await fetchCatalog();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create product');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEdit = (product: Product) => {
    if (!token) {
      toast.error('Authentication required. Please sign in first.');
      return;
    }
    if (!canMutate) {
      toast.error('Access denied. Admin or Manager role required to edit products.');
      return;
    }

    setActiveProduct(product);
    setEditName(product.name);
    setEditBrand(product.brand);
    setEditCategory(product.category);
    setEditDescription(product.description || '');
    setEditStatus(product.status || 'active');
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProduct) return;

    setSubmitting(true);
    try {
      const payload: UpdateProductInput = {
        name: editName.trim(),
        brand: editBrand.trim(),
        category: editCategory.trim(),
        description: editDescription.trim(),
        status: editStatus,
      };

      const updated = await updateProduct(activeProduct.productId, payload, token);
      toast.success(`Product "${updated.name}" updated successfully!`);
      setIsEditOpen(false);
      await fetchCatalog();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update product');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenDelete = (product: Product) => {
    if (!token) {
      toast.error('Authentication required. Please sign in as Admin to delete.');
      return;
    }
    if (!isAdmin) {
      toast.error('Access denied: Admin role required to delete products.');
      return;
    }

    setActiveProduct(product);
    setIsDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!activeProduct) return;

    setSubmitting(true);
    try {
      await deleteProduct(activeProduct.productId, token);
      toast.success(`Product "${activeProduct.name}" deleted successfully!`);
      setIsDeleteOpen(false);
      await fetchCatalog();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete product');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Products</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your live product catalog connected to backend REST API & PostgreSQL
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchCatalog}
            disabled={loading}
            className="gap-2 border-border"
            title="Refresh from backend"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button
            onClick={handleOpenCreate}
            className="gap-2 bg-accent hover:bg-accent/90"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Role Notice Banner if not logged in or viewer */}
      {!user && (
        <Card className="p-3 bg-secondary/40 border-border flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-muted-foreground">
            <ShieldAlert className="w-4 h-4 text-accent" />
            <span>
              Browsing in <strong>Guest Mode</strong>. Sign in to test role-based product creation, updates, and deletion.
            </span>
          </div>
          <Link href="/login" className="text-accent font-semibold hover:underline">
            Sign In →
          </Link>
        </Card>
      )}

      {/* Search and Filters */}
      <Card className="p-4 border-border bg-card space-y-4">
        {/* Search */}
        <div className="flex items-center gap-2">
          <Search className="w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search by name, brand, category, or product ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 border-0 bg-transparent placeholder-muted-foreground focus:ring-0"
          />
        </div>

        {/* Filters and Sort Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Brand Filter */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-2 block">Brand</label>
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground hover:border-accent focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="all">All Brands ({brands.length})</option>
              {brands.map((brand) => (
                <option key={brand} value={brand}>
                  {brand}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-2 block">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground hover:border-accent focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="all">All Categories ({categories.length})</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-2 block">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground hover:border-accent focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="name">Name (A-Z)</option>
              <option value="price-low">Price (Low to High)</option>
              <option value="price-high">Price (High to Low)</option>
            </select>
          </div>

          {/* View Toggle */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-2 block">View</label>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                className="flex-1 gap-2"
                onClick={() => setViewMode('grid')}
              >
                <Grid3x3 className="w-4 h-4" />
                Grid
              </Button>
              <Button
                size="sm"
                variant={viewMode === 'table' ? 'default' : 'outline'}
                className="flex-1 gap-2"
                onClick={() => setViewMode('table')}
              >
                <List className="w-4 h-4" />
                List
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Loading state */}
      {loading && (
        <div className="py-16 text-center space-y-3">
          <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full mx-auto" />
          <p className="text-sm text-muted-foreground">Loading products from backend API...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <Card className="p-8 border-destructive/30 bg-destructive/10 text-center space-y-3">
          <p className="text-sm text-destructive font-medium">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchCatalog} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Try Again
          </Button>
        </Card>
      )}

      {/* Results Count */}
      {!loading && !error && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing <span className="font-semibold text-foreground">{filteredProducts.length}</span> products
          </p>
        </div>
      )}

      {/* Grid View */}
      {!loading && !error && viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id || product.productId}
              product={product}
              onEdit={handleOpenEdit}
              onDelete={handleOpenDelete}
            />
          ))}
        </div>
      )}

      {/* Table View */}
      {!loading && !error && viewMode === 'table' && (
        <Card className="border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-card/50">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                    Product
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                    Brand
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                    Category
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                    Price
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                    Total Stock
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredProducts.map((product) => (
                  <ProductRow
                    key={product.id || product.productId}
                    product={product}
                    onEdit={handleOpenEdit}
                    onDelete={handleOpenDelete}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Empty State */}
      {!loading && !error && filteredProducts.length === 0 && (
        <Card className="p-12 border-border bg-card text-center space-y-3">
          <p className="text-muted-foreground">No products found matching your filters.</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchTerm('');
              setSelectedBrand('all');
              setSelectedCategory('all');
            }}
          >
            Reset Filters
          </Button>
        </Card>
      )}

      {/* Summary Stats */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4 border-border bg-card">
            <p className="text-sm text-muted-foreground">Total Products</p>
            <p className="text-2xl font-bold text-foreground mt-1">{products.length}</p>
          </Card>
          <Card className="p-4 border-border bg-card">
            <p className="text-sm text-muted-foreground">Low Stock (&lt; 6 units)</p>
            <p className="text-2xl font-bold text-orange-500 mt-1">
              {products.filter((p) => {
                const s = getProductTotalStock(p);
                return s > 0 && s < 6;
              }).length}
            </p>
          </Card>
          <Card className="p-4 border-border bg-card">
            <p className="text-sm text-muted-foreground">Out of Stock</p>
            <p className="text-2xl font-bold text-destructive mt-1">
              {products.filter((p) => getProductTotalStock(p) === 0).length}
            </p>
          </Card>
          <Card className="p-4 border-border bg-card">
            <p className="text-sm text-muted-foreground">Active Catalog</p>
            <p className="text-2xl font-bold text-emerald-500 mt-1">
              {products.filter((p) => p.status === 'active').length}
            </p>
          </Card>
        </div>
      )}

      {/* CREATE PRODUCT MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 overflow-y-auto">
          <Card className="w-full max-w-2xl bg-card border-border shadow-2xl my-8 overflow-hidden">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PackagePlus className="w-5 h-5 text-accent" />
                <h2 className="text-lg font-bold text-foreground">Add New Product</h2>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">
                    Product ID (Unique) *
                  </label>
                  <Input
                    value={newProductId}
                    onChange={(e) => setNewProductId(e.target.value)}
                    placeholder="e.g. P1004"
                    required
                    className="bg-secondary/30"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">
                    Product Name *
                  </label>
                  <Input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Puma Suede Classic"
                    required
                    className="bg-secondary/30"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">
                    Brand *
                  </label>
                  <Input
                    value={newBrand}
                    onChange={(e) => setNewBrand(e.target.value)}
                    placeholder="e.g. Puma, Nike, Adidas"
                    required
                    className="bg-secondary/30"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">
                    Category *
                  </label>
                  <Input
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="e.g. Shoes, Jackets, Jeans"
                    required
                    className="bg-secondary/30"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Description
                </label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Enter product description..."
                  rows={2}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-secondary/30 text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-secondary/30 text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="active">Active</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              {/* Initial Variant Information */}
              <div className="pt-3 border-t border-border space-y-3">
                <h3 className="text-sm font-semibold text-foreground">Initial Variant Specification</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">SKU *</label>
                    <Input
                      value={newSku}
                      onChange={(e) => setNewSku(e.target.value)}
                      placeholder="e.g. P1004-BLK-9"
                      required
                      className="bg-secondary/30 font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Color</label>
                    <Input
                      value={newColor}
                      onChange={(e) => setNewColor(e.target.value)}
                      placeholder="e.g. Black"
                      className="bg-secondary/30"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Size</label>
                    <Input
                      value={newSize}
                      onChange={(e) => setNewSize(e.target.value)}
                      placeholder="e.g. 9 or M"
                      className="bg-secondary/30"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Price (₹) *</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={newPrice}
                      onChange={(e) => setNewPrice(e.target.value)}
                      placeholder="2999"
                      required
                      className="bg-secondary/30"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Stock Units *</label>
                    <Input
                      type="number"
                      value={newStock}
                      onChange={(e) => setNewStock(e.target.value)}
                      placeholder="10"
                      required
                      className="bg-secondary/30"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Image URL</label>
                    <Input
                      value={newImage}
                      onChange={(e) => setNewImage(e.target.value)}
                      placeholder="https://..."
                      className="bg-secondary/30 text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting} className="bg-accent hover:bg-accent/90">
                  {submitting ? 'Creating...' : 'Create Product'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* EDIT PRODUCT MODAL */}
      {isEditOpen && activeProduct && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg bg-card border-border shadow-2xl">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-accent" />
                <h2 className="text-lg font-bold text-foreground">Edit Product ({activeProduct.productId})</h2>
              </div>
              <button
                onClick={() => setIsEditOpen(false)}
                className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Name</label>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  className="bg-secondary/30"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Brand</label>
                  <Input
                    value={editBrand}
                    onChange={(e) => setEditBrand(e.target.value)}
                    required
                    className="bg-secondary/30"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Category</label>
                  <Input
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    required
                    className="bg-secondary/30"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Description</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-secondary/30 text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-secondary/30 text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="active">Active</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting} className="bg-accent hover:bg-accent/90">
                  {submitting ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {isDeleteOpen && activeProduct && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-card border-border shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-destructive">
              <Trash2 className="w-6 h-6" />
              <h2 className="text-lg font-bold text-foreground">Confirm Deletion</h2>
            </div>

            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete <strong className="text-foreground">{activeProduct.name}</strong> (
              <span className="font-mono text-xs text-accent">{activeProduct.productId}</span>)?
              This action will permanently delete this product and all associated variants from PostgreSQL.
            </p>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Button
                variant="outline"
                onClick={() => setIsDeleteOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteConfirm}
                disabled={submitting}
              >
                {submitting ? 'Deleting...' : 'Delete Product'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
