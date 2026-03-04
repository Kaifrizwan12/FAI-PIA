export type RootStackParamList = {
  Home: undefined;
  Attendance: undefined;
  Status: { matched: boolean; similarity: number };
  ProfileSetup: undefined;
  Profile: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList { }
  }
}
