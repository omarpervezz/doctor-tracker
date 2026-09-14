import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Sidebar />
      <div className="min-h-screen lg:pl-64">
        <Header />
        <main className="mx-auto max-w-455 p-4 pb-24 lg:p-8">{children}</main>
      </div>
      <MobileNav />
    </>
  );
}
