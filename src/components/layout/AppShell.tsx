export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ backgroundColor: "#f8fafc", minHeight: "100vh", display: "flex", flexDirection: "column", maxWidth: "480px", margin: "0 auto", position: "relative" }}>
      {children}
    </div>
  );
}
