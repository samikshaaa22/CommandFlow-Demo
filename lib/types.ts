export interface ProductVariant {
  id?: string;
  sku: string;
  color: string;
  size: string;
  price: number;
  stock: number;
  image?: string | null;
  productId?: string;
}

export interface Product {
  id: string;
  productId: string;
  name: string;
  brand: string;
  category: string;
  description?: string | null;
  status: string;
  createdAt?: string;
  updatedAt?: string;
  variants: ProductVariant[];
}

export interface CreateProductInput {
  productId: string;
  name: string;
  brand: string;
  category: string;
  description?: string;
  status?: string;
  variants?: Array<{
    sku: string;
    color: string;
    size: string;
    price: number;
    stock: number;
    image?: string | null;
  }>;
}

export interface UpdateProductInput {
  name?: string;
  brand?: string;
  category?: string;
  description?: string;
  status?: string;
}

export interface User {
  id?: string;
  username: string;
  role: 'admin' | 'manager' | 'viewer' | string;
}

export interface AuthResponse {
  token: string;
  role: string;
  username: string;
}