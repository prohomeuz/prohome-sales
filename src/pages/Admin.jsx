/**
 * Admin foydalanuvchilar boshqaruv sahifasi.
 * Asosiy logika: widgets/user-table/ui/UserManagementPage
 */
import UserManagementPage from "@/widgets/user-table/ui/UserManagementPage";

export default function Admin() {
  return <UserManagementPage userRole="admin" />;
}
