export interface ICategory {
  id: number;
  name: string;
  slug: string;
  description?: string;
  iconUrl?: string;
  parentId?: number | null;
  children?: ICategory[];
  createdAt: string;
}

export type FlatCategory = Omit<ICategory, "children"> & {
  depth: number;
  parentName: string | null;
};

export function flattenCategories(cats: ICategory[], depth = 0, parentName: string | null = null): FlatCategory[] {
  return cats.flatMap((cat) => [
    { ...cat, children: undefined, depth, parentName },
    ...flattenCategories(cat.children ?? [], depth + 1, cat.name),
  ]);
}
