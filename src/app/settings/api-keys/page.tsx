import TopBar from "@/components/layout/TopBar";
import ApiKeysClient from "./ApiKeysClient";

export default function ApiKeysPage() {
  return (
    <div style={{ padding: "0 24px 24px", maxWidth: "800px", margin: "0 auto" }}>
      <TopBar title="API Keys & Failover Pool" backHref="/" backLabel="Dashboard" />
      <ApiKeysClient />
    </div>
  );
}
