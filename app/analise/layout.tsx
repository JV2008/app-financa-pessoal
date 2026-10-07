import { Sidebar } from "@/components/ui/sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex flex-col md:flex-row min-h-screen">
            <Sidebar />
            <main className="flex-1 p-4 sm:p-6 bg-gray-50 min-w-0">{children}</main>
        </div>
    );
}
