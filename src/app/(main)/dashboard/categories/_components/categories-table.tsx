"use client";
"use no memo";

import { Pencil, Tag, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Category {
  id: string;
  name: string;
  parent: string | null;
  description: string;
  createdAt: string;
}

const categories: Category[] = [
  {
    id: "257a1b2c-3d4e-5f60-a7b8-c9d0e1f23456",
    name: "Car Parts",
    parent: null,
    description: "Find vehicle parts and accessories to keep your car running at its best.",
    createdAt: "2026-06-11",
  },
  {
    id: "257b2c3d-4e5f-6071-b8c9-d0e1f2345678",
    name: "Clothes",
    parent: null,
    description: "Urbs barba nobis vilicus. Cursim eveniet adopto tho lorem ipsum dolor sit amet.",
    createdAt: "2026-06-05",
  },
  {
    id: "257c3d4e-5f60-7182-c9d0-e1f234567890",
    name: "Electronics",
    parent: null,
    description: "Electronics",
    createdAt: "2026-06-05",
  },
  {
    id: "257d4e5f-6071-8293-d0e1-f23456789012",
    name: "Home/Kitchen",
    parent: null,
    description: "Discover household and kitchen items that make everyday living easier and more enjoyable.",
    createdAt: "2026-06-11",
  },
  {
    id: "257e5f60-7182-93a4-e1f2-345678901234",
    name: "Office Products",
    parent: null,
    description: "Bid on office supplies and equipment for work or business at unbeatable prices.",
    createdAt: "2026-06-11",
  },
  {
    id: "257f6071-8293-a4b5-f234-567890123456",
    name: "Phones & Accessories",
    parent: null,
    description: "Get smartphones, chargers, and accessories through competitive auction bidding.",
    createdAt: "2026-06-11",
  },
];

function formatDate(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function shortId(id: string) {
  return `${id.slice(0, 3)}...`;
}

export function CategoriesTable() {
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <Table className="**:data-[slot=table-cell]:px-4 **:data-[slot=table-head]:px-4">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-20 font-medium text-primary">ID</TableHead>
            <TableHead className="font-medium text-primary">Category Name</TableHead>
            <TableHead className="w-36 font-medium text-primary">Parent</TableHead>
            <TableHead className="font-medium text-primary">Description</TableHead>
            <TableHead className="w-32 font-medium text-primary">Created</TableHead>
            <TableHead className="w-20" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {categories.map((cat) => (
            <TableRow key={cat.id} className="border-border/60">
              <TableCell className="font-mono text-muted-foreground text-sm">{shortId(cat.id)}</TableCell>
              <TableCell>
                <span className="flex items-center gap-2">
                  <Tag className="size-4 shrink-0 text-muted-foreground" />
                  <span className="font-semibold">{cat.name}</span>
                </span>
              </TableCell>
              <TableCell>
                <span className="text-muted-foreground text-sm italic">Top-level</span>
              </TableCell>
              <TableCell>
                <span className="block max-w-md truncate text-muted-foreground text-sm" title={cat.description}>
                  {cat.description}
                </span>
              </TableCell>
              <TableCell className="text-sm">{formatDate(cat.createdAt)}</TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-1">
                  <Button variant="ghost" size="icon-sm" className="text-muted-foreground hover:text-foreground">
                    <Pencil className="size-4" />
                  </Button>
                  <Button variant="ghost" size="icon-sm" className="text-destructive/60 hover:text-destructive">
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
