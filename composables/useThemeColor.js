const primaryColor = ref('purple');

export const useThemeColor = () => {
  const setPrimaryColor = (color) => {
    primaryColor.value = color;
  };

  const getPrimaryColor = () => {
    return primaryColor.value;
  };

  return {
    primaryColor,
    setPrimaryColor,
    getPrimaryColor
  };
};
