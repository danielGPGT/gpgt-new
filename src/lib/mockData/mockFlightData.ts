// Flight mock data for travel services
// This file provides realistic mock data for flights matching the real API structure

export interface MockLowFareResult {
  Currency: {
    CurrencyId: string;
    CurrencyCode: string;
    CurrencyName: string;
    CurrencySymbol: string;
    DecimalPlaces: number;
  };
  Locations: MockLocation[];
  Airlines: MockAirline[];
  Cabins: MockCabin[];
  PassengerTypes: MockPassengerType[];
  RevenueStreams: MockRevenueStream[];
  FareTypes: MockFareType[];
  FareSubTypes: MockFareSubType[];
  Flights: MockFlight[];
  RouteGroups: MockRouteGroup[];
  Recommendations: MockRecommendation[];
  RecommendationGroups: MockRecommendationGroup[];
  FareFamilies: MockFareFamily[];
  FareFamilyServices: MockFareFamilyService[];
  ServiceAttributes: any[];
  ServiceStatuses: MockServiceStatus[];
  ServiceClassifications: MockServiceClassification[];
  ServiceGroups: MockServiceGroup[];
  ServiceSubGroups: MockServiceSubGroup[];
  GlobalDistributionSystems: MockGDS[];
  Discounts: any[];
}

export interface MockLocation {
  AirportId: string;
  AirportName: string;
}

export interface MockAirline {
  AirlineId: string;
  AirlineName: string;
  SkytraxRating: number;
}

export interface MockCabin {
  CabinId: string;
  CabinName: string;
  IsPremium?: boolean;
  DisplayOrder?: number;
}

export interface MockPassengerType {
  PassengerTypeId: string;
  PassengerTypeName: string;
}

export interface MockRevenueStream {
  RevenueStreamId: string;
  RevenueStreamName: string;
}

export interface MockFareType {
  FareTypeId: string;
  FareTypeName: string;
}

export interface MockFareSubType {
  FareSubTypeId: string;
  FareSubTypeName: string;
}

export interface MockFlight {
  FlightId: string;
  DepartureAirportId: string;
  ArrivalAirportId: string;
  DepartureDateTime: string;
  ArrivalDateTime: string;
  DepartureDateTimeUtc: string;
  ArrivalDateTimeUtc: string;
  FlightNumber: string;
  MarketingAirlineId: string;
  OperatingAirlineId: string;
  FlightDuration: string;
  AircraftType: string;
  DepartureTerminal?: string;
  ArrivalTerminal?: string;
  Cabins: MockFlightCabin[];
  Stops: any[];
}

export interface MockFlightCabin {
  GenericCabinId: string;
  AirlineCabinId: string;
}

export interface MockRouteGroup {
  RequestedFlightId: string;
  Routes: MockRoute[];
  RouteGroupId: number;
  IsInbound: boolean;
}

export interface MockRoute {
  RouteId: string;
  Routing: string;
  FlightIds: string[];
}

export interface MockRecommendation {
  RecommendationId: string;
  FareTypeId: string;
  FareSubTypeId?: string;
  RevenueStreamId: string;
  ValidatingAirlineId: string;
  TicketingDeadline: string;
  RouteCombinations: MockRouteCombination[];
  Passengers: MockPassenger[];
  FareDetails: MockFareDetail[];
  Fare: number;
  Tax: number;
  Fee: number;
  Total: number;
  FareFamilyIds: string[];
  Routing: string;
  GdsId: string;
}

export interface MockRouteCombination {
  RouteCombinationId: string;
  RouteIds: string[];
}

export interface MockPassenger {
  RequestedTypeId: string;
  PricedTypeId: string;
  TypeCount: number;
  Fare: number;
  Tax: number;
  Fee: number;
  Total: number;
  Fares: MockFare[];
}

export interface MockFare {
  FareId: string;
  ClassId: string;
  CabinId: string;
  Seats: number;
  FareBasisCode: string;
  FareFamilyId: string;
  BaggageAllowance: MockBaggageAllowance;
  BreakPoint?: boolean;
}

export interface MockBaggageAllowance {
  NumberOfPieces?: number;
  WeightInKilograms?: number;
}

export interface MockFareDetail {
  CostTypeId: string;
  CostGroupId: string;
  CostAmount: number;
}

export interface MockRecommendationGroup {
  RecommendationId: string;
  RouteCombinationId: string;
  RecommendationTypeId: string;
  RecommendationGroupTypeId: string;
}

export interface MockFareFamily {
  FareFamilyId: string;
  FareFamilyName: string;
  FareFamilyDescription: string;
  ValidatingAirlineId: string;
  ServiceReferences: MockServiceReference[];
}

export interface MockServiceReference {
  ServiceId: string;
  ServiceStatusId: string;
}

export interface MockFareFamilyService {
  ServiceId: string;
  ServiceName: string;
  AirlineIds: string[];
  ServiceClassificationId?: string;
  ServiceGroupId?: string;
  ServiceSubGroupId?: string;
}

export interface MockServiceStatus {
  StatusId: string;
  InternalStatusName: string;
}

export interface MockServiceClassification {
  TypeId: string;
  TypeName: string;
}

export interface MockServiceGroup {
  TypeId: string;
  TypeName: string;
}

export interface MockServiceSubGroup {
  TypeId: string;
  TypeName: string;
}

export interface MockGDS {
  GdsId: string;
  ExternalGdsName: string;
}

// Mock flight data for London to Abu Dhabi (December 4-8, 2025)
export const mockLowFareResult: MockLowFareResult = {
  Currency: {
    CurrencyId: "GBP",
    CurrencyCode: "826",
    CurrencyName: "Pound Sterling",
    CurrencySymbol: "&#163;",
    DecimalPlaces: 2
  },
  Locations: [
    { AirportId: "LHR", AirportName: "London Heathrow" },
    { AirportId: "AUH", AirportName: "Abu Dhabi Intl" },
    { AirportId: "LGW", AirportName: "London Gatwick" },
    { AirportId: "STN", AirportName: "London Stansted" }
  ],
  Airlines: [
    { AirlineId: "BA", AirlineName: "British Airways", SkytraxRating: 4 },
    { AirlineId: "EY", AirlineName: "Etihad Airways", SkytraxRating: 4 },
    { AirlineId: "VS", AirlineName: "Virgin Atlantic Airways", SkytraxRating: 4 }
  ],
  Cabins: [
    { CabinId: "ECO", CabinName: "Economy" },
    { CabinId: "PEC", CabinName: "Premium Economy", IsPremium: true },
    { CabinId: "BUS", CabinName: "Business", IsPremium: true }
  ],
  PassengerTypes: [
    { PassengerTypeId: "ADT", PassengerTypeName: "Adult" },
    { PassengerTypeId: "CHD", PassengerTypeName: "Child" }
  ],
  RevenueStreams: [
    { RevenueStreamId: "ITE", RevenueStreamName: "Etihad IT" },
    { RevenueStreamId: "VAI", RevenueStreamName: "Virgin Atlantic IT" },
    { RevenueStreamId: "ITD", RevenueStreamName: "Inclusive Tour Deferred" }
  ],
  FareTypes: [
    { FareTypeId: "ITR", FareTypeName: "Inclusive Tour Fare" }
  ],
  FareSubTypes: [
    { FareSubTypeId: "ITRDEF", FareSubTypeName: "Inclusive Tour Deferred" },
    { FareSubTypeId: "CATNRM", FareSubTypeName: "CAT 35 Fare" }
  ],
  Flights: [
    // Outbound flights (Dec 4, 2025)
    {
      FlightId: "F1",
      DepartureAirportId: "LHR",
      ArrivalAirportId: "AUH",
      DepartureDateTime: "2025-12-04T21:35:00",
      ArrivalDateTime: "2025-12-05T08:30:00",
      DepartureDateTimeUtc: "2025-12-04T21:35:00Z",
      ArrivalDateTimeUtc: "2025-12-05T04:30:00Z",
      FlightNumber: "0109",
      MarketingAirlineId: "BA",
      OperatingAirlineId: "BA",
      FlightDuration: "06:55",
      AircraftType: "789",
      DepartureTerminal: "5",
      ArrivalTerminal: "1",
      Cabins: [
        { GenericCabinId: "ECO", AirlineCabinId: "UAECO" },
        { GenericCabinId: "PEC", AirlineCabinId: "QFPEC" }
      ],
      Stops: []
    },
    {
      FlightId: "F2",
      DepartureAirportId: "LHR",
      ArrivalAirportId: "AUH",
      DepartureDateTime: "2025-12-04T20:40:00",
      ArrivalDateTime: "2025-12-05T07:40:00",
      DepartureDateTimeUtc: "2025-12-04T20:40:00Z",
      ArrivalDateTimeUtc: "2025-12-05T03:40:00Z",
      FlightNumber: "0105",
      MarketingAirlineId: "BA",
      OperatingAirlineId: "BA",
      FlightDuration: "07:00",
      AircraftType: "781",
      DepartureTerminal: "5",
      ArrivalTerminal: "1",
      Cabins: [
        { GenericCabinId: "ECO", AirlineCabinId: "UAECO" },
        { GenericCabinId: "PEC", AirlineCabinId: "QFPEC" }
      ],
      Stops: []
    },
    {
      FlightId: "F3",
      DepartureAirportId: "LHR",
      ArrivalAirportId: "AUH",
      DepartureDateTime: "2025-12-04T12:40:00",
      ArrivalDateTime: "2025-12-04T23:45:00",
      DepartureDateTimeUtc: "2025-12-04T12:40:00Z",
      ArrivalDateTimeUtc: "2025-12-04T19:45:00Z",
      FlightNumber: "0107",
      MarketingAirlineId: "BA",
      OperatingAirlineId: "BA",
      FlightDuration: "07:05",
      AircraftType: "388",
      DepartureTerminal: "5",
      ArrivalTerminal: "1",
      Cabins: [
        { GenericCabinId: "ECO", AirlineCabinId: "UAECO" },
        { GenericCabinId: "PEC", AirlineCabinId: "QFPEC" }
      ],
      Stops: []
    },
    {
      FlightId: "F4",
      DepartureAirportId: "LGW",
      ArrivalAirportId: "AUH",
      DepartureDateTime: "2025-12-04T20:25:00",
      ArrivalDateTime: "2025-12-05T07:20:00",
      DepartureDateTimeUtc: "2025-12-04T20:25:00Z",
      ArrivalDateTimeUtc: "2025-12-05T03:20:00Z",
      FlightNumber: "10",
      MarketingAirlineId: "EY",
      OperatingAirlineId: "EY",
      FlightDuration: "06:55",
      AircraftType: "388",
      DepartureTerminal: "N",
      ArrivalTerminal: "3",
      Cabins: [
        { GenericCabinId: "ECO", AirlineCabinId: "CALEC" }
      ],
      Stops: []
    },
    {
      FlightId: "F5",
      DepartureAirportId: "LHR",
      ArrivalAirportId: "AUH",
      DepartureDateTime: "2025-12-04T21:35:00",
      ArrivalDateTime: "2025-12-05T08:45:00",
      DepartureDateTimeUtc: "2025-12-04T21:35:00Z",
      ArrivalDateTimeUtc: "2025-12-05T04:45:00Z",
      FlightNumber: "400",
      MarketingAirlineId: "VS",
      OperatingAirlineId: "VS",
      FlightDuration: "07:10",
      AircraftType: "789",
      DepartureTerminal: "3",
      ArrivalTerminal: "1",
      Cabins: [
        { GenericCabinId: "ECO", AirlineCabinId: "CALEC" }
      ],
      Stops: []
    },
    // Inbound flights (Dec 8, 2025)
    {
      FlightId: "F6",
      DepartureAirportId: "AUH",
      ArrivalAirportId: "LHR",
      DepartureDateTime: "2025-12-08T02:15:00",
      ArrivalDateTime: "2025-12-08T06:25:00",
      DepartureDateTimeUtc: "2025-12-07T22:15:00Z",
      ArrivalDateTimeUtc: "2025-12-08T06:25:00Z",
      FlightNumber: "0106",
      MarketingAirlineId: "BA",
      OperatingAirlineId: "BA",
      FlightDuration: "08:10",
      AircraftType: "388",
      DepartureTerminal: "1",
      ArrivalTerminal: "5",
      Cabins: [
        { GenericCabinId: "ECO", AirlineCabinId: "UAECO" },
        { GenericCabinId: "PEC", AirlineCabinId: "QFPEC" }
      ],
      Stops: []
    },
    {
      FlightId: "F7",
      DepartureAirportId: "AUH",
      ArrivalAirportId: "LHR",
      DepartureDateTime: "2025-12-08T10:00:00",
      ArrivalDateTime: "2025-12-08T14:15:00",
      DepartureDateTimeUtc: "2025-12-08T06:00:00Z",
      ArrivalDateTimeUtc: "2025-12-08T14:15:00Z",
      FlightNumber: "0104",
      MarketingAirlineId: "BA",
      OperatingAirlineId: "BA",
      FlightDuration: "08:15",
      AircraftType: "781",
      DepartureTerminal: "1",
      ArrivalTerminal: "5",
      Cabins: [
        { GenericCabinId: "ECO", AirlineCabinId: "UAECO" },
        { GenericCabinId: "PEC", AirlineCabinId: "QFPEC" }
      ],
      Stops: []
    },
    {
      FlightId: "F8",
      DepartureAirportId: "AUH",
      ArrivalAirportId: "LGW",
      DepartureDateTime: "2025-12-08T02:50:00",
      ArrivalDateTime: "2025-12-08T06:40:00",
      DepartureDateTimeUtc: "2025-12-07T22:50:00Z",
      ArrivalDateTimeUtc: "2025-12-08T06:40:00Z",
      FlightNumber: "11",
      MarketingAirlineId: "EY",
      OperatingAirlineId: "EY",
      FlightDuration: "07:50",
      AircraftType: "388",
      DepartureTerminal: "3",
      ArrivalTerminal: "N",
      Cabins: [
        { GenericCabinId: "ECO", AirlineCabinId: "CALEC" }
      ],
      Stops: []
    },
    {
      FlightId: "F9",
      DepartureAirportId: "AUH",
      ArrivalAirportId: "LHR",
      DepartureDateTime: "2025-12-08T10:40:00",
      ArrivalDateTime: "2025-12-08T15:05:00",
      DepartureDateTimeUtc: "2025-12-08T06:40:00Z",
      ArrivalDateTimeUtc: "2025-12-08T15:05:00Z",
      FlightNumber: "401",
      MarketingAirlineId: "VS",
      OperatingAirlineId: "VS",
      FlightDuration: "08:25",
      AircraftType: "789",
      DepartureTerminal: "1",
      ArrivalTerminal: "3",
      Cabins: [
        { GenericCabinId: "ECO", AirlineCabinId: "CALEC" }
      ],
      Stops: []
    }
  ],
  RouteGroups: [
    {
      RequestedFlightId: "fc561562-2945-4da9-a746-1a8e3225bd7d",
      Routes: [
        { RouteId: "G1R1", Routing: "LHR-AUH", FlightIds: ["F1"] },
        { RouteId: "G1R2", Routing: "LHR-AUH", FlightIds: ["F2"] },
        { RouteId: "G1R3", Routing: "LHR-AUH", FlightIds: ["F3"] },
        { RouteId: "G1R4", Routing: "LGW-AUH", FlightIds: ["F4"] },
        { RouteId: "G1R5", Routing: "LHR-AUH", FlightIds: ["F5"] }
      ],
      RouteGroupId: 1,
      IsInbound: false
    },
    {
      RequestedFlightId: "581e227f-45d7-4824-9a51-3e7a65c6f9aa",
      Routes: [
        { RouteId: "G2R1", Routing: "AUH-LHR", FlightIds: ["F6"] },
        { RouteId: "G2R2", Routing: "AUH-LHR", FlightIds: ["F7"] },
        { RouteId: "G2R3", Routing: "AUH-LGW", FlightIds: ["F8"] },
        { RouteId: "G2R4", Routing: "AUH-LHR", FlightIds: ["F9"] }
      ],
      RouteGroupId: 2,
      IsInbound: true
    }
  ],
  Recommendations: [
    {
      RecommendationId: "R3R1",
      FareTypeId: "ITR",
      FareSubTypeId: "ITRDEF",
      RevenueStreamId: "ITD",
      ValidatingAirlineId: "BA",
      TicketingDeadline: "2025-10-20T00:00:00",
      RouteCombinations: [
        { RouteCombinationId: "R3R1C1", RouteIds: ["G1R1", "G2R1"] },
        { RouteCombinationId: "R3R1C2", RouteIds: ["G1R2", "G2R1"] },
        { RouteCombinationId: "R3R1C3", RouteIds: ["G1R3", "G2R1"] }
      ],
      Passengers: [
        {
          RequestedTypeId: "ADT",
          PricedTypeId: "ADT",
          TypeCount: 1,
          Fare: 233.00,
          Tax: 350.52,
          Fee: 19.50,
          Total: 603.02,
          Fares: [
            {
              FareId: "R3R1ADTF1",
              ClassId: "N",
              CabinId: "ECO",
              Seats: 9,
              FareBasisCode: "758-NLNC00M7U/Y",
              FareFamilyId: "R3FF1",
              BaggageAllowance: { NumberOfPieces: 1 }
            },
            {
              FareId: "R3R1ADTF2",
              ClassId: "O",
              CabinId: "ECO",
              Seats: 9,
              FareBasisCode: "758-OLNC00M7U/Y",
              FareFamilyId: "R3FF1",
              BaggageAllowance: { NumberOfPieces: 1 }
            }
          ]
        }
      ],
      FareDetails: [
        { CostTypeId: "MGSF", CostGroupId: "MSVF", CostAmount: 15.00 },
        { CostTypeId: "MTPS", CostGroupId: "MSVF", CostAmount: 4.50 }
      ],
      Fare: 233.00,
      Tax: 350.52,
      Fee: 19.50,
      Total: 603.02,
      FareFamilyIds: ["R3FF1"],
      Routing: "LHR-AUH-LHR",
      GdsId: "NDCABA"
    },
    {
      RecommendationId: "R2R1",
      FareTypeId: "ITR",
      FareSubTypeId: "CATNRM",
      RevenueStreamId: "ITE",
      ValidatingAirlineId: "EY",
      TicketingDeadline: "2025-10-26T23:59:59",
      RouteCombinations: [
        { RouteCombinationId: "R2R1C1", RouteIds: ["G1R4", "G2R3"] }
      ],
      Passengers: [
        {
          RequestedTypeId: "ADT",
          PricedTypeId: "ADT",
          TypeCount: 1,
          Fare: 216.00,
          Tax: 297.87,
          Fee: 19.50,
          Total: 533.37,
          Fares: [
            {
              FareId: "R2R1ADTF1",
              ClassId: "L",
              CabinId: "ECO",
              Seats: 9,
              FareBasisCode: "L3LTPGB2",
              FareFamilyId: "R2FF1",
              BaggageAllowance: { WeightInKilograms: 30.0 },
              BreakPoint: true
            },
            {
              FareId: "R2R1ADTF2",
              ClassId: "L",
              CabinId: "ECO",
              Seats: 9,
              FareBasisCode: "LLATPGB2",
              FareFamilyId: "R2FF1",
              BaggageAllowance: { WeightInKilograms: 30.0 },
              BreakPoint: true
            }
          ]
        }
      ],
      FareDetails: [
        { CostTypeId: "MGSF", CostGroupId: "MSVF", CostAmount: 15.00 },
        { CostTypeId: "MTPS", CostGroupId: "MSVF", CostAmount: 4.50 }
      ],
      Fare: 216.00,
      Tax: 297.87,
      Fee: 19.50,
      Total: 533.37,
      FareFamilyIds: ["R2FF1"],
      Routing: "LGW-AUH-LGW",
      GdsId: "AMADWS"
    },
    {
      RecommendationId: "R2R2",
      FareTypeId: "ITR",
      RevenueStreamId: "VAI",
      ValidatingAirlineId: "VS",
      TicketingDeadline: "2025-11-01T23:59:59",
      RouteCombinations: [
        { RouteCombinationId: "R2R2C1", RouteIds: ["G1R5", "G2R4"] }
      ],
      Passengers: [
        {
          RequestedTypeId: "ADT",
          PricedTypeId: "ADT",
          TypeCount: 1,
          Fare: 170.00,
          Tax: 350.52,
          Fee: 19.50,
          Total: 540.02,
          Fares: [
            {
              FareId: "R2R2ADTF1",
              ClassId: "O",
              CabinId: "ECO",
              Seats: 9,
              FareBasisCode: "ORL0JDSA",
              FareFamilyId: "R2FF2",
              BaggageAllowance: { NumberOfPieces: 1 },
              BreakPoint: true
            },
            {
              FareId: "R2R2ADTF2",
              ClassId: "O",
              CabinId: "ECO",
              Seats: 6,
              FareBasisCode: "OG1Y81SA",
              FareFamilyId: "R2FF2",
              BaggageAllowance: { NumberOfPieces: 1 },
              BreakPoint: true
            }
          ]
        }
      ],
      FareDetails: [
        { CostTypeId: "MGSF", CostGroupId: "MSVF", CostAmount: 15.00 },
        { CostTypeId: "MTPS", CostGroupId: "MSVF", CostAmount: 4.50 }
      ],
      Fare: 170.00,
      Tax: 350.52,
      Fee: 19.50,
      Total: 540.02,
      FareFamilyIds: ["R2FF2"],
      Routing: "LHR-AUH-LHR",
      GdsId: "AMADWS"
    }
  ],
  RecommendationGroups: [
    {
      RecommendationId: "R2R1",
      RouteCombinationId: "R2R1C1",
      RecommendationTypeId: "PRFCHPST",
      RecommendationGroupTypeId: "GENERICGRUP"
    },
    {
      RecommendationId: "R2R2",
      RouteCombinationId: "R2R2C1",
      RecommendationTypeId: "ARLCHPST",
      RecommendationGroupTypeId: "GENERICGRUP"
    },
    {
      RecommendationId: "R3R1",
      RouteCombinationId: "R3R1C1",
      RecommendationTypeId: "ARLCHPST",
      RecommendationGroupTypeId: "GENERICGRUP"
    }
  ],
  FareFamilies: [
    {
      FareFamilyId: "R3FF1",
      FareFamilyName: "PCR_1",
      FareFamilyDescription: "STANDARD ECONOMY",
      ValidatingAirlineId: "BA",
      ServiceReferences: [
        { ServiceId: "R3FS1", ServiceStatusId: "INCLUD" },
        { ServiceId: "R3FS2", ServiceStatusId: "INCLUD" },
        { ServiceId: "R3FS3", ServiceStatusId: "INCLUD" }
      ]
    },
    {
      FareFamilyId: "R2FF1",
      FareFamilyName: "ECOSAVER",
      FareFamilyDescription: "ECO SAVER",
      ValidatingAirlineId: "EY",
      ServiceReferences: [
        { ServiceId: "R2FS1", ServiceStatusId: "INCLUD" },
        { ServiceId: "R2FS2", ServiceStatusId: "INCLUD" },
        { ServiceId: "R2FS3", ServiceStatusId: "INCLUD" }
      ]
    },
    {
      FareFamilyId: "R2FF2",
      FareFamilyName: "CLASSIC",
      FareFamilyDescription: "ECONOMY CLASSIC",
      ValidatingAirlineId: "VS",
      ServiceReferences: [
        { ServiceId: "R2FS14", ServiceStatusId: "INCLUD" },
        { ServiceId: "R2FS15", ServiceStatusId: "INCLUD" },
        { ServiceId: "R2FS16", ServiceStatusId: "INCLUD" }
      ]
    }
  ],
  FareFamilyServices: [
    {
      ServiceId: "R3FS1",
      ServiceName: "INC - CABIN BAG UPTO 23KG 56X45X25CM",
      AirlineIds: ["BA"]
    },
    {
      ServiceId: "R3FS2",
      ServiceName: "INC - HANDBAG UPTO 23KG 40X30X15CM",
      AirlineIds: ["BA"]
    },
    {
      ServiceId: "R3FS3",
      ServiceName: "INC - 1ST BAG MAX 23KG 51LB 208LCM",
      AirlineIds: ["BA"]
    },
    {
      ServiceId: "R2FS1",
      ServiceName: "30 PERCENT MILES EARNED",
      AirlineIds: ["EY"],
      ServiceClassificationId: "SRCSIZ",
      ServiceGroupId: "FSGPBF",
      ServiceSubGroupId: "FSGPFR"
    },
    {
      ServiceId: "R2FS2",
      ServiceName: "BEVERAGE",
      AirlineIds: ["EY"],
      ServiceClassificationId: "FLTRLD",
      ServiceGroupId: "FSMEAL",
      ServiceSubGroupId: "FSGPDR"
    },
    {
      ServiceId: "R2FS3",
      ServiceName: "ENTERTAINMENT",
      AirlineIds: ["EY"],
      ServiceClassificationId: "FLTRLD",
      ServiceGroupId: "INFLEN"
    },
    {
      ServiceId: "R2FS14",
      ServiceName: "HAND BAGGAGE",
      AirlineIds: ["VS"],
      ServiceClassificationId: "OTHERS",
      ServiceGroupId: "BAGGAG",
      ServiceSubGroupId: "FSGCAL"
    },
    {
      ServiceId: "R2FS15",
      ServiceName: "1ST BAG MAX 23KG",
      AirlineIds: ["VS"],
      ServiceClassificationId: "OTHERS",
      ServiceGroupId: "BAGGAG"
    },
    {
      ServiceId: "R2FS16",
      ServiceName: "MEALS AND DRINKS",
      AirlineIds: ["VS"],
      ServiceClassificationId: "FLTRLD",
      ServiceGroupId: "FSMEAL"
    }
  ],
  ServiceAttributes: [],
  ServiceStatuses: [
    { StatusId: "INCLUD", InternalStatusName: "Included" },
    { StatusId: "CHARGE", InternalStatusName: "At charge" },
    { StatusId: "NOFERD", InternalStatusName: "Not offered" }
  ],
  ServiceClassifications: [
    { TypeId: "SRCSIZ", TypeName: "" },
    { TypeId: "FLTRLD", TypeName: "Flight related. Must be associated to a flight" },
    { TypeId: "OTHERS", TypeName: "OTHERS" }
  ],
  ServiceGroups: [
    { TypeId: "FSMEAL", TypeName: "Meal" },
    { TypeId: "FSGSAA", TypeName: "Seat assignment association - desires seating together" },
    { TypeId: "BAGGAG", TypeName: "Baggage" },
    { TypeId: "FSGPBF", TypeName: "" },
    { TypeId: "INFLEN", TypeName: "Entertainment / Internet" },
    { TypeId: "OTHERS", TypeName: "OTHERS" }
  ],
  ServiceSubGroups: [
    { TypeId: "FSGPFR", TypeName: "" },
    { TypeId: "FSGPDR", TypeName: "" },
    { TypeId: "FSGCAL", TypeName: "Cascading allowed" },
    { TypeId: "FSGPUE", TypeName: "" },
    { TypeId: "FSGPIT", TypeName: "" },
    { TypeId: "FSGPRF", TypeName: "" },
    { TypeId: "FSGPVC", TypeName: "" },
    { TypeId: "OTHERS", TypeName: "OTHERS" }
  ],
  GlobalDistributionSystems: [
    { GdsId: "NDCABA", ExternalGdsName: "NDC British Airways" },
    { GdsId: "AMADWS", ExternalGdsName: "Amadeus" }
  ],
  Discounts: []
};

// Helper function to get flights by direction
export const getFlightsByDirection = (direction: 'outbound' | 'inbound'): MockFlight[] => {
  if (direction === 'outbound') {
    return mockLowFareResult.Flights.filter(flight => 
      flight.DepartureAirportId === 'LHR' || flight.DepartureAirportId === 'LGW' || flight.DepartureAirportId === 'STN'
    );
  } else {
    return mockLowFareResult.Flights.filter(flight => 
      flight.ArrivalAirportId === 'LHR' || flight.ArrivalAirportId === 'LGW' || flight.ArrivalAirportId === 'STN'
    );
  }
};

// Helper function to get recommendations by price range
export const getRecommendationsByPriceRange = (minPrice: number, maxPrice: number): MockRecommendation[] => {
  return mockLowFareResult.Recommendations.filter(rec => 
    rec.Total >= minPrice && rec.Total <= maxPrice
  );
};

// Helper function to get airline by ID
export const getAirlineById = (airlineId: string): MockAirline | undefined => {
  return mockLowFareResult.Airlines.find(airline => airline.AirlineId === airlineId);
};

// Helper function to get location by ID
export const getLocationById = (airportId: string): MockLocation | undefined => {
  return mockLowFareResult.Locations.find(location => location.AirportId === airportId);
}; 