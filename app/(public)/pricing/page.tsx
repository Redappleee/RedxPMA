import Link from "next/link";

import { Button } from "@/ui/button";
import { Card, CardContent } from "@/ui/card";

const plans = [
  {
    name: "Starter",
    price: "$29",
    details: "For early-stage product teams",
    points: ["Up to 3 seats", "Core product management", "Standard support"]
  },
  {
    name: "Growth",
    price: "$99",
    details: "For scaling SaaS teams",
    points: ["Unlimited seats", "Realtime collaboration", "Advanced analytics", "Priority support"],
    featured: true
  },
  {
    name: "Enterprise",
    price: "Custom",
    details: "For regulated or large organizations",
    points: ["SAML/SSO", "Custom SLAs", "Security reviews", "Dedicated success manager"]
  }
];

export default function PricingPage() {
  return (
    <main className="container pb-12 pt-8">
      <h1 className="text-4xl font-semibold">Simple, transparent pricing</h1>
      <p className="mt-3 text-muted-foreground">Scale from startup to enterprise without changing your workflow.</p>
      <div className="mt-10 grid gap-4 lg:grid-cols-3">
        {plans.map((plan) => (
          <Card key={plan.name} className={`p-6 ${plan.featured ? "border-primary/40 bg-primary/5" : ""}`}>
            <CardContent className="p-0">
              <p className="text-sm text-muted-foreground">{plan.name}</p>
              <p className="mt-2 text-4xl font-semibold">{plan.price}</p>
              <p className="mt-1 text-sm text-muted-foreground">{plan.details}</p>
              <ul className="mt-5 space-y-2 text-sm text-muted-foreground">
                {plan.points.map((point) => (
                  <li key={point}>• {point}</li>
                ))}
              </ul>
              <Button asChild className="mt-6 w-full" variant={plan.featured ? "default" : "secondary"}>
                <Link href="/signup">Choose {plan.name}</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}
