"use client";

import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getWarranties, Warranty } from '@/lib/services/warranty-service';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Loader2 } from 'lucide-react';

export default function ExamplePage() {
  const [warranties, setWarranties] = useState<Warranty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    const fetchWarranties = async () => {
      try {
        setLoading(true);
        const response = await getWarranties(1, 10);
        setWarranties(response.warranties);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch warranties:', err);
        setError('Failed to fetch warranties. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchWarranties();
  }, [isAuthenticated, authLoading, router]);

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="mb-6 text-3xl font-bold">My Warranties (AWS Amplify Example)</h1>
      
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading warranties...</span>
        </div>
      ) : error ? (
        <Card className="bg-red-50">
          <CardContent className="p-4">
            <p className="text-red-600">{error}</p>
            <Button onClick={() => window.location.reload()} className="mt-2">
              Try Again
            </Button>
          </CardContent>
        </Card>
      ) : warranties.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="mb-4 text-gray-600">You don't have any warranties yet.</p>
            <Button onClick={() => router.push('/user/warranties/add')}>
              Add Your First Warranty
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {warranties.map((warranty) => (
            <Card key={warranty._id} className="transition-shadow hover:shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{warranty.productId}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Purchase Date:</span>
                    <span>{new Date(warranty.purchaseDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Expiry Date:</span>
                    <span>{new Date(warranty.expiryDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Status:</span>
                    <span className={`font-medium ${
                      warranty.status === 'active' ? 'text-green-600' : 
                      warranty.status === 'expired' ? 'text-red-600' : 'text-yellow-600'
                    }`}>
                      {warranty.status.charAt(0).toUpperCase() + warranty.status.slice(1)}
                    </span>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  className="mt-4 w-full"
                  onClick={() => router.push(`/user/warranties/${warranty._id}`)}
                >
                  View Details
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 