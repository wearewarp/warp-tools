export const dynamic = 'force-dynamic';

import { DriverForm } from '../DriverForm';

export default function NewDriverPage() {
  return (
    <div className="p-6 max-w-3xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Add Driver</h1>
        <p className="text-sm text-[#8B95A5] mt-1">Create a new driver profile</p>
      </div>
      <DriverForm />
    </div>
  );
}
