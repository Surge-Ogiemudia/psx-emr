import Link from "next/link";

export default function TopBar({
  title,
  subtitle,
  backHref,
  backLabel,
}: {
  title: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <div className="top-bar">
      {backHref && (
        <Link href={backHref} className="back">
          ← {backLabel ?? "Back"}
        </Link>
      )}
      <h2>{title}</h2>
      {subtitle && <p>{subtitle}</p>}
    </div>
  );
}
