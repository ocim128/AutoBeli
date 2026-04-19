import { getOrderWithProduct, syncOrderPaymentStatus } from "@/lib/orders";
import { getOrderAccessToken } from "@/lib/delivery";
import { notFound, redirect } from "next/navigation";
import OrderPending from "@/components/OrderPending";
import OrderPaid from "@/components/OrderPaid";

interface Props {
  params: Promise<{ orderId: string }>;
}

export default async function OrderPage({ params }: Props) {
  const { orderId } = await params;

  // 0. Sync Status with Gateway (in case webhook was missed)
  await syncOrderPaymentStatus(orderId);

  // 1. Fetch Order Status
  const order = await getOrderWithProduct(orderId);
  if (!order) notFound();

  // 2. Handle Pending State
  if (order.status !== "PAID") {
    const hasPendingPayment = order.paymentMetadata?.transaction_ref;

    if (!hasPendingPayment) {
      redirect(`/checkout/${orderId}`);
    }

    // Pending / Payment Processing state
    return (
      <OrderPending
        orderId={orderId}
        productTitle={order.product.title}
        amountPaid={order.amountPaid}
        createdAt={order.createdAt}
      />
    );
  }

  // 3. Retrieve Access Token (Server-Side)
  const token = await getOrderAccessToken(orderId);

  return (
    <OrderPaid
      orderId={orderId}
      productTitle={order.product.title}
      amountPaid={order.amountPaid}
      createdAt={order.createdAt}
      paymentGateway={order.paymentGateway}
      token={token}
    />
  );
}
