/**
 * Mock Data for Warranty Management System
 * 
 * This file provides mock data for testing the frontend without requiring
 * a connection to the backend API. It includes sample users, products, and warranties.
 */

import { Warranty, WarrantyDocument } from '@/types/warranty';

// Sample warranty documents
const sampleDocuments: WarrantyDocument[] = [
  {
    name: 'Warranty Certificate.pdf',
    path: '/uploads/warranty-certificate.pdf',
    uploadDate: new Date().toISOString()
  },
  {
    name: 'Purchase Receipt.pdf',
    path: '/uploads/purchase-receipt.pdf',
    uploadDate: new Date().toISOString()
  }
];

// Generate a random date between start and end
const randomDate = (start: Date, end: Date): string => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString();
};

// Calculate warranty status based on expiration date
const calculateStatus = (expirationDate: string): 'active' | 'expiring' | 'expired' => {
  const expDate = new Date(expirationDate);
  const now = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(now.getDate() + 30);
  
  if (expDate < now) {
    return 'expired';
  } else if (expDate < thirtyDaysFromNow) {
    return 'expiring';
  } else {
    return 'active';
  }
};

// Generate random warranties
const generateWarranties = (count: number): Warranty[] => {
  const warranties: Warranty[] = [];
  
  const manufacturers = [
    'Apple', 'Samsung', 'LG', 'Sony', 'Dell', 'HP', 'Lenovo', 
    'Bosch', 'Whirlpool', 'Dyson', 'KitchenAid', 'GE', 'Maytag'
  ];
  
  const productTypes = [
    'Laptop', 'Smartphone', 'TV', 'Refrigerator', 'Washing Machine', 
    'Dishwasher', 'Vacuum Cleaner', 'Microwave', 'Blender', 'Coffee Maker'
  ];
  
  const warrantyProviders = [
    'Manufacturer Warranty', 'Extended Warranty', 'Store Protection Plan',
    'Premium Care', 'AppleCare+', 'GeekSquad Protection', 'Asurion'
  ];
  
  for (let i = 1; i <= count; i++) {
    const purchaseDate = randomDate(new Date(2020, 0, 1), new Date());
    const expirationDate = new Date(purchaseDate);
    expirationDate.setFullYear(expirationDate.getFullYear() + Math.floor(Math.random() * 5) + 1);
    
    const manufacturer = manufacturers[Math.floor(Math.random() * manufacturers.length)];
    const productType = productTypes[Math.floor(Math.random() * productTypes.length)];
    const warrantyProvider = warrantyProviders[Math.floor(Math.random() * warrantyProviders.length)];
    
    warranties.push({
      id: i,
      product: {
        name: `${manufacturer} ${productType}`,
        manufacturer: manufacturer
      },
      purchaseDate: purchaseDate,
      expirationDate: expirationDate.toISOString(),
      warrantyProvider: warrantyProvider,
      warrantyNumber: `WTY-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      coverageDetails: `This warranty covers all parts and labor for the ${manufacturer} ${productType}. It includes repairs and replacements for manufacturing defects.`,
      documents: sampleDocuments,
      status: calculateStatus(expirationDate.toISOString()),
      notes: Math.random() > 0.5 ? `Additional notes for ${manufacturer} ${productType} warranty.` : undefined
    });
  }
  
  return warranties;
};

// Generate 20 sample warranties
export const mockWarranties = generateWarranties(20);

// Mock API response for getAllWarranties
export const mockGetAllWarrantiesResponse = {
  data: {
    warranties: mockWarranties
  },
  error: null
};

// Mock API response for getWarrantyById
export const mockGetWarrantyByIdResponse = (id: string | number) => {
  const warranty = mockWarranties.find(w => w.id === Number(id));
  
  if (!warranty) {
    return {
      data: null,
      error: 'Warranty not found'
    };
  }
  
  return {
    data: warranty,
    error: null
  };
};

// Mock API response for createWarranty
export const mockCreateWarrantyResponse = (warrantyData: any) => {
  const newId = mockWarranties.length + 1;
  
  return {
    data: {
      id: newId,
      ...warrantyData,
      status: calculateStatus(warrantyData.expirationDate)
    },
    error: null
  };
};

// Mock API response for deleteWarranty
export const mockDeleteWarrantyResponse = (id: string | number) => {
  const warranty = mockWarranties.find(w => w.id === Number(id));
  
  if (!warranty) {
    return {
      data: null,
      error: 'Warranty not found'
    };
  }
  
  return {
    data: { success: true, message: 'Warranty deleted successfully' },
    error: null
  };
};
