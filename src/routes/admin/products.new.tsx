/**
 * Add a product.
 *
 * The route is thin on purpose: fetch the category list, hand it to
 * ProductForm, post what comes back. Everything that is actually hard —
 * validation, image handling, the shape of the payload — lives in the form,
 * the uploader and /api/admin/product, so the edit route can reuse all of it
 * by changing two props.
 */

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { EMPTY_PRODUCT, ProductForm } from "@/components/admin/ProductForm";
import { fetchProductForm, saveProduct, type ProductFormValues } from "@/lib/auth/admin-api";
import { useAdminAccess } from "@/hooks/useAdminAccess";

export const Route = createFileRoute("/admin/products/new")({
  head: () => ({
    meta: [{ title: "New product | Admin" }, { name: "robots", content: "noindex, nofollow" }],
  }),
  component: NewProduct,
});

function NewProduct() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAdmin } = useAdminAccess();

  const { data, isPending } = useQuery({
    queryKey: ["admin-product-form", null],
    queryFn: () => fetchProductForm(),
    enabled: isAdmin,
    staleTime: 5 * 60_000,
  });

  const mutation = useMutation({
    mutationFn: (values: ProductFormValues) => saveProduct(values),
    onSuccess: () => {
      // The stock screen and the dashboard counts are both stale now.
      void queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      void navigate({
        to: "/admin/products",
        search: { q: undefined, filter: undefined, page: undefined },
      });
    },
  });

  if (isPending || !data) {
    return <p className="text-sm text-kc-muted">Loading…</p>;
  }

  return (
    <ProductForm
      categories={data.categories}
      initial={EMPTY_PRODUCT}
      editing={false}
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
