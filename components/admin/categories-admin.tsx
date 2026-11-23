"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createElement, useState, type FormEvent } from "react";
import { ArrowLeft, ExternalLink, Eye, EyeOff, Pencil, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  DataTable, Field, FilterSelect, ImageUploadField, PageHeader, Pagination, Panel, Pill, RowActions, SearchInput, TableCard, Toolbar,
  errorMessage, fieldErrors, useConfirm, useTableState, type Paged,
} from "@/components/admin/ui";
import { RichTextEditor } from "@/components/editor/rich-text-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form-fields";
import { Switch } from "@/components/ui/switch";
import { useSession } from "@/hooks/use-session";
import { api } from "@/lib/api";
import { CATEGORY_ICONS, categoryIcon } from "@/lib/gapcastle";
import { categoryPath } from "@/lib/site";
import { cn } from "@/lib/utils";

export type AdminCategory = {
  id: number; name: string; slug: string; description: string | null; description_text: string | null; icon: string;
  image_url: string | null; image_path: string | null; external_image_url: string | null;
  is_active: boolean; sort_order: number; listings_count: number; updated_at: string | null;
};

function useCategoryRefresh() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
    void queryClient.invalidateQueries({ queryKey: ["admin-category"] });
    void queryClient.invalidateQueries({ queryKey: ["categories"] });
  };
}

/** Admin › Categories: a searchable, paginated table. Editing happens on its own page. */
export function AdminCategoriesPage() {
  const router = useRouter();
  const { user } = useSession();
  const isAdmin = !!user?.is_admin;
  const refresh = useCategoryRefresh();
  const { confirm, element: confirmDialog } = useConfirm();
  const table = useTableState({ visibility: "" });

  const { data, isLoading } = useQuery({
    queryKey: ["admin-categories", table.query],
    queryFn: () => api.get<Paged<AdminCategory>>("admin/categories", table.query),
    placeholderData: (previous) => previous,
  });

  async function toggle(category: AdminCategory) {
    try {
      await api.put(`admin/categories/${category.id}`, { ...categoryPayload(toForm(category)), is_active: !category.is_active });
      toast.success(category.is_active ? `${category.name} hidden` : `${category.name} is visible`);
      refresh();
    } catch (err) {
      toast.error(errorMessage(err, "Could not update category"));
    }
  }

  return (
    <div>
      <PageHeader
        title="Categories"
        description="How items are organised across the marketplace. Hidden categories disappear from the site and can't be chosen for new listings."
        actions={isAdmin && <Button asChild><Link href="/admin/categories/new"><Plus className="size-4" /> New category</Link></Button>}
      />
      <TableCard>
        <Toolbar>
          <SearchInput value={table.q} onChange={table.setQ} placeholder="Search name or slug" />
          <FilterSelect label="Visibility" value={table.filters.visibility} onChange={(value) => table.setFilter("visibility", value)}>
            <option value="">Visible and hidden</option>
            <option value="visible">Visible only</option>
            <option value="hidden">Hidden only</option>
          </FilterSelect>
        </Toolbar>
        <DataTable
          loading={isLoading}
          empty={!data?.data.length}
          minWidth={760}
          head={<tr><th>Category</th><th>Slug</th><th className="text-right">Listings</th><th className="text-right">Order</th><th>Visibility</th><th className="w-10" /></tr>}
        >
          {data?.data.map((category) => {
            const Icon = categoryIcon(category.icon);
            return (
              <tr key={category.id}>
                <td>
                  <Link href={`/admin/categories/${category.id}`} className="group flex items-center gap-3">
                    <span className="relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary-50 text-primary ring-1 ring-border">
                      {category.image_url ? <Image src={category.image_url} alt="" fill sizes="44px" className="object-cover" /> : <Icon className="size-5" />}
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold group-hover:text-primary">{category.name}</p>
                      <p className="line-clamp-1 max-w-80 text-xs text-muted-foreground">{category.description_text || "No description yet"}</p>
                    </div>
                  </Link>
                </td>
                <td className="font-mono text-xs text-muted-foreground">{category.slug}</td>
                <td className="text-right tabular-nums">{category.listings_count}</td>
                <td className="text-right tabular-nums">{category.sort_order}</td>
                <td>{category.is_active ? <Pill tone="green">Visible</Pill> : <Pill>Hidden</Pill>}</td>
                <td>
                  <RowActions items={[
                    { label: isAdmin ? "Edit" : "View", icon: <Pencil className="size-4" />, onSelect: () => router.push(`/admin/categories/${category.id}`) },
                    { label: "View on site", icon: <ExternalLink className="size-4" />, onSelect: () => window.open(categoryPath(category.slug), "_blank"), hidden: !category.is_active },
                    { label: category.is_active ? "Hide" : "Show", icon: category.is_active ? <EyeOff className="size-4" /> : <Eye className="size-4" />, onSelect: () => void toggle(category), hidden: !isAdmin },
                    "separator",
                    {
                      label: "Delete", icon: <Trash2 className="size-4" />, danger: true, hidden: !isAdmin,
                      onSelect: () => confirm({
                        title: `Delete ${category.name}?`,
                        description: category.listings_count ? "This category still has listings, so it can't be deleted. Hide it instead, or move its listings first." : "This can't be undone.",
                        action: async () => {
                          try {
                            await api.delete(`admin/categories/${category.id}`);
                            toast.success("Category deleted");
                            refresh();
                          } catch (err) {
                            toast.error(errorMessage(err, "Could not delete category"));
                          }
                        },
                      }),
                    },
                  ]} />
                </td>
              </tr>
            );
          })}
        </DataTable>
        {data && <Pagination meta={data.meta} onPage={table.setPage} onPerPage={table.setPerPage} />}
      </TableCard>
      {confirmDialog}
    </div>
  );
}

type CategoryForm = {
  name: string; slug: string; description: string; icon: string; image_path: string | null; image_preview: string | null;
  external_image_url: string; sort_order: string; is_active: boolean;
};

function toForm(category?: AdminCategory | null): CategoryForm {
  return {
    name: category?.name ?? "",
    slug: category?.slug ?? "",
    description: category?.description ?? "",
    icon: category?.icon ?? "package",
    image_path: category?.image_path ?? null,
    image_preview: category?.image_url ?? null,
    external_image_url: category?.external_image_url ?? "",
    sort_order: String(category?.sort_order ?? 0),
    is_active: category?.is_active ?? true,
  };
}

function categoryPayload(form: CategoryForm) {
  return {
    name: form.name.trim(),
    slug: form.slug.trim() || null,
    description: form.description || null,
    icon: form.icon,
    image_path: form.image_path,
    image_url: form.image_path ? null : form.external_image_url.trim() || null,
    sort_order: Number(form.sort_order) || 0,
    is_active: form.is_active,
  };
}

/** Create or edit one category on its own page (rich-text description, image, icon, order, visibility). */
export function AdminCategoryEditorPage({ categoryId }: { categoryId?: string }) {
  const isNew = !categoryId;
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-category", categoryId],
    queryFn: () => api.get<{ data: AdminCategory }>(`admin/categories/${categoryId}`).then((response) => response.data),
    enabled: !isNew,
  });

  const back = <Button asChild variant="ghost" size="sm" className="-ml-2"><Link href="/admin/categories"><ArrowLeft className="size-4" /> All categories</Link></Button>;

  if (!isNew && isLoading) return <div className="max-w-5xl space-y-4"><div className="h-10 w-72 animate-pulse rounded bg-muted" /><div className="h-[480px] animate-pulse rounded-2xl bg-muted" /></div>;
  if (!isNew && (error || !data)) {
    return (
      <div className="max-w-5xl">
        <PageHeader title="Category not found" back={back} />
        <Panel><p className="text-sm text-muted-foreground">{errorMessage(error, "This category doesn't exist any more.")}</p></Panel>
      </div>
    );
  }

  return <CategoryEditor key={data?.id ?? "new"} category={data ?? null} back={back} />;
}

function CategoryEditor({ category, back }: { category: AdminCategory | null; back: React.ReactNode }) {
  const router = useRouter();
  const { user } = useSession();
  const isAdmin = !!user?.is_admin;
  const refresh = useCategoryRefresh();
  const { confirm, element: confirmDialog } = useConfirm();
  const [form, setForm] = useState<CategoryForm>(() => toForm(category));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof CategoryForm>(key: K, value: CategoryForm[K]) => setForm((current) => ({ ...current, [key]: value }));

  async function save(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setErrors({});
    try {
      const response = category
        ? await api.put<{ data: AdminCategory }>(`admin/categories/${category.id}`, categoryPayload(form))
        : await api.post<{ data: AdminCategory }>("admin/categories", categoryPayload(form));
      toast.success(category ? "Category saved" : "Category created");
      refresh();
      if (!category) router.replace(`/admin/categories/${response.data.id}`);
      else setForm(toForm(response.data));
    } catch (err) {
      setErrors(fieldErrors(err));
      toast.error(errorMessage(err, "Could not save category"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="max-w-5xl">
      <PageHeader
        back={back}
        title={category ? `Edit ${category.name}` : "New category"}
        description="Categories appear in the header, home page, explore filters and on their own SEO landing page."
        actions={
          <>
            {category?.is_active && <Button asChild type="button" variant="outline"><Link href={categoryPath(category.slug)} target="_blank"><Eye className="size-4" /> View on site</Link></Button>}
            {isAdmin && <Button type="submit" disabled={busy}><Save className="size-4" /> {busy ? "Saving…" : category ? "Save changes" : "Create category"}</Button>}
          </>
        }
      />
      {!isAdmin && <p className="mb-4 rounded-xl bg-muted px-4 py-3 text-sm text-muted-foreground">You can view categories. Only administrators can change them.</p>}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <Panel title="Details">
            <fieldset disabled={!isAdmin} className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Name" error={errors.name} htmlFor="cat-name">
                  <Input id="cat-name" value={form.name} onChange={(e) => set("name", e.target.value)} required maxLength={60} aria-invalid={!!errors.name} />
                </Field>
                <Field label="URL slug" hint={category ? "Changing it changes the category's web address." : "Leave blank to create it from the name."} error={errors.slug} htmlFor="cat-slug">
                  <Input id="cat-slug" value={form.slug} onChange={(e) => set("slug", e.target.value.toLowerCase())} maxLength={80} placeholder="e.g. home-living" aria-invalid={!!errors.slug} />
                </Field>
              </div>
              <Field label="Description" hint="Shown at the top of the category page and used for its search-engine description." error={errors.description}>
                <RichTextEditor value={form.description} onChange={(html) => set("description", html)} placeholder="Describe what belongs in this category…" maxLength={5000} invalid={!!errors.description} disabled={!isAdmin} />
              </Field>
            </fieldset>
          </Panel>

          <Panel title="Icon" description="Used in the category strip and on cards when there's no image.">
            <fieldset disabled={!isAdmin} className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8">
              {Object.entries(CATEGORY_ICONS).map(([key, IconOption]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => set("icon", key)}
                  aria-pressed={form.icon === key}
                  title={key.replaceAll("-", " ")}
                  className={cn("flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border text-[10px] capitalize transition", form.icon === key ? "border-primary bg-primary-50 text-primary ring-2 ring-primary/20" : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground")}
                >
                  <IconOption className="size-5" />
                  <span className="line-clamp-1 px-1">{key.replace("-2", "").replaceAll("-", " ")}</span>
                </button>
              ))}
            </fieldset>
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="Image" description="Shown on the categories page and as the share image.">
            <ImageUploadField
              folder="categories"
              value={form.image_path}
              previewUrl={form.image_path ? form.image_preview : form.external_image_url || null}
              onChange={(path, url) => setForm((current) => ({ ...current, image_path: path, image_preview: url, external_image_url: "" }))}
              disabled={!isAdmin}
            />
            {errors.image_path && <p className="mt-2 text-xs font-medium text-destructive">{errors.image_path}</p>}
            {!form.image_path && (
              <Field label="…or an image web address" className="mt-4" error={errors.image_url}>
                <Input type="url" value={form.external_image_url} onChange={(e) => set("external_image_url", e.target.value)} placeholder="https://" disabled={!isAdmin} />
              </Field>
            )}
          </Panel>

          <Panel title="Publishing">
            <fieldset disabled={!isAdmin} className="space-y-4">
              <label className="flex items-center justify-between gap-3 text-sm font-medium">
                <span>Visible on the site</span>
                <Switch checked={form.is_active} onCheckedChange={(checked) => set("is_active", checked)} />
              </label>
              <Field label="Display order" hint="Lower numbers come first." error={errors.sort_order}>
                <Input type="number" min={0} max={1000} value={form.sort_order} onChange={(e) => set("sort_order", e.target.value)} />
              </Field>
            </fieldset>
          </Panel>

          <Panel title="Preview">
            <div className="flex items-center gap-3">
              <span className="relative flex size-14 items-center justify-center overflow-hidden rounded-2xl bg-primary-50 text-primary">
                {form.image_preview || form.external_image_url ? <Image src={(form.image_path ? form.image_preview : form.external_image_url) ?? ""} alt="" fill sizes="56px" className="object-cover" /> : createElement(categoryIcon(form.icon), { className: "size-6" })}
              </span>
              <div className="min-w-0">
                <p className="font-bold">{form.name || "Category name"}</p>
                <p className="text-xs text-muted-foreground">/categories/{form.slug || "auto-generated"}</p>
              </div>
            </div>
            {category && <p className="mt-3 text-xs text-muted-foreground">{category.listings_count} listing{category.listings_count === 1 ? "" : "s"} in this category.</p>}
          </Panel>

          {category && isAdmin && (
            <Button
              type="button"
              variant="outline"
              className="w-full text-destructive hover:text-destructive"
              onClick={() => confirm({
                title: `Delete ${category.name}?`,
                description: category.listings_count ? "This category still has listings, so it can't be deleted. Hide it instead." : "This can't be undone.",
                action: async () => {
                  try {
                    await api.delete(`admin/categories/${category.id}`);
                    toast.success("Category deleted");
                    refresh();
                    router.push("/admin/categories");
                  } catch (err) {
                    toast.error(errorMessage(err, "Could not delete category"));
                  }
                },
              })}
            >
              <Trash2 className="size-4" /> Delete category
            </Button>
          )}
        </div>
      </div>
      {confirmDialog}
    </form>
  );
}
