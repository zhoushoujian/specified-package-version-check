export interface IConfig {
  dependenceArr: string[];
  ignoreCheck?: boolean;
  onlyWarn?: boolean;
  checkAllLocalDependencies?: boolean;
  ignoreSelf?: boolean;
  remoteUrl?: string;
  uploadPackageInfoUrl?: string;
  useDepCheck?: boolean;
  depcheckOptions?: any;
  autoFixOutdateDep?: boolean;
  silent?: boolean;
  enableGlobalCliCheck?: boolean;
}
