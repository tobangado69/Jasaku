"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  Clock,
} from "lucide-react";

// Mock data for earnings chart
const earningsData = [
  { month: "Jan", earnings: 1200 },
  { month: "Feb", earnings: 1800 },
  { month: "Mar", earnings: 1500 },
  { month: "Apr", earnings: 2200 },
  { month: "May", earnings: 2500 },
  { month: "Jun", earnings: 2300 },
];

interface Earning {
  id: string;
  amount: number;
  status: "COMPLETED" | "PENDING" | "FAILED";
  paymentMethod: string;
  booking: {
    id: string;
    service: {
      title: string;
    };
    customer: {
      name: string;
    };
  };
  completedAt: string;
}

export function ProviderEarnings() {
  const [earnings, setEarnings] = useState<Earning[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("30");

  useEffect(() => {
    const fetchEarnings = async () => {
      try {
        const response = await fetch(
          `/api/payments/provider?status=COMPLETED&limit=50`
        );
        if (response.ok) {
          const data = await response.json();
          setEarnings(data);
        } else {
          console.error("Failed to fetch earnings");
          setEarnings([]);
        }
      } catch (error) {
        console.error("Error fetching earnings:", error);
        setEarnings([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEarnings();
  }, [timeRange]);

  const totalEarnings = earnings
    .filter((e) => e.status === "COMPLETED")
    .reduce((sum, e) => sum + e.amount, 0);
  const pendingAmount = earnings
    .filter((e) => e.status === "PENDING")
    .reduce((sum, e) => sum + e.amount, 0);

  const kpiData = [
    {
      label: "Total Revenue",
      value: `Rp ${totalEarnings.toLocaleString()}`,
      icon: DollarSign,
    },
    {
      label: "Pending Amount",
      value: `Rp ${pendingAmount.toLocaleString()}`,
      icon: Clock,
    },
    {
      label: "Last Withdrawal",
      value: "Rp 1,500,000",
      icon: TrendingDown,
    },
  ];

  const getStatusBadge = (status: string) => {
    const variants: {
      [key: string]: "default" | "secondary" | "destructive" | "outline";
    } = {
      COMPLETED: "default",
      PENDING: "outline",
      FAILED: "destructive",
    };

    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3 w-full">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center">
        <div className="grid gap-6 md:grid-cols-3 w-full">
          {kpiData.map((item, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {item.label}
                </CardTitle>
                <item.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{item.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Button>
          <DollarSign className="mr-2 h-4 w-4" />
          Withdraw
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Earnings Chart</CardTitle>
            <CardDescription>
              Your earnings over the last 6 months.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={earningsData}>
                <defs>
                  <linearGradient
                    id="colorEarnings"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="earnings"
                  stroke="#10b981"
                  fillOpacity={1}
                  fill="url(#colorEarnings)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
            <CardDescription>
              Your latest completed transactions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {earnings.map((earning) => (
                  <TableRow key={earning.id}>
                    <TableCell>
                      <div className="font-medium">
                        {earning.booking.service.title}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {earning.booking.customer.name}
                      </div>
                    </TableCell>
                    <TableCell>Rp {earning.amount.toLocaleString()}</TableCell>
                    <TableCell>
                      {new Date(earning.completedAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
