/**
 * @file Har bir foydalanuvchi roli uchun UI konfiguratsiyasi.
 * @module widgets/user-table/lib/user-role-config
 *
 * Bu fayl Admin, Rop, SalesManager sahifalarini birlashtirishga imkon beradi.
 */

/**
 * @typedef {Object} UserRoleConfig
 * @property {'admin'|'rop'|'sales-manager'} crudType - useUserCrud uchun type
 * @property {string} title - Sahifa sarlavhasi
 * @property {string} loaderTitle - Yuklash vaqtidagi sarlavha
 * @property {string} emptyText - Bo'sh ro'yxat matni
 * @property {string} drawerTitle - Drawer sarlavhasi
 * @property {string} drawerDescription - Drawer tavsifi
 * @property {boolean} passFullName - remove() ga fullName uzatish kerakmi
 */

/** @type {Record<string, UserRoleConfig>} */
export const USER_ROLE_CONFIG = {
  admin: {
    crudType: "admin",
    title: "Adminlar",
    loaderTitle: "Adminlar yuklanmoqda",
    emptyText: "Hozircha adminlar yo'q",
    drawerTitle: "Yangi admin qo'shish.",
    drawerDescription: "Admin qo'shish uchun barcha ma'lumotlarni to'ldiring",
    passFullName: true,
    canUpdate: false,
  },
  rop: {
    crudType: "rop",
    title: "Roplar",
    loaderTitle: "Roplar yuklanmoqda",
    emptyText: "Hozircha roplar yo'q",
    drawerTitle: "Yangi rop qo'shish.",
    drawerDescription: "Rop qo'shish uchun barcha ma'lumotlarni to'ldiring",
    editDrawerTitle: "Ropni tahrirlash.",
    editDrawerDescription: "O'zgartirmoqchi bo'lgan ma'lumotlarni kiriting.",
    passFullName: false,
    canUpdate: true,
    updateIncludesCompanyId: true,
  },
  salesmanager: {
    crudType: "sales-manager",
    title: "Sotuv menejerlari",
    loaderTitle: "Sotuv menejerlari yuklanmoqda",
    emptyText: "Hozircha sotuv menejerlari yo'q",
    drawerTitle: "Yangi sotuv menejeri qo'shish.",
    drawerDescription: "Sotuv menejeri qo'shish uchun barcha ma'lumotlarni to'ldiring",
    editDrawerTitle: "Sotuv menejerini tahrirlash.",
    editDrawerDescription: "O'zgartirmoqchi bo'lgan ma'lumotlarni kiriting.",
    passFullName: false,
    canUpdate: true,
    updateIncludesCompanyId: false,
  },
};
