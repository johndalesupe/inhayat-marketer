import { ProductDetailsScreen } from "@/src/features/market/ProductDetailsScreen";

export default async function ProductDetailsPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  return <ProductDetailsScreen key={productId} productId={productId} />;
}
