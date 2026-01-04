
import Link from 'next/link';
import { getActiveProducts } from '@/lib/products';

export const dynamic = 'force-dynamic'; // For demo purposes, ensure fresh data

export default async function Home() {
  const products = await getActiveProducts();

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="text-center space-y-4 py-12">
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600 pb-2">
          Digital Content. <br />
          <span className="text-indigo-600">Instant Delivery.</span>
        </h1>
        <p className="max-w-2xl mx-auto text-lg text-gray-600">
          Secure, encrypted, and automated text delivery service.
          Buy now and receive your content immediately via secure access token.
        </p>
      </section>

      {/* Product Grid */}
      <section>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">Latest Products</h2>
          <span className="text-sm text-gray-500">{products.length} items available</span>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
            <p className="text-gray-500">No products available at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:gap-x-8">
            {products.map((product) => (
              <Link key={product.slug} href={`/product/${product.slug}`} className="group relative block h-full">
                <div className="h-full flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white transition-all duration-300 hover:shadow-xl hover:-translate-y-1">

                  {/* Card Header (Gradient Placeholder since no images) */}
                  <div className="h-48 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-6 text-white text-center">
                    <span className="text-4xl font-mono font-bold opacity-30">TXT</span>
                  </div>

                  <div className="flex flex-1 flex-col p-6">
                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                      {product.title}
                    </h3>
                    <p className="mt-2 text-sm text-gray-500 line-clamp-3 flex-grow">
                      {product.description || "No description provided."}
                    </p>

                    <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-4">
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-400 font-medium">PRICE</span>
                        <span className="text-lg font-bold text-gray-900">
                          Rp {product.priceIdr.toLocaleString('id-ID')}
                        </span>
                      </div>
                      <span className="rounded-full bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition-colors group-hover:bg-indigo-600">
                        View Details
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
