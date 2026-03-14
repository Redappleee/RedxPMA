"use client";

import { motion } from "framer-motion";
import { Boxes, CircleDollarSign, Package } from "lucide-react";
import Link from "next/link";

import { IProduct } from "@/types";
import { Badge } from "@/ui/badge";
import { Card, CardContent } from "@/ui/card";

const statusVariant = {
  active: "success",
  draft: "warning",
  archived: "neutral"
} as const;

export const ProductCard = ({ product }: { product: IProduct }) => {
  return (
    <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
      <Link href={`/products/${product._id}`}>
        <Card className="h-full p-5">
          <CardContent className="p-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-lg font-semibold tracking-tight">{product.name}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{product.description}</p>
              </div>
              <Badge variant={statusVariant[product.status]}>{product.status}</Badge>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-xs text-muted-foreground">
              <p className="flex items-center gap-1">
                <Boxes className="h-3.5 w-3.5" />
                {product.category}
              </p>
              <p className="flex items-center gap-1">
                <CircleDollarSign className="h-3.5 w-3.5" />${product.price}
              </p>
              <p className="flex items-center gap-1">
                <Package className="h-3.5 w-3.5" />{product.stock}
              </p>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
};
