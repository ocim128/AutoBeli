import { getOrderWithProduct } from "@/lib/orders";
import { notFound, redirect } from "next/navigation";
import CheckoutForm from "@/components/CheckoutForm";
import CheckoutSummary from "@/components/CheckoutSummary";
import CheckoutBreadcrumb from "@/components/CheckoutBreadcrumb";
import CheckoutHeader from "@/components/CheckoutHeader";

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
  const isRetrying = retry === "true";
  if (order.status === "PAID" || (order.paymentMetadata?.transaction_ref && !isRetrying)) {
    redirect(`/order/${orderId}`);
  }

  // Calculate total amount
  const quantity = order.quantity || 1;
  const totalAmount = order.product.priceIdr * quantity;

  return (
    <div className="min-h-[80vh] py-8 md:py-16">
      <div className="max-w-5xl mx-auto px-4">
        {/* Breadcrumb */}
        <CheckoutBreadcrumb productSlug={order.product.slug} productTitle={order.product.title} />

        {/* Page Header */}
        <CheckoutHeader />

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column - Order Summary */}
          <CheckoutSummary
            orderId={orderId}
            productTitle={order.product.title}
            productDescription={order.product.description || undefined}
            orderStatus={order.status}
            priceIdr={order.product.priceIdr}
            quantity={quantity}
            totalAmount={totalAmount}
          />

          {/* Right Column - Checkout Form */}
          <div className="lg:col-span-7 lg:order-1">
            <CheckoutForm
              orderId={orderId}
              amount={totalAmount}
              paymentGateway={order.paymentGateway}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
