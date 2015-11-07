import R from "ramda";
export const isEmpty = (value) => (R.isNil(value) || R.isEmpty(value));
