import { Product, CreateProductInput, UpdateProductInput, AuthResponse } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const errorMessage =
      (isJson && data?.message) ||
      (typeof data === 'string' && data) ||
      `Request failed with status ${response.status}`;
    throw new ApiError(errorMessage, response.status);
  }

  return data as T;
}

// Authentication APIs
export async function loginApi(username: string, password: string): Promise<AuthResponse> {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  });

  return handleResponse<AuthResponse>(response);
}

export async function registerApi(
  username: string,
  password: string,
  role: string = 'viewer'
): Promise<{ message: string; user: any }> {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password, role }),
  });

  return handleResponse<{ message: string; user: any }>(response);
}

// Product APIs
export async function getProducts(): Promise<Product[]> {
  const response = await fetch(`${API_URL}/products`, {
    cache: 'no-store',
  });

  return handleResponse<Product[]>(response);
}

export async function getProductById(productId: string): Promise<Product> {
  const response = await fetch(`${API_URL}/products/${encodeURIComponent(productId)}`, {
    cache: 'no-store',
  });

  return handleResponse<Product>(response);
}

export async function createProduct(
  productData: CreateProductInput,
  token?: string | null
): Promise<Product> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}/products`, {
    method: 'POST',
    headers,
    body: JSON.stringify(productData),
  });

  return handleResponse<Product>(response);
}

export async function updateProduct(
  productId: string,
  productData: UpdateProductInput,
  token?: string | null
): Promise<Product> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}/products/${encodeURIComponent(productId)}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(productData),
  });

  return handleResponse<Product>(response);
}

export async function deleteProduct(
  productId: string,
  token?: string | null
): Promise<{ message: string }> {
  const headers: Record<string, string> = {};

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}/products/${encodeURIComponent(productId)}`, {
    method: 'DELETE',
    headers,
  });

  return handleResponse<{ message: string }>(response);
}
