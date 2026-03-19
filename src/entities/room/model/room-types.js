/**
 * @file Room entity — konstantalar va JSDoc type lar.
 * @module entities/room/model/room-types
 */

/**
 * Xona holatlari
 * @enum {string}
 */
export const ROOM_STATUS = /** @type {const} */ ({
  /** Bo'sh — sotilmagan */
  EMPTY: "EMPTY",
  /** Sotilgan */
  SOLD: "SOLD",
  /** Band qilingan */
  RESERVED: "RESERVED",
  /** Ko'rsatilmaydi */
  NOT: "NOT",
});

/**
 * Holat → statistika kaliti xaritasi
 * @type {Record<string, string>}
 */
export const STATUS_TO_STAT_KEY = {
  SOLD: "totalSold",
  RESERVED: "totalReserved",
  EMPTY: "totalEmpty",
  NOT: "totalNot",
};

/**
 * @typedef {Object} Room
 * @property {string} id
 * @property {number} room - Xonalar soni
 * @property {string} status - ROOM_STATUS qiymatlaridan biri
 * @property {number} size - Maydoni (m²)
 * @property {number} price - Narxi ($/m²)
 * @property {number} floor - Qavat raqami
 * @property {string[]} [image] - Rasm nomlari
 * @property {number} [houseNumber] - Kvartira raqami
 */

/**
 * @typedef {Object} Block
 * @property {number} floor - Qavat soni
 * @property {Room[][]} appartment - [qavat][xona] matritsa
 * @property {object} [statistics] - Statistika
 */

/**
 * @typedef {Object} ProjectStructure
 * @property {number} maxFloor
 * @property {Record<string, Block>} blocks
 * @property {object} [totalStatistics]
 */
