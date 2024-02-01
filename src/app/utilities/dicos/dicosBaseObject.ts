import { Detection } from '../../../models/detection';

const _dicosBaseObject = {
  ImageType: ['ORIGINAL', 'PRIMARY', 'VOLUME', 'NONE'],
  SOPClassUID: '1.2.840.10008.5.1.4.1.1.501.2.1',
  SOPInstanceUID: '1.2.276.0.7230010.3.1.4.8323329.1130.1596485298.771161',
  StudyDate: '19700101',
  SeriesDate: '19700101',
  AcquisitionDate: '19700101',
  ContentDate: '19700101',
  AcquisitionDateTime: '19700101000000',
  StudyTime: '000000',
  SeriesTime: '000000',
  AcquisitionTime: '000000',
  ContentTime: '000000',
  Modality: 'DX',
  PresentationIntentType: 'FOR PROCESSING',
  Manufacturer: 'Rapiscan Systems',
  InstitutionName: 'Rapiscan Systems',
  InstitutionAddress: '2805 Columbia St, Torrance, CA 90503 U.S.A.',
  StationName: 'unknown',
  StudyDescription: 'Malibu v1.0',
  SeriesDescription: 'unknown',
  ManufacturerModelName: 'unknown',
  PatientName: 'unknown',
  PatientID: 'unknown',
  IssuerOfPatientID: 'Rapiscan Systems',
  TypeOfPatientID: 'TEXT',
  PatientBirthDate: 'unknown',
  PatientSex: 'U',
  KVP: '0',
  DeviceSerialNumber: '0000',
  SoftwareVersions: '0000',
  DistanceSourceToDetector: '0',
  DateOfLastCalibration: '19700101',
  TimeOfLastCalibration: '000000',
  DetectorType: 'DIRECT',
  DetectorConfiguration: 'SLOT',
  DetectorDescription: 'DetectorDesc',
  XRayTubeCurrentInuA: '0',
  TableSpeed: 1,
  StudyInstanceUID: '1.2.276.0.7230010.3.1.4.8323329.1130.1596485298.771162',
  SeriesInstanceUID: '1.2.276.0.7230010.3.1.4.8323329.1130.1596485298.771163',
  StudyID: 'Malibu v1.0',
  AcquisitionNumber: '0',
  ImagePositionPatient: [1, 1, 1],
  ImageOrientationPatient: [1, 0, 0, 0, 1, 0],
  SamplesPerPixel: 1,
  PhotometricInterpretation: 'MONOCHROME2',
  PlanarConfiguration: 0,
  NumberOfFrames: '1',
  Rows: 580,
  Columns: 508,
  BitsAllocated: 16,
  BitsStored: 16,
  HighBit: 15,
  PixelRepresentation: 0,
  BurnedInAnnotation: 'NO',
  PixelIntensityRelationship: 'LIN',
  PixelIntensityRelationshipSign: 1,
  RescaleIntercept: '0',
  RescaleSlope: '1',
  RescaleType: 'HU',
  LossyImageCompression: '00',
  AcquisitionContextSequence: {
    ConceptNameCodeSequence: {
      CodeMeaning: 0,
      CodeValue: 0,
      CodingSchemeDesignator: 0,
    },
  },
  AlgorithmRoutingCodeSequence: [],
  DetectorGeometrySequence: {
    DistanceSourceToDetector: 0.0,
    SourceOrientation: [1, 1, 1],
    SourcePosition: [1, 1, 1],
  },
  PresentationLUTShape: 'IDENTITY',
  OOIOwnerType: 'OwnerType',
  TDRType: 'OPERATOR',
  AlarmDecision: 'ALARM',
  NumberOfTotalObjects: 1,
  NumberOfAlarmObjects: 1,
  DICOSVersion: 'V02A',
  OOIType: 'BAGGAGE',
  OOISize: [1, 1, 1],
  AcquisitionStatus: 'SUCCESSFUL',
  ScanType: 'OPERATIONAL',
  BeltHeight: 0,
  // missing fields
  InstanceCreationDate: '',
  InstanceCreationTime: '',
  InstanceNumber: 0,
  ThreatSequence: {
    PotentialThreatObjectID: 0,
    PTORepresentationSequence: {
      ReferencedInstanceSequence: [
        {
          ReferencedSOPClassUID: '1.2.840.10008.5.1.4.1.1.501.2.1',
          ReferencedSOPInstanceUID:
            '1.2.276.0.7230010.3.1.4.8323329.1130.1596485298.771161',
        },
      ],
      ThreatROIVoxelSequence: [{}],
      BoundingPolygon: [0, 0, 0, 0, 0, 0],
    },
    ATDAssessmentSequence: {
      ThreatCategory: 'ANOMALY',
      ATDAbilityAssessment: 'SHIELD',
      ATDAssessmentFlag: 'THREAT',
      // missing fields
      ATDAssessmentProbability: 0,
      ThreatCategoryDescription: '',
    },
  },
  AlarmDecisionTime: '',
  ThreatDetectionAlgorithmandVersion: '',
};

export const buildDicosObject = (
  instanceNumber: number,
  detection: Detection,
) => {
  const today = new Date();
  const dd = String(today.getDate()).padStart(2, '0');
  const mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
  const yyyy = today.getFullYear();
  // Create the new dataset with fields required
  const dataset = structuredClone(_dicosBaseObject);
  dataset.InstanceCreationDate = `${mm}-${dd}-${yyyy}`;
  const instanceCreationTime = `${today.getHours()}:${today.getMinutes()}:${today.getSeconds()}`;
  dataset.InstanceCreationTime = instanceCreationTime;

  dataset.InstanceNumber = instanceNumber;

  const { binaryMask, boundingBox } = detection;
  if (binaryMask && binaryMask.length && binaryMask[0].length) {
    const maskPixelData = new Uint8Array(binaryMask[0]).buffer;
    dataset.ThreatSequence.PTORepresentationSequence.ThreatROIVoxelSequence = [
      {
        ThreatROIBase: [binaryMask[1][0], binaryMask[1][1], 0],
        ThreatROIExtents: [binaryMask[2][0], binaryMask[2][1], 0],
        ThreatROIBitmap: maskPixelData,
      },
    ];
  } else {
    dataset.ThreatSequence.PTORepresentationSequence.ThreatROIVoxelSequence = [
      {
        ThreatROIBase: [
          binaryMask?.length ? binaryMask[1][0] : 0,
          binaryMask?.length ? binaryMask[1][1] : 0,
          0,
        ],
        ThreatROIExtents: [
          binaryMask?.length ? binaryMask[2][0] : 0,
          binaryMask?.length ? binaryMask[2][1] : 0,
          0,
        ],
      },
    ];
  }
  // [x0, y0, z0, xf, yf, zf]
  dataset.ThreatSequence.PTORepresentationSequence.BoundingPolygon = [
    boundingBox[0],
    boundingBox[1],
    0,
    boundingBox[2],
    boundingBox[3],
    0,
  ];

  const { className, confidence, algorithm } = detection;
  dataset.ThreatSequence.ATDAssessmentSequence.ThreatCategoryDescription =
    className;
  dataset.ThreatSequence.ATDAssessmentSequence.ATDAssessmentProbability =
    confidence / 100;
  dataset.ThreatDetectionAlgorithmandVersion = algorithm;
  dataset.AlarmDecisionTime = instanceCreationTime;
  return dataset;
};
