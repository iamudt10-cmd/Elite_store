-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "deliveryPartnerOrderId" TEXT,
ADD COLUMN     "deliveryStatus" TEXT,
ADD COLUMN     "isPaid" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "shippingCarrier" TEXT,
ADD COLUMN     "shippingLabelUrl" TEXT,
ADD COLUMN     "trackingNumber" TEXT;
