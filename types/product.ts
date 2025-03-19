export interface Product {
  id: string;
  name: string;
  category: string;
  manufacturer?: string;
  model?: string;
  serialNumber: string;
  purchaseDate?: string;
  price?: string;
  purchaseLocation?: string;
  receiptNumber?: string;
  description?: string;
  notes?: string;
  images?: string[];
  createdAt: string;
  updatedAt: string;
}
