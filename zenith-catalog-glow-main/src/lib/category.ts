import { Product, Section } from "@/types";

export const isSubcategory = (section?: Pick<Section, "parentSectionId"> | null) =>
  section?.parentSectionId !== null && section?.parentSectionId !== undefined;

const compareSections = (left: Section, right: Section) =>
  (left.sort_order ?? 0) - (right.sort_order ?? 0) || left.name.localeCompare(right.name);

const compareProducts = (left: Product, right: Product) =>
  (left.display_order ?? 0) - (right.display_order ?? 0) ||
  new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime() ||
  left.id - right.id;

export const getTopLevelSections = (sections: Section[], activeOnly = false) =>
  sections
    .filter(
      (section) => !isSubcategory(section) && (!activeOnly || section.is_active !== false)
    )
    .sort(compareSections);

export const getChildSections = (sections: Section[], parentId: number, activeOnly = false) =>
  sections
    .filter(
      (section) =>
        section.parentSectionId === parentId && (!activeOnly || section.is_active !== false)
    )
    .sort(compareSections);

export const getSectionFamilyIds = (sections: Section[], sectionId: number) => {
  const section = sections.find((item) => item.id === sectionId);
  if (!section || isSubcategory(section)) {
    return [sectionId];
  }
  return [sectionId, ...getChildSections(sections, sectionId).map((child) => child.id)];
};

export const getProductsForSection = (
  products: Product[],
  sections: Section[],
  sectionId: number
) => {
  const sectionIds = new Set(getSectionFamilyIds(sections, sectionId));
  return products.filter((product) => sectionIds.has(product.sectionId)).sort(compareProducts);
};

export const getDirectProductsForSection = (products: Product[], sectionId: number) =>
  products.filter((product) => product.sectionId === sectionId).sort(compareProducts);

export const getProductGroupsForChildSections = (
  products: Product[],
  childSections: Section[]
) =>
  childSections
    .map((section) => ({
      section,
      products: getDirectProductsForSection(products, section.id),
    }))
    .filter((group) => group.products.length > 0);

export const getProductCategoryLabel = (
  product: Pick<Product, "sectionName" | "parentSectionName">
) =>
  product.parentSectionName && product.sectionName
    ? `${product.parentSectionName} / ${product.sectionName}`
    : product.sectionName || "Uncategorized";
