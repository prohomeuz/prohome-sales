/**
 * @file Kalkulyator state boshqaruvi — reducer va boshlang'ich holat.
 * @module widgets/calculator/model/calculator-reducer
 */

import { DEFAULT_CALC_STATE, INITIAL_CALC_RESULT } from "../lib/constants";
import { createEmptyStatusForm } from "../lib/helpers";

/**
 * Kalkulyatorning boshlang'ich state ni yaratadi.
 * useReducer lazy initializer sifatida ishlatiladi.
 * @returns {object}
 */
export function createCalculatorInitialState() {
  return {
    calcResult: INITIAL_CALC_RESULT,
    calcVersion: 0,
    selectedState: DEFAULT_CALC_STATE,
    showDiscount: false,
    discountType: "discountPerM2",
    period: 60,
    price: "",
    downPayment: "0",
    discount: "",
    galleryShow: false,
    calcLoading: false,
    statusDialogOpen: false,
    statusDialogAction: null,
    statusDialogRenderedAction: null,
    statusForm: createEmptyStatusForm(),
    statusErrors: {},
    pendingAction: null,
    bonusDialogOpen: false,
  };
}

/**
 * Kalkulyator reducer — barcha state o'zgarishlarini boshqaradi.
 *
 * Action turlari:
 * - SET_CALC_LOADING, SET_CALC_RESULT
 * - SET_SELECTED_STATE, TOGGLE_DISCOUNT, SET_DISCOUNT_TYPE
 * - SET_PERIOD, SET_PRICE, SET_DOWN_PAYMENT, SET_DISCOUNT
 * - SET_GALLERY_SHOW
 * - OPEN_STATUS_DIALOG, CLOSE_STATUS_DIALOG, CLEAR_STATUS_DIALOG
 * - SET_STATUS_FIELD, SET_STATUS_ERRORS, SET_PENDING_ACTION
 * - OPEN_BONUS_DIALOG, CLOSE_BONUS_DIALOG
 * - RESET, RESET_FOR_HOME
 *
 * @param {object} state
 * @param {{ type: string, payload?: any }} action
 * @returns {object}
 */
export function calculatorReducer(state, action) {
  switch (action.type) {
    case "SET_CALC_LOADING":
      return { ...state, calcLoading: action.payload };
    case "SET_CALC_RESULT":
      return {
        ...state,
        calcResult: action.payload,
        calcVersion: state.calcVersion + 1,
      };
    case "SET_SELECTED_STATE":
      return { ...state, selectedState: action.payload };
    case "TOGGLE_DISCOUNT":
      return { ...state, showDiscount: !state.showDiscount };
    case "SET_DISCOUNT_TYPE":
      return { ...state, discountType: action.payload };
    case "SET_PERIOD":
      return { ...state, period: action.payload };
    case "SET_PRICE":
      return { ...state, price: action.payload };
    case "SET_DOWN_PAYMENT":
      return { ...state, downPayment: action.payload };
    case "SET_DISCOUNT":
      return { ...state, discount: action.payload };
    case "SET_GALLERY_SHOW":
      if (state.galleryShow === action.payload) {
        return state;
      }
      return { ...state, galleryShow: action.payload };
    case "OPEN_STATUS_DIALOG":
      return {
        ...state,
        statusDialogOpen: true,
        statusDialogAction: action.payload.action,
        statusDialogRenderedAction: action.payload.action,
        statusForm: action.payload.form,
        statusErrors: {},
        pendingAction: null,
      };
    case "CLOSE_STATUS_DIALOG":
      return {
        ...state,
        statusDialogOpen: false,
        statusDialogAction: null,
        statusForm: createEmptyStatusForm(),
        statusErrors: {},
        pendingAction: null,
      };
    case "CLEAR_STATUS_DIALOG":
      return {
        ...state,
        statusDialogRenderedAction: null,
        statusForm: createEmptyStatusForm(),
        statusErrors: {},
      };
    case "SET_STATUS_FIELD":
      return {
        ...state,
        statusForm: {
          ...state.statusForm,
          [action.payload.field]: action.payload.value,
        },
        statusErrors: state.statusErrors[action.payload.field]
          ? {
              ...state.statusErrors,
              [action.payload.field]: null,
            }
          : state.statusErrors,
      };
    case "SET_STATUS_ERRORS":
      return { ...state, statusErrors: action.payload };
    case "SET_PENDING_ACTION":
      return { ...state, pendingAction: action.payload };
    case "OPEN_BONUS_DIALOG":
      return { ...state, bonusDialogOpen: true };
    case "CLOSE_BONUS_DIALOG":
      return { ...state, bonusDialogOpen: false };
    case "RESET":
      return {
        ...createCalculatorInitialState(),
        galleryShow: state.galleryShow,
      };
    case "RESET_FOR_HOME":
      return createCalculatorInitialState();
    default:
      return state;
  }
}
