import { CheckCircle2 } from "lucide-react";

import { Card, CardContent } from "@/ui/card";

const featureBlocks = [
  {
    title: "Lifecycle Product Management",
    points: ["Create, edit, archive products", "Status management", "Category and pricing controls"]
  },
  {
    title: "Analytics & Insights",
    points: ["Revenue and growth metrics", "Activity feeds", "Inventory forecasting"]
  },
  {
    title: "Collaboration",
    points: ["Assign managers", "In-product comments", "Real-time notifications"]
  },
  {
    title: "Enterprise Security",
    points: ["JWT sessions", "RBAC", "Input validation + sanitization"]
  }
];

export default function FeaturesPage() {
  return (
    <main className="container pb-12 pt-8">
      <h1 className="text-4xl font-semibold">Everything your product org needs</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        NexusPM blends performance analytics, collaboration, and secure workflows into one production-ready platform.
      </p>

      <div className="mt-10 grid gap-4 md:grid-cols-2">
        {featureBlocks.map((block) => (
          <Card key={block.title} className="p-6">
            <CardContent className="p-0">
              <h2 className="text-xl font-semibold">{block.title}</h2>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                {block.points.map((point) => (
                  <li key={point} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    {point}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}
