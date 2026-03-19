/**
 * @file HomeDetails widget uchun state boshqaruvi.
 * @module widgets/home-details/model/home-details-reducer
 */

/** @type {object} Dastlabki state */
export const INITIAL_HOME_DETAILS_STATE = {
  home: null,
  notFound: false,
  error: false,
  pdfLoading: false,
  getLoading: false,
};

/**
 * HomeDetails reducer.
 *
 * Action turlari:
 * - FETCH_START — yuklanish boshlandi
 * - FETCH_SUCCESS — ma'lumot keldi
 * - FETCH_NOT_FOUND — xona topilmadi (404)
 * - FETCH_ERROR — xatolik
 * - CLEAR_HOME — xonani tozalash
 * - SET_PDF_LOADING — PDF generatsiya holati
 *
 * @param {object} state
 * @param {{ type: string, payload?: any }} action
 * @returns {object}
 */
export function homeDetailsReducer(state, action) {
  switch (action.type) {
    case "FETCH_START":
      return {
        ...state,
        getLoading: true,
        error: false,
        notFound: false,
      };
    case "FETCH_SUCCESS":
      return {
        ...state,
        home: action.payload,
        notFound: false,
        error: false,
        getLoading: false,
      };
    case "FETCH_NOT_FOUND":
      return {
        ...state,
        home: null,
        notFound: true,
        error: false,
        getLoading: false,
      };
    case "FETCH_ERROR":
      return {
        ...state,
        error: action.payload,
        getLoading: false,
      };
    case "CLEAR_HOME":
      return {
        ...state,
        home: null,
        notFound: false,
        error: false,
        getLoading: false,
      };
    case "SET_PDF_LOADING":
      return {
        ...state,
        pdfLoading: action.payload,
      };
    default:
      return state;
  }
}
