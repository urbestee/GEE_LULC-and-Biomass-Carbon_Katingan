// ======================================================
// Land Cover, AGB & CO₂eq Monitoring in Katingan
// Objective: Classify land cover, estimate biomass, and quantify CO₂ emissions in Katingan
// Tools: Sentinel-2, Random Forest, NDVI, AGB regression, CO₂eq calculation
// Author: Bella Esti Ajeng Syahputri
// Platform: Google Earth Engine JavaScript API
// ======================================================

// 1. Area of Interest (AOI) and Base Data
var aoi = ee.FeatureCollection("projects/gee-bellaesti/assets/Katingan");
Map.centerObject(aoi, 8);
Map.addLayer(aoi, {}, 'Katingan AOI');

// 2. Sentinel-2 Image Collection (2023)
// Cloud masking function using the SCL band
function maskClouds(image) {
  var scl = image.select('SCL');
  var mask = scl.neq(3).and(scl.neq(8)).and(scl.neq(9)); // Shadows, clouds, cirrus
  return image.updateMask(mask);
}

// Retrieve and prepare Sentinel-2 imagery
var s2 = ee.ImageCollection('COPERNICUS/S2_SR')
  .filterBounds(aoi)
  .filterDate('2023-01-01', '2024-12-31')
  .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20))
  .map(maskClouds)
  .select(['B2', 'B3', 'B4', 'B8']) // Adjust bands as needed
  .median()
  .clip(aoi);
Map.addLayer(s2, {bands: ['B4', 'B3', 'B2'], min: 0, max: 3000}, 'Sentinel-2 RGB 2023');

// Create composite image and calculate NDVI
var ndvi = s2.normalizedDifference(['B8', 'B4']).rename('NDVI');
var compositeWithNDVI = s2.addBands(ndvi);

// 3. Training Samples (3 classes)
var forestPoints = ee.FeatureCollection([
  ee.Feature(ee.Geometry.Point(112.7825, -0.9654), {'landcover': 0}),
  ee.Feature(ee.Geometry.Point(113.5488, -2.6542), {'landcover': 0}),
  ee.Feature(ee.Geometry.Point(113.3946, -2.1199), {'landcover': 0}),
  ee.Feature(ee.Geometry.Point(113.2421, -2.4051), {'landcover': 0})
]);

var nonForestPoints = ee.FeatureCollection([
  ee.Feature(ee.Geometry.Point(112.6784, -1.1815), {'landcover': 1}),
  ee.Feature(ee.Geometry.Point(113.4187, -1.8808), {'landcover': 1}),
  ee.Feature(ee.Geometry.Point(113.5043, -1.8855), {'landcover': 1}),
  ee.Feature(ee.Geometry.Point(113.3895, -1.9039), {'landcover': 1})
]);

var waterPoints = ee.FeatureCollection([
  ee.Feature(ee.Geometry.Point(113.3188, -2.4862), {'landcover': 2}),
  ee.Feature(ee.Geometry.Point(113.2882, -3.1178), {'landcover': 2}),
  ee.Feature(ee.Geometry.Point(113.3915, -1.9103), {'landcover': 2}),
  ee.Feature(ee.Geometry.Point(112.6752, -1.1814), {'landcover': 2})
]);

var trainingPoints = forestPoints.merge(nonForestPoints).merge(waterPoints);
Map.addLayer(trainingPoints, {color: 'red'}, 'Training Points');

// 4. Land Cover Classification
var bands = ['B2', 'B3', 'B4', 'B8', 'NDVI'];
var training = compositeWithNDVI.sampleRegions({
  collection: trainingPoints,
  properties: ['landcover'],
  scale: 10
});

var classifier = ee.Classifier.smileRandomForest(100).train({
  features: training,
  classProperty: 'landcover',
  inputProperties: bands
});

var lulc = compositeWithNDVI.classify(classifier);

// 5. AGB Estimation (NDVI-based Regression)
var agb_ndvi = ndvi.multiply(150).add(50).max(0).rename("AGB");

// 6. Carbon Stock & CO2eq Estimation
var carbon = agb_ndvi.multiply(0.47).rename("CarbonStock");
var co2eq = carbon.multiply(3.67).rename("CO2eq");

// 7. Visualization
Map.addLayer(lulc, {min: 0, max: 2, palette: ['green', 'yellow', 'blue']}, "Land Cover");
Map.addLayer(ndvi, {min: 0, max: 1, palette: ['white', 'green']}, "NDVI");
Map.addLayer(agb_ndvi, {min: 0, max: 300, palette: ["white", "orange", "darkgreen"]}, "AGB");
Map.addLayer(co2eq, {min: 0, max: 1000, palette: ["white", "red", "darkred"]}, "CO2 Equivalent");

// 8. CO2eq Distribution Chart (Histogram)
var co2eqStats = co2eq.reduceRegion({
  reducer: ee.Reducer.mean()
            .combine(ee.Reducer.min(), '', true)
            .combine(ee.Reducer.max(), '', true)
            .combine(ee.Reducer.stdDev(), '', true),
  geometry: aoi.geometry(),
  scale: 10,
  maxPixels: 1e13
});

print('CO2eq Statistics (t/ha):', co2eqStats);

// Sample CO2eq values within AOI
var co2eqSamples = co2eq.sample({
  region: aoi.geometry(),
  scale: 10,
  numPixels: 5000,
  geometries: false
});

// Generate CO2eq histogram chart
var co2Chart = ui.Chart.feature.histogram({
  features: co2eqSamples,
  property: 'CO2eq',
  minBucketWidth: 20
})
.setOptions({
  title: 'Distribution of CO₂ Equivalent (CO₂eq) in Katingan AOI',
  hAxis: {title: 'CO₂eq (tCO₂)', minValue: 0, maxValue: 1000},
  vAxis: {title: 'Frequency'},
  colors: ['#d73027'],
  histogram: {bucketSize: 20}
});

print(co2Chart);

// 9. AGB Distribution Chart (Histogram)
var agbStats = agb_ndvi.reduceRegion({
  reducer: ee.Reducer.mean()
            .combine(ee.Reducer.min(), '', true)
            .combine(ee.Reducer.max(), '', true)
            .combine(ee.Reducer.stdDev(), '', true),
  geometry: aoi.geometry(),
  scale: 10,
  maxPixels: 1e13
});

print('AGB Statistics (t/ha):', agbStats);

var agbSamples = agb_ndvi.sample({
  region: aoi.geometry(),
  scale: 10,
  numPixels: 5000,
  geometries: false
});

var chart = ui.Chart.feature.histogram({
  features: agbSamples,
  property: 'AGB',
  minBucketWidth: 5
})
.setOptions({
  title: 'Distribution of Above Ground Biomass (AGB) in Katingan AOI',
  hAxis: {title: 'AGB (t/ha)', minValue: 0, maxValue: 300},
  vAxis: {title: 'Frequency'},
  colors: ['#1b9e77'],
  histogram: {bucketSize: 5}
});

print(chart);

// ===================
// 10. Export Section (optional)
// ===================
// Export.image.toDrive({
//   image: co2eq,
//   description: "CO2eq_2023",
//   folder: "kalimantan_export",
//   region: aoi.geometry(),
//   scale: 30,
//   maxPixels: 1e13
// });

// 11. Combined Legend (Discrete Land Cover + NDVI + AGB & CO2eq Scales)

// Function to create a discrete legend row
function makeLegendRow(color, label) {
  var colorBox = ui.Label('', {
    backgroundColor: color,
    padding: '8px',
    margin: '0 0 4px 0',
    border: '1px solid black'
  });

  var description = ui.Label(label, {
    margin: '0 0 4px 6px'
  });

  return ui.Panel({
    widgets: [colorBox, description],
    layout: ui.Panel.Layout.Flow('horizontal')
  });
}

// Function to create a color bar legend
function createColorBar(palette, min, max, title) {
  var colorBar = ui.Thumbnail({
    image: ee.Image.pixelLonLat().select(0)
      .multiply((max - min) / 100.0)
      .add(min)
      .int()
      .visualize({min: min, max: max, palette: palette}),
    params: {bbox: [0, 0, 100, 10], dimensions: '100x10'},
    style: {stretch: 'horizontal', margin: '0px 8px', maxHeight: '20px'}
  });

  var legendLabels = ui.Panel({
    widgets: [
      ui.Label(min.toString(), {margin: '4px 8px'}),
      ui.Label(max.toString(), {margin: '4px 8px', textAlign: 'right', stretch: 'horizontal'})
    ],
    layout: ui.Panel.Layout.flow('horizontal')
  });

  return ui.Panel({
    widgets: [
      ui.Label(title, {fontWeight: 'bold', margin: '8px 0 4px 0'}),
      colorBar,
      legendLabels
    ]
  });
}

// Main legend panel
var fullLegend = ui.Panel({
  style: {
    position: 'bottom-left',
    padding: '8px 15px',
    width: '260px'
  }
});

// Land Cover (Discrete)
fullLegend.add(ui.Label('Land Cover', {
  fontWeight: 'bold',
  fontSize: '14px',
  margin: '0 0 6px 0'
}));
fullLegend.add(makeLegendRow('green', 'Forest'));
fullLegend.add(makeLegendRow('yellow', 'Non-Forest'));
fullLegend.add(makeLegendRow('blue', 'Water'));

// NDVI (Discrete or Scaled)
fullLegend.add(ui.Label('NDVI', {
  fontWeight: 'bold',
  margin: '8px 0 4px 0'
}));
fullLegend.add(makeLegendRow('white', 'Low NDVI'));
fullLegend.add(makeLegendRow('green', 'High NDVI'));

// AGB Color Scale Legend
fullLegend.add(createColorBar(
  ['white', 'orange', 'darkgreen'],
  0, 300,
  'Above Ground Biomass (t/ha)'
));

// CO2eq Color Scale Legend
fullLegend.add(createColorBar(
  ['white', 'red', 'darkred'],
  0, 1000,
  'CO2 Equivalent (tCO₂)'
));

// Add the full legend to the map
Map.add(fullLegend);
