import { useEffect, useMemo, useState } from "react";
import { Activity, Download, Gauge, RefreshCw, Wifi } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import gadget69Logo from "@/assets/gadget69-logo.png";

type ConnectionLike = {
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
  addEventListener?: (type: string, listener: EventListenerOrEventListenerObject) => void;
  removeEventListener?: (type: string, listener: EventListenerOrEventListenerObject) => void;
};

type NavigatorWithConnection = Navigator & {
  connection?: ConnectionLike;
  mozConnection?: ConnectionLike;
  webkitConnection?: ConnectionLike;
};

type ConnectionSnapshot = {
  online: boolean;
  effectiveType: string;
  downlinkMbps: number | null;
  rttMs: number | null;
  saveData: boolean;
};

type TestResults = {
  pingMs: number | null;
  downloadMbps: number | null;
  transferSizeMb: number | null;
  testedAt: string | null;
};

const getConnection = (): ConnectionLike | undefined => {
  const nav = navigator as NavigatorWithConnection;
  return nav.connection || nav.mozConnection || nav.webkitConnection;
};

const readConnectionSnapshot = (): ConnectionSnapshot => {
  const connection = getConnection();

  return {
    online: navigator.onLine,
    effectiveType: connection?.effectiveType || "Unavailable",
    downlinkMbps: typeof connection?.downlink === "number" ? connection.downlink : null,
    rttMs: typeof connection?.rtt === "number" ? connection.rtt : null,
    saveData: Boolean(connection?.saveData),
  };
};

const average = (values: number[]) =>
  values.reduce((total, value) => total + value, 0) / Math.max(values.length, 1);

const formatMetric = (value: number | null, suffix: string, digits = 1) =>
  value === null ? "--" : `${value.toFixed(digits)} ${suffix}`;

const AdminSpeedTest = () => {
  const [connection, setConnection] = useState<ConnectionSnapshot>(() => readConnectionSnapshot());
  const [results, setResults] = useState<TestResults>({
    pingMs: null,
    downloadMbps: null,
    transferSizeMb: null,
    testedAt: null,
  });
  const [stage, setStage] = useState("Ready to test");
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const syncConnection = () => setConnection(readConnectionSnapshot());
    const connectionInfo = getConnection();

    window.addEventListener("online", syncConnection);
    window.addEventListener("offline", syncConnection);
    connectionInfo?.addEventListener?.("change", syncConnection);

    return () => {
      window.removeEventListener("online", syncConnection);
      window.removeEventListener("offline", syncConnection);
      connectionInfo?.removeEventListener?.("change", syncConnection);
    };
  }, []);

  const networkSummary = useMemo(() => {
    if (!results.downloadMbps) {
      return "Run the test to capture a fresh latency and download reading for this admin device.";
    }
    if (results.downloadMbps >= 50) {
      return "Connection looks excellent for image-heavy admin work and uploads.";
    }
    if (results.downloadMbps >= 20) {
      return "Connection looks healthy for normal admin usage.";
    }
    if (results.downloadMbps >= 8) {
      return "Connection is usable, but large media uploads may feel slow.";
    }
    return "Connection is on the slower side. Expect delays on media-heavy actions.";
  }, [results.downloadMbps]);

  const runSpeedTest = async () => {
    setIsRunning(true);
    setError(null);

    try {
      setStage("Testing latency");
      const pingRuns: number[] = [];

      for (let index = 0; index < 3; index += 1) {
        const pingStart = performance.now();
        const pingResponse = await fetch(`${window.location.origin}/?ping=${Date.now()}-${index}`, {
          cache: "no-store",
        });
        if (!pingResponse.ok) {
          throw new Error("Unable to reach the storefront for latency testing.");
        }
        await pingResponse.text();
        pingRuns.push(performance.now() - pingStart);
      }

      const pingMs = average(pingRuns);

      setStage("Testing download speed");
      const downloadStart = performance.now();
      const downloadResponse = await fetch(`${gadget69Logo}?downloadTest=${Date.now()}`, {
        cache: "no-store",
      });
      if (!downloadResponse.ok) {
        throw new Error("Unable to download the test asset.");
      }

      const downloadBlob = await downloadResponse.blob();
      const downloadSeconds = Math.max((performance.now() - downloadStart) / 1000, 0.001);
      const downloadMbps = (downloadBlob.size * 8) / downloadSeconds / 1_000_000;

      setResults({
        pingMs,
        downloadMbps,
        transferSizeMb: downloadBlob.size / (1024 * 1024),
        testedAt: new Date().toLocaleString(),
      });
      setConnection(readConnectionSnapshot());
      setStage("Test completed");
    } catch (testError) {
      setError(testError instanceof Error ? testError.message : "Speed test failed.");
      setStage("Test failed");
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl font-bold">Speed Test</h1>
            <p className="mt-1 text-sm font-body text-muted-foreground">
              Admin-only network diagnostics for checking latency and download responsiveness.
            </p>
          </div>

          <Button onClick={() => void runSpeedTest()} disabled={isRunning}>
            {isRunning ? <RefreshCw className="animate-spin" /> : <Gauge />}
            {isRunning ? "Running Test..." : "Start Speed Test"}
          </Button>
        </div>

        {error && (
          <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm font-body text-destructive">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card className="shadow-premium">
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-accent" />
                Latency
              </CardDescription>
              <CardTitle className="text-3xl">{formatMetric(results.pingMs, "ms")}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Average of 3 app reachability checks.
            </CardContent>
          </Card>

          <Card className="shadow-premium">
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <Download className="h-4 w-4 text-accent" />
                Download
              </CardDescription>
              <CardTitle className="text-3xl">{formatMetric(results.downloadMbps, "Mbps")}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Downloaded {formatMetric(results.transferSizeMb, "MB", 2)} from the current app asset.
            </CardContent>
          </Card>

          <Card className="shadow-premium">
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <Wifi className="h-4 w-4 text-accent" />
                Browser Estimate
              </CardDescription>
              <CardTitle className="text-3xl">{formatMetric(connection.downlinkMbps, "Mbps")}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {connection.effectiveType} network, RTT {formatMetric(connection.rttMs, "ms", 0)}.
            </CardContent>
          </Card>

          <Card className="shadow-premium">
            <CardHeader className="pb-3">
              <CardDescription>Status</CardDescription>
              <CardTitle className="text-2xl">{connection.online ? "Online" : "Offline"}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {connection.saveData ? "Data saver is enabled." : "Data saver is disabled."}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.5fr_1fr]">
          <Card className="shadow-premium">
            <CardHeader>
              <CardTitle className="text-lg">Current Test Summary</CardTitle>
              <CardDescription>{networkSummary}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <div className="rounded-lg border border-border bg-background p-4">
                <p className="font-medium text-foreground">Stage</p>
                <p className="mt-1">{stage}</p>
              </div>
              <div className="rounded-lg border border-border bg-background p-4">
                <p className="font-medium text-foreground">Last completed run</p>
                <p className="mt-1">{results.testedAt || "No test completed yet."}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-premium">
            <CardHeader>
              <CardTitle className="text-lg">How This Works</CardTitle>
              <CardDescription>Useful for quick admin troubleshooting.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>This page checks storefront latency, downloads a known app asset, and reads browser network hints when available.</p>
              <p>Results are best used for relative troubleshooting inside the admin panel, especially before media uploads or banner updates.</p>
              <p>If browser estimates are unavailable, the latency and download cards still provide a direct admin-side health check.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminSpeedTest;
