export const removeValueFromArray = <T>(array: Array<T>, value: T): boolean => {
  const removeIndex = array.findIndex(i => i === value);
  if (removeIndex < 0) return false;
  array.splice(removeIndex, 1);
  return true;
};