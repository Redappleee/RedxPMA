"use client";

import { Area, AreaChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";

export const AnalyticsCharts = ({
  areaData,
  lineData
}: {
  areaData: Array<{ name: string; inventory: number }>;
  lineData: Array<{ status: string; count: number }>;
}) => {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="p-1">
        <CardHeader>
          <CardTitle>Inventory velocity</CardTitle>
        </CardHeader>
        <CardContent className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={areaData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="inventory" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.2)" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="p-1">
        <CardHeader>
          <CardTitle>Product status split</CardTitle>
        </CardHeader>
        <CardContent className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={lineData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="status" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="hsl(var(--success))" strokeWidth={2.5} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};
