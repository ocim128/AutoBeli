import { getProductBySlug } from "@/lib/products";
import { notFound } from "next/navigation";
import Link from "next/link";
import BuyButton from "@/components/BuyButton";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
}

/**
 * Generate dynamic metadata for SEO
 * This runs at build/request time and improves search engine indexing
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return {
      title: "Product Not Found - AutoBeli",
    };
  }

  const description =
    product.description ||
    `Purchase ${product.title} - Premium digital content with instant delivery.`;

  return {
    title: `${product.title} - AutoBeli`,
    description: description.slice(0, 160),
    openGraph: {
      title: product.title,
      description: description.slice(0, 160),
      type: "website",
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  return (
    <div className="max-w-6xl mx-auto pb-20">
      {/* Breadcrumb */}
      <nav className="flex items-center text-xs font-bold uppercase tracking-widest text-gray-400 mb-12 space-x-3 bg-gray-50/50 w-fit px-4 py-2 rounded-full border border-gray-100">
        <Link href="/" className="hover:text-indigo-600 transition-colors">
          Store
        </Link>
        <span className="opacity-30">/</span>
        <span className="text-gray-900 truncate max-w-[150px]">{product.title}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
        {/* Left side - Visual & Info (7 columns) */}
        <div className="lg:col-span-7 space-y-12">
          <div className="aspect-[16/10] relative overflow-hidden rounded-[3rem] bg-gray-900 shadow-3xl shadow-indigo-500/10 flex items-center justify-center group">
            {product.imageUrl ? (
              <>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={product.imageUrl}
                  alt={product.title}
                  className="absolute inset-0 w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                />
                <div className="relative z-20 w-full h-full flex flex-col justify-end p-8 md:p-12">
                  <div className="inline-block w-fit px-4 py-1.5 rounded-full bg-black/30 backdrop-blur-md border border-white/10 text-white/90 font-bold tracking-wider uppercase text-xs mb-4">
                    Digital Asset #{product.slug.slice(-4)}
                  </div>
                  <h2 className="text-3xl md:text-5xl font-black text-white drop-shadow-lg capitalize leading-tight">
                    {product.title}
                  </h2>
                </div>
              </>
            ) : (
              <>
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 via-transparent to-pink-600/20 z-10" />
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />

                <div className="relative text-center p-12 z-20 transform group-hover:scale-110 transition-transform duration-1000">
                  <div className="text-[12rem] font-black tracking-tighter text-white opacity-5 mb-0 select-none">
                    DATA
                  </div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full">
                    <div className="inline-block px-6 py-2 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 text-white font-black tracking-widest uppercase text-sm mb-6">
                      Digital Asset #{product.slug.slice(-4)}
                    </div>
                    <h2 className="text-4xl font-black text-white drop-shadow-2xl px-6 capitalize">
                      {product.title}
                    </h2>
                  </div>
                </div>

                {/* Animated Glow in Corner */}
                <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-indigo-500/30 rounded-full blur-[100px] animate-pulse" />
              </>
            )}
          </div>

          <div className="space-y-8 bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm transition-all hover:shadow-md">
            <div>
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">
                Product Overview
              </h3>
              <div className="prose prose-lg text-gray-600 font-medium leading-relaxed max-w-none">
                <p className="whitespace-pre-line">
                  {product.description ||
                    "This premium digital asset contains exclusive encrypted content. Once purchased, you will receive an automated access token to view the secure data instantly."}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  title: "Instant Access",
                  desc: "Available immediately after checkout",
                  icon: "⚡",
                },
                { title: "Secure Encryption", desc: "End-to-end encrypted storage", icon: "🔒" },
                { title: "Permanent Link", desc: "Access your content anytime", icon: "🔗" },
                { title: "Support Included", desc: "Help with your digital purchase", icon: "🤝" },
              ].map((feature, i) => (
                <div
                  key={i}
                  className="flex gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100/50"
                >
                  <span className="text-2xl">{feature.icon}</span>
                  <div>
                    <div className="text-sm font-bold text-gray-900 leading-none mb-1">
                      {feature.title}
                    </div>
                    <div className="text-xs text-gray-500 font-medium">{feature.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right side - Purchase Box (5 columns) */}
        <div className="lg:col-span-5 sticky top-28 space-y-6">
          <div className="bg-gray-900 rounded-[3rem] p-10 text-white shadow-2xl shadow-indigo-600/20 transform hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-between mb-8">
              <span className="px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-[10px] font-black uppercase tracking-widest">
                Instant Delivery
              </span>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] font-bold text-gray-400">Stock Available</span>
              </div>
            </div>

            <h1 className="text-3xl font-black mb-2 leading-tight">{product.title}</h1>
            <p className="text-gray-400 text-sm font-medium mb-10 line-clamp-2">
              Secure your copy of this unique digital asset. Automated fulfillment via Veripay.
            </p>

            <div className="flex items-end gap-3 mb-10 border-b border-white/10 pb-10">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest opacity-80">
                  Full Access Price
                </span>
                <span className="text-5xl font-black text-white tracking-tighter">
                  Rp{product.priceIdr.toLocaleString("id-ID")}
                </span>
              </div>
              <span className="text-indigo-400 font-bold mb-1">IDR</span>
            </div>

            <BuyButton slug={product.slug} />

            <div className="mt-8 pt-8 border-t border-white/5 flex flex-wrap justify-center gap-4 opacity-40">
              {/* Simple payment icons placeholders */}
              <span className="text-[10px] font-black uppercase tracking-widest border border-white/20 px-2 py-1 rounded">
                QRIS
              </span>
              <span className="text-[10px] font-black uppercase tracking-widest border border-white/20 px-2 py-1 rounded">
                VA
              </span>
              <span className="text-[10px] font-black uppercase tracking-widest border border-white/20 px-2 py-1 rounded">
                Wallet
              </span>
            </div>
          </div>

          <div className="bg-indigo-50 rounded-3xl p-6 border border-indigo-100 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shrink-0">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <div>
              <div className="text-sm font-black text-indigo-900 leading-tight">Secure Payment</div>
              <p className="text-xs text-indigo-700/70 font-bold">
                Processed securely by Veripay gateway
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
