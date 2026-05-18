import { Metadata } from 'next';
import ProductImageTester from '@/components/ProductImageTester';

export const metadata: Metadata = {
  title: 'Testeur API Images Produits',
  description: 'Testez l\'API de fidélité d\'images produits avec génération de scènes lifestyle',
};

export default function ProductImageTesterPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <ProductImageTester />
    </div>
  );
}