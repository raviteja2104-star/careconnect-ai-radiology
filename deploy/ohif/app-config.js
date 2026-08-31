/**
 * OHIF Viewer app-config for the CareConnect docker-compose stack.
 * Mounted into the `ohif` service at /usr/share/nginx/html/app-config.js
 * (see docker-compose.yml).
 *
 * The data source points the BROWSER at Orthanc's DICOMweb API on the host
 * port published by the `orthanc` service (http://localhost:8042).
 *
 * PRODUCTION NOTE: in production this must NOT reference localhost — put
 * Orthanc behind the API gateway (single origin, TLS, authentication) and
 * point these roots at the gateway path instead, e.g.
 * https://gateway.example.com/pacs/dicom-web. That also sidesteps CORS:
 * Orthanc itself sends no CORS headers, so any cross-origin deployment
 * needs the gateway (or an nginx shim) to add them.
 */
window.config = {
  routerBasename: '/',
  showStudyList: true,
  extensions: [],
  modes: [],
  customizationService: {},
  defaultDataSourceName: 'orthanc',
  investigationalUseDialog: { option: 'never' },
  dataSources: [
    {
      namespace: '@ohif/extension-default.dataSourcesModule.dicomweb',
      sourceName: 'orthanc',
      configuration: {
        friendlyName: 'CareConnect Orthanc PACS',
        name: 'orthanc',
        // Orthanc DICOMweb plugin roots (ORTHANC__DICOM_WEB__* in compose)
        wadoUriRoot: 'http://localhost:8042/wado',
        qidoRoot: 'http://localhost:8042/dicom-web',
        wadoRoot: 'http://localhost:8042/dicom-web',
        qidoSupportsIncludeField: false,
        supportsReject: false,
        imageRendering: 'wadors',
        thumbnailRendering: 'wadors',
        enableStudyLazyLoad: true,
        supportsFuzzyMatching: false,
        supportsWildcard: true,
        staticWado: false,
        singlepart: 'bulkdata,video,pdf',
        omitQuotationForMultipartRequest: true, // Orthanc quirk: no quotes in multipart Accept
      },
    },
  ],
};
