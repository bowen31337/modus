'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, BarChart, CheckCircle2, Clock, Users } from 'lucide-react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';

interface TeamMetricsData {
  totalAgents: number;
  onlineAgents: number;
  busyAgents: number;
  offlineAgents: number;
  totalPosts: number;
  openPosts: number;
  inProgressPosts: number;
  resolvedPosts: number;
  avgResponseTime: number; // in minutes
  slaBreachCount: number;
}

interface TeamMetricsProps {
  refreshKey?: number;
}

export function TeamMetrics({ refreshKey = 0 }: TeamMetricsProps) {
  const { error } = useToast();
  const [metrics, setMetrics] = useState<TeamMetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMetrics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  useLayoutEffect(() => {
    if (!metrics || !containerRef.current) return;

    const ctx = gsap.context(() => {
      // Animate cards entry
      gsap.from(".metric-card", {
        y: 30,
        opacity: 0,
        duration: 0.6,
        stagger: 0.05,
        ease: "back.out(1.2)"
      });

      // Animate numbers counting up
      gsap.utils.toArray<HTMLElement>(".metric-value").forEach((el) => {
        const rawValue = el.innerText.replace(/[^0-9.-]+/g, "");
        const endValue = parseFloat(rawValue);
        
        if (!isNaN(endValue)) {
          gsap.from(el, {
            textContent: 0,
            duration: 1.5,
            ease: "power2.out",
            snap: { textContent: 1 },
            stagger: 0.1,
            onUpdate: function() {
              // Keep the suffix/formatting if needed, but for now simple snap is fine
              // For complex formatting, we'd need a proxy object
              el.innerText = Math.ceil(Number(this.targets()[0].textContent)).toString();
            }
          });
        }
      });
    }, containerRef);
    
    return () => ctx.revert();
  }, [metrics]);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      // Fetch agents for agent metrics
      const agentsResponse = await fetch('/api/v1/agents');
      if (!agentsResponse.ok) {
        throw new Error('Failed to fetch agents');
      }
      const agentsData = await agentsResponse.json();

      // Fetch posts for post metrics
      const postsResponse = await fetch('/api/v1/posts?limit=1000'); // Get all posts for metrics
      if (!postsResponse.ok) {
        throw new Error('Failed to fetch posts');
      }
      const postsData = await postsResponse.json();

      // Calculate metrics
      const agents = agentsData.data || [];
      const posts = postsData.data || [];

      const onlineAgents = agents.filter((a: any) => a.status === 'online').length;
      const busyAgents = agents.filter((a: any) => a.status === 'busy').length;
      const offlineAgents = agents.filter((a: any) => a.status === 'offline').length;

      const openPosts = posts.filter((p: any) => p.status === 'open').length;
      const inProgressPosts = posts.filter((p: any) => p.status === 'in_progress').length;
      const resolvedPosts = posts.filter((p: any) => p.status === 'resolved').length;

      // Calculate SLA breaches (posts open for more than 2 hours)
      const now = new Date();
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
      const slaBreachCount = posts.filter((p: any) => {
        const createdDate = new Date(p.created_at);
        return p.status === 'open' && createdDate < twoHoursAgo;
      }).length;

      // Calculate average response time (mock calculation based on resolved posts)
      const resolvedPostsCount = resolvedPosts;
      const avgResponseTime = resolvedPostsCount > 0 ? 45 : 0; // Mock: 45 minutes average

      setMetrics({
        totalAgents: agents.length,
        onlineAgents,
        busyAgents,
        offlineAgents,
        totalPosts: posts.length,
        openPosts,
        inProgressPosts,
        resolvedPosts,
        avgResponseTime,
        slaBreachCount,
      });
    } catch (err) {
      console.error('Error fetching metrics:', err);
      error('Failed to load metrics', 'There was a problem loading team metrics.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <Skeleton className="h-4 w-16 mb-2" />
              <Skeleton className="h-8 w-12" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="flex items-center justify-center p-6 text-muted-foreground">
        <AlertCircle className="w-5 h-5 mr-2" />
        Unable to load metrics
      </div>
    );
  }

  return (
    <div className="space-y-6" ref={containerRef}>
      {/* Agent Status Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="metric-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold metric-value">{metrics.totalAgents}</div>
            <div className="text-xs text-muted-foreground">
              <span className="text-green-500">{metrics.onlineAgents} online</span>
              {' • '}
              <span className="text-yellow-500">{metrics.busyAgents} busy</span>
              {' • '}
              <span className="text-gray-500">{metrics.offlineAgents} offline</span>
            </div>
          </CardContent>
        </Card>

        <Card className="metric-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Online Agents</CardTitle>
            <Users className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500 metric-value">{metrics.onlineAgents}</div>
            <div className="text-xs text-muted-foreground">
              {Math.round((metrics.onlineAgents / metrics.totalAgents) * 100)}% of team
            </div>
          </CardContent>
        </Card>

        <Card className="metric-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Busy Agents</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500 metric-value">{metrics.busyAgents}</div>
            <div className="text-xs text-muted-foreground">Currently occupied</div>
          </CardContent>
        </Card>

        <Card className="metric-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Offline Agents</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground metric-value">{metrics.offlineAgents}</div>
            <div className="text-xs text-muted-foreground">Not active</div>
          </CardContent>
        </Card>
      </div>

      {/* Queue Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="metric-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold metric-value">{metrics.totalPosts}</div>
            <div className="text-xs text-muted-foreground">In moderation queue</div>
          </CardContent>
        </Card>

        <Card className="metric-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Posts</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500 metric-value">{metrics.openPosts}</div>
            <div className="text-xs text-muted-foreground">Awaiting response</div>
          </CardContent>
        </Card>

        <Card className="metric-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500 metric-value">{metrics.inProgressPosts}</div>
            <div className="text-xs text-muted-foreground">Being handled</div>
          </CardContent>
        </Card>

        <Card className="metric-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500 metric-value">{metrics.resolvedPosts}</div>
            <div className="text-xs text-muted-foreground">Completed</div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="metric-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-500">
              <span className="metric-value">{metrics.avgResponseTime}</span>m
            </div>
            <div className="text-xs text-muted-foreground">Per resolved post</div>
          </CardContent>
        </Card>

        <Card className="metric-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">SLA Breaches</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500 metric-value">{metrics.slaBreachCount}</div>
            <div className="text-xs text-muted-foreground">Posts {`>`} 2 hours old</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}