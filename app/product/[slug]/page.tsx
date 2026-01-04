
import { getProductBySlug } from '@/lib/products';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import BuyButton from '@/components/BuyButton';

interface Props {
    params: Promise<{ slug: string }>;
}

export default async function ProductPage({ params }: Props) {
    const { slug } = await params;
    const product = await getProductBySlug(slug);

    if (!product) {
        notFound();
    }

    return (
        <div className="max-w-7xl mx-auto">
            {/* Breadcrumb */}
            <nav className="flex items-center text-sm text-gray-500 mb-8 space-x-2">
                <Link href="/" className="hover:text-black">Home</Link>
                <span>/</span>
                <span className="text-gray-900 font-medium truncate">{product.title}</span>
            </nav>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-start">
                {/* Left: Visual Placeholder */}
                <div className="aspect-square relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 shadow-2xl flex items-center justify-center">
                    <div className="text-center p-12 text-white/90">
                        <div className="text-9xl font-mono font-bold opacity-20 mb-4">TXT</div>
                        <p className="text-lg font-medium tracking-widest uppercase opacity-60">Digital Product</p>
                        <p className="text-sm mt-2 opacity-50">Instant Access via Email/Token</p>
                    </div>
                </div>

                {/* Right: Details & CTA */}
                <div className="flex flex-col space-y-8 py-4">
                    <div>
                        <h1 className="text-4xl lg:text-5xl font-extrabold text-gray-900 tracking-tight leading-tight">
                            {product.title}
                        </h1>
                        <div className="mt-4 flex items-center space-x-4">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                Instant Delivery
                            </span>
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                                Secure Text
                            </span>
                        </div>
                    </div>

                    <div className="flex items-baseline space-x-2 border-b border-gray-100 pb-8">
                        <span className="text-4xl font-bold text-gray-900">
                            Rp {product.priceIdr.toLocaleString('id-ID')}
                        </span>
                        <span className="text-gray-400 text-lg">IDR</span>
                    </div>

                    <div className="prose prose-lg text-gray-600 leading-relaxed">
                        <h3 className="text-gray-900 font-semibold mb-2">Description</h3>
                        <p className="whitespace-pre-line">{product.description || "No description provided."}</p>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">What you get</h3>
                        <ul className="space-y-3">
                            <li className="flex items-center text-gray-600">
                                <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                Encrypted text content
                            </li>
                            <li className="flex items-center text-gray-600">
                                <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                Lifetime access token
                            </li>
                            <li className="flex items-center text-gray-600">
                                <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                Secure viewer
                            </li>
                        </ul>
                    </div>

                    {/* CTA Box */}
                    <BuyButton slug={product.slug} priceIdr={product.priceIdr} />
                </div>
            </div>
        </div>
    );
}
