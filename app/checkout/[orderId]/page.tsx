import { getOrderWithProduct } from "@/lib/orders";
import { notFound, redirect } from "next/navigation";
import CheckoutForm from "@/components/CheckoutForm";
import Link from "next/link";

interface Props {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function CheckoutPage({ params, searchParams }: Props) {
  const { orderId } = await params;
  const { retry } = await searchParams;
  const order = await getOrderWithProduct(orderId);

  if (!order) {
    notFound();
  }

  // If already paid OR has pending payment (and not retrying), redirect to order status page
  // The order page now handles the "Processing" state UI
  const isRetrying = retry === "true";
  if (order.status === "PAID" || (order.paymentMetadata?.transaction_ref && !isRetrying)) {
    redirect(`/order/${orderId}`);
  }

  return (
    <div className="min-h-[80vh] py-8 md:py-16">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float" />
        <div
          className="absolute -bottom-40 -left-40 w-96 h-96 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float"
          style={{ animationDelay: "2s" }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-float"
          style={{ animationDelay: "4s" }}
        />
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center text-xs font-bold uppercase tracking-widest text-gray-400 mb-8 space-x-3 bg-white/50 backdrop-blur-sm w-fit px-4 py-2 rounded-full border border-gray-100">
          <Link href="/" className="hover:text-indigo-600 transition-colors">
            Store
          </Link>
          <span className="opacity-30">/</span>
          <Link
            href={`/product/${order.product.slug}`}
            className="hover:text-indigo-600 transition-colors truncate max-w-[100px]"
          >
            {order.product.title}
          </Link>
          <span className="opacity-30">/</span>
          <span className="text-indigo-600">Checkout</span>
        </nav>

        {/* Main checkout grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Side - Order Summary */}
          <div className="lg:col-span-5 lg:order-2">
            <div className="sticky top-28 space-y-6">
              {/* Order Summary Card */}
              <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-gray-900/30 overflow-hidden relative">
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl" />

                <div className="relative">
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-8 pb-6 border-b border-white/10">
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-indigo-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-sm font-black uppercase tracking-widest text-white/60">
                        Order Summary
                      </h2>
                      <p className="font-mono text-[10px] text-white/30 mt-0.5">
                        #{order._id?.toString().slice(-8).toUpperCase()}
                      </p>
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="mb-8">
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/30 to-purple-500/30 flex items-center justify-center shrink-0 border border-white/10">
                        <span className="text-2xl">📦</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-white leading-tight line-clamp-2">
                          {order.product.title}
                        </h3>
                        <p className="text-white/50 mt-1 text-sm line-clamp-2">
                          {order.product.description}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Price Breakdown */}
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between text-white/60">
                      <span>Subtotal</span>
                      <span>Rp {order.product.priceIdr.toLocaleString("id-ID")}</span>
                    </div>
                    <div className="flex justify-between text-white/60">
                      <span>Service Fee</span>
                      <span className="text-green-400">Free</span>
                    </div>
                    <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-4" />
                    <div className="flex justify-between items-end">
                      <span className="text-white/80 font-bold">Total</span>
                      <div className="text-right">
                        <span className="text-3xl font-black text-white tracking-tight">
                          Rp {order.product.priceIdr.toLocaleString("id-ID")}
                        </span>
                        <span className="block text-[10px] text-white/40 font-bold uppercase tracking-widest mt-1">
                          IDR
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Trust Badges */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-gray-100 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
                    <svg
                      className="w-5 h-5 text-green-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-black text-gray-900">Secure</p>
                    <p className="text-[10px] text-gray-500">SSL Encrypted</p>
                  </div>
                </div>
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-gray-100 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                    <svg
                      className="w-5 h-5 text-indigo-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-black text-gray-900">Instant</p>
                    <p className="text-[10px] text-gray-500">Auto Delivery</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Checkout Form */}
          <div className="lg:col-span-7 lg:order-1">
            <div className="mb-6">
              <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight mb-2">
                Complete Your Order
              </h1>
              <p className="text-gray-500 font-medium">
                Enter your email to receive your digital content after payment.
              </p>
            </div>

            <CheckoutForm
              orderId={orderId}
              amount={order.product.priceIdr}
              paymentGateway={order.paymentGateway}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
