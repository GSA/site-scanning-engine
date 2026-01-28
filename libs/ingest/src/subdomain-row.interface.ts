export interface SubdomainRow {
  targetUrl: string;
  baseDomain: string;
  topLevelDomain: string;
  branch: string;
  agency: string;
  bureau: string;
  sourceListFederalDomains: string;
  sourceListDap: string;
  sourceListPulse: string;
  sourceListOmbIdea: string;
  sourceListEotw: string;
  sourceListUsagov: string;
  sourceListGovMan: string;
  sourceListUscourts: string;
  sourceListOira: string;
  sourceListOther: string;
  ombIdeaPublic: string;
  sourceListMil1: string;
  sourceListMil2: string;
  sourceListDodPublic: string;
  sourceListDotmil: string;
  sourceListFinalUrlWebsites: string;
  sourceListHouse117th: string;
  sourceListSenate117th: string;
  sourceListGpoFdlp: string;
  sourceListCisa: string;
  sourceListDod2025: string;
  sourceListDap2: string;
  sourceListUsagovClicks: string;
  sourceListUsagovClicksMil: string;
  sourceListSearchGov: string;
  sourceListSearchGovMil: string;
  sourceListPublicInventory: string;
  // [SOURCE-ADD-POINT]
  // Add new source list here
  // e.g.
  // sourceListNewList: string;
  filtered: string;
  pageviews: number;
  visits: number;
}
