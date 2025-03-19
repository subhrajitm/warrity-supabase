// Warranty types
export interface WarrantyDocument {
  name: string;
  path: string;
  uploadDate: string;
}

export interface Product {
  _id: string;
  name: string;
  manufacturer: string;
}

export interface Warranty {
  id: string;
  _id?: string; // Add MongoDB _id field
  user: string;
  product: Product;
  purchaseDate: string;
  expirationDate: string;
  warrantyProvider: string;
  warrantyNumber: string;
  coverageDetails: string;
  documents: WarrantyDocument[];
  status: 'active' | 'expiring' | 'expired';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WarrantyInput {
  product: string; // Product ID
  purchaseDate: string;
  expirationDate: string;
  warrantyProvider: string;
  warrantyNumber: string;
  coverageDetails: string;
  notes?: string;
  status: 'active';
  documents: WarrantyDocument[];
}

// Add ValidationError interface
export interface ValidationError {
  type: string;
  value: any;
  msg: string;
  path: string;
  location: string;
}

// Add WarrantyApiResponse interface
export interface WarrantyApiResponse {
  data?: Warranty;
  error?: string;
  validationErrors?: ValidationError[];
}
