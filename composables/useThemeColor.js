const primaryColor = ref('purple');

export const useThemeColor = () => {
  const setPrimaryColor = (color) => {
    primaryColor.value = color;
  };

  return {
    primaryColor: readonly(primaryColor),
    setPrimaryColor
  };
};
