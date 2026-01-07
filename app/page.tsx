import Link from "next/link";
import { getActiveProducts } from "@/lib/products";

export const revalidate = 60;

export default async function Home() {
  const products = await getActiveProducts();

  return (
    <div className="space-y-20 pb-20">
      {/* Hero Section */}
      <section className="relative text-center space-y-8 py-20 px-4 overflow-hidden rounded-3xl bg-gray-50 border border-gray-100 shadow-2xl shadow-indigo-100/20">
        {/* Animated Background Blobs */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
          <div className="absolute -top-20 -left-20 w-80 h-80 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float" />
          <div
            className="absolute -bottom-20 -right-20 w-80 h-80 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float"
            style={{ animationDelay: "1.5s" }}
          />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20" />
        </div>

        <div className="relative space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            Instant Delivery Active
          </div>

          <h1 className="text-5xl md:text-7xl font-black tracking-tight text-gray-900 leading-tight">
            Digital Content. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
              Instant Access.
            </span>
          </h1>

          <p className="max-w-xl mx-auto text-lg md:text-xl text-gray-600 leading-relaxed font-medium">
            Secure, encrypted, and automated delivery of premium digital assets. Receive your
            content immediately after payment.
          </p>

          <div className="flex items-center justify-center gap-4 pt-4">
            <a
              href="#products"
              className="px-8 py-4 bg-gray-900 text-white rounded-2xl font-bold shadow-lg shadow-gray-900/20 hover:bg-black hover:-translate-y-1 transition-all duration-300"
            >
              Browse Products
            </a>
          </div>
        </div>
      </section>

      {/* Product Grid */}
      <section id="products" className="scroll-mt-24">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4 border-l-4 border-indigo-600 pl-6">
          <div>
            <h2 className="text-3xl font-black tracking-tight text-gray-900 uppercase">
              Available Assets
            </h2>
            <p className="text-gray-500 font-medium mt-1">
              Curated collection of unique digital items.
            </p>
          </div>
          <div className="bg-gray-100 px-4 py-2 rounded-xl border border-gray-200">
            <span className="text-sm font-bold text-gray-600">{products.length} Items Live</span>
          </div>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-24 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
            <div className="text-gray-400 mb-4 inline-block transform scale-150 opacity-50">📦</div>
            <p className="text-gray-500 font-bold text-lg">Inventory is currently empty.</p>
            <p className="text-gray-400">Check back later for new digital assets.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <Link key={product.slug} href={`/product/${product.slug}`} className="group h-full">
                <div className="h-full flex flex-col overflow-hidden rounded-[2.5rem] border border-gray-100 bg-white shadow-sm ring-1 ring-gray-200/50 transition-all duration-500 hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-2">
                  {/* Card Media Area */}
                  <div className="h-56 relative overflow-hidden bg-gray-900 group-hover:scale-105 transition-transform duration-700">
                    {product.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={product.imageUrl}
                        alt={product.title}
                        className="absolute inset-0 w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                      />
                    ) : (
                      <>
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/80 via-purple-600/80 to-pink-500/80 opacity-60 mix-blend-overlay z-10" />
                        <div className="absolute inset-0 flex items-center justify-center p-6 text-white text-center z-20">
                          <div className="space-y-2">
                            <div className="w-16 h-1 bg-white/40 mx-auto rounded-full" />
                            <span className="block text-4xl font-black tracking-tighter opacity-80 drop-shadow-lg">
                              DIGITAL
                            </span>
                            <div className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-lg text-[10px] font-bold tracking-widest uppercase border border-white/20">
                              {product.slug.split("-")[0] || "ASSET"}
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                    {/* Floating Glow */}
                    <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-white/10 blur-[100px] rounded-full group-hover:translate-x-full transition-transform duration-1000" />
                  </div>

                  <div className="flex flex-1 flex-col p-8 bg-white relative z-30">
                    <div className="flex-grow">
                      <h3 className="text-2xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                        {product.title}
                      </h3>
                      <p className="mt-3 text-gray-500 leading-relaxed line-clamp-2 text-sm font-medium">
                        {product.description ||
                          "Premium digital asset with instant delivery guaranteed."}
                      </p>
                    </div>

                    <div className="mt-8 flex items-center justify-between border-t border-gray-100 pt-6">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest leading-none mb-1">
                          Price IRD
                        </span>
                        <span className="text-xl font-black text-gray-900 tracking-tight">
                          Rp {product.priceIdr.toLocaleString("id-ID")}
                        </span>
                      </div>
                      <div className="w-12 h-12 rounded-2xl bg-gray-900 text-white flex items-center justify-center group-hover:bg-indigo-600 group-hover:rotate-[360deg] transition-all duration-700">
                        <svg
                          className="w-6 h-6"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M14 5l7 7m0 0l-7 7m7-7H3"
                          />
                        </svg>
                      </div>
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
