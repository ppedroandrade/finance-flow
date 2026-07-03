import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { MobileNavigation } from "@/components/layout/mobile-navigation";
import { QuickTransaction } from "@/components/transactions/quick-transaction";
import { FinanceProvider } from "@/hooks/use-finance";

export default function PrivateLayout({ children }: { children: React.ReactNode }) {
  return (
    <FinanceProvider>
      <AppSidebar />
      <div className="min-h-screen lg:pl-[248px]">
        <AppHeader />
        <main className="mx-auto w-full max-w-[1480px] px-4 pb-30 sm:px-8 lg:px-10 lg:pb-10">{children}</main>
      </div>
      <QuickTransaction floating />
      <MobileNavigation />
    </FinanceProvider>
  );
}

