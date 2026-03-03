export type RootStackParamList = {
  Home: undefined; // no parameters expected for Home screen
  Attendance: undefined; // no parameters expected for Attendance screen
  Status: undefined;  // no parameters expected for Status screen
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
