import { requireSuperAdmin } from '@/lib/auth/superAdmin';
import AttendanceEditor from './_components/AttendanceEditor';
import BulkSeeder from './_components/BulkSeeder';

export default async function OpsConsolePage() {
  await requireSuperAdmin(); // returns 404 for everyone else

  return (
    <div>
      <h1 className="text-3xl font-bold p-8 pb-0">Ops Console</h1>
      {/* Section 1: Manual Attendance Insert/Edit */}
      <div className="p-8">
        <AttendanceEditor />
      </div>
      {/* Section 2: Bulk Attendance Seeder */}
      <div className="p-8 pt-0">
        <BulkSeeder />
      </div>
    </div>
  );
}
