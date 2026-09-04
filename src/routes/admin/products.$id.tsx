/**
 * Edit a product.
 *
 * Same form as /admin/products/new, seeded from the stored product. The only
 * real work here is the conversion in `toFormValues`: the stored product uses
 * numbers and optional fields, the form uses strings and empty strings, and
 * that boundary is the reason a cleared price cannot become zero. See the note
 * at the top of ProductForm.
 */

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { AppLink } from "@/components/layout/AppLink";
import { ProductForm } from "@/components/admin/ProductForm";
import {
  fetchProductForm,
  saveProduct,
  type ProductFormData,
  type ProductFormValues,
} from "@/lib/auth/admin-api";
import { useAdminAccess } from "@/hooks/useAdminAccess";

export const Route = createFileRoute("/admin/products/$id")({
  head: () => ({
    meta: [{ title: "Edit product | Admin" }, { name: "robots", content: "noindex, nofollow" }],
  }),
  component: EditProduct,
});

function toFormValues(product: NonNullable<ProductFormData["product"]>): ProductFormValues {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    description: product.description,
    shortDescription: product.shortDescription,
    price: String(product.price),
    // "" rather than "0": an empty sale price field means "not on sale", and
    // 0 would mean "free".
    salePrice: product.salePrice === undefined ? "" : String(product.salePrice),
    categorySlug: product.categorySlug,
    subcategorySlug: product.subcategorySlug ?? "",
    fabric: product.fabric ?? "",
    pieces: product.pieces === undefined ? "" : String(product.pieces),
    care: product.care ?? "",
    tags: product.tags.join(", "),
    isFeatured: product.isFeatured,
    isNewArrival: product.isNewArrival,
    isMadeToOrder: product.isMadeToOrder === true,
    // Only active products are readable through the repository today, so
    // anything we managed to load is published.
    isActive: true,
    images: product.images.map((image) => ({ url: image.url, alt: image.alt })),
    variants: product.variants.map((variant) => ({
      id: variant.id,
      sku: variant.sku,
      size: variant.size,
      colorName: variant.colorName,
      colorHex: variant.colorHex,
      stock: String(variant.stock),
    })),
  };
}

function EditProduct() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAdmin } = useAdminAccess();

  const { data, isPending, error } = useQuery({
    queryKey: ["admin-product-form", id],
    queryFn: () => fetchProductForm(id),
    enabled: isAdmin,
    retry: false,
  });

  const mutation = useMutation({
    mutationFn: (values: ProductFormValues) => saveProduct({ ...values, id }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-product-form", id] });
      void navigate({
        to: "/admin/products",
        search: { q: undefined, filter: undefined, page: undefined },
      });
    },
  });

  if (error) {
    return (
      <div>
        <p role="alert" className="text-sm text-kc-sale">
          {error instanceof Error ? error.message : "That product could not be loaded."}
        </p>
        <AppLink href="/admin/products" className="mt-4 inline-block text-sm underline">
          Back to stock
        </AppLink>
      </div>
    );
  }

  if (isPending || !data?.product) {
    return <p className="text-sm text-kc-muted">Loading…</p>;
  }

  return (
    <ProductForm
      categories={data.categories}
      initial={toFormValues(data.product)}
      editing
      saving={mutation.isPending}
      error={mutation.error instanceof Error ? mutation.error.message : null}
      onSubmit={(values) => mutation.mutate(values)}
      onCancel={() =>
        void navigate({
          to: "/admin/products",
          search: { q: undefined, filter: undefined, page: undefined },
        })
      }
    />
  );
}
