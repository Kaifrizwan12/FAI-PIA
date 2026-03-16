export type RootStackParamList = {
  Home: undefined;
  CameraPermission: undefined;
  Attendance: undefined;
  Status: { matched: boolean; similarity: number; latitude?: number; longitude?: number };
  ProfileSetup: undefined;
  Profile: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList { }
  }
}
