import { AdminSidebarLayout } from '@/components/AdminSidebarLayout';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminSidebarLayout>{children}</AdminSidebarLayout>;
}
