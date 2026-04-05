import { CustomerFormClient } from '../CustomerFormClient';

export const dynamic = 'force-dynamic';

export default function NewCustomerPage() {
  return <CustomerFormClient mode="create" />;
}
