# Land Cover, AGB & CO₂eq Monitoring in Katingan (2023)

This project utilizes Google Earth Engine (GEE) to analyze land cover, estimate Above Ground Biomass (AGB), and calculate CO₂ equivalent emissions in Katingan, Central Kalimantan, Indonesia, using Sentinel-2 imagery from 2023.

## Area of Interest (AOI)

- Region: Katingan, Central Kalimantan, Indonesia
- Coordinates: As defined in the GEE asset `projects/gee-bellaesti/assets/Katingan`

## Data Sources

- Satellite Imagery: Sentinel-2 Surface Reflectance (`COPERNICUS/S2_SR`)
- Timeframe: January 1, 2023 – December 31, 2023
- Resolution: 10 meters

## Methodology

### 1. Cloud Masking
Applied cloud and shadow masking using the Scene Classification Layer (SCL) band to filter out cloudy pixels.

### 2. NDVI Calculation
Computed the Normalized Difference Vegetation Index (NDVI) using bands B8 (NIR) and B4 (Red).

### 3. Land Cover Classification
- Classes:
  - Forest (0)
  - Non-Forest (1)
  - Water (2)
- Algorithm: Random Forest with 100 trees
- Training Data: Manually selected sample points for each class

### 4. AGB Estimation
Estimated AGB using a linear regression model based on NDVI:
AGB = (NDVI × 150) + 50

### 5. Carbon Stock & CO₂ Equivalent
- Carbon Stock: 47% of AGB
- CO₂ Equivalent: Carbon Stock × 3.67

### 6. Visualization
Generated maps for:
- Land Cover
- NDVI
- AGB
- CO₂ Equivalent
Included legends and color scales for interpretation.

### 7. Statistical Analysis
Produced histograms and calculated statistics (mean, min, max, standard deviation) for AGB and CO₂ equivalent distributions.

## Results
- Land Cover Map: Differentiates forest, non-forest, and water bodies.
- AGB Map: Highlights areas with varying biomass densities.
- CO₂ Equivalent Map: Illustrates carbon sequestration potential across the region.

## References
1. Saatchi, S. S., et al. (2011). Estimation of tropical rain forest aboveground biomass with small-footprint lidar and hyperspectral data. *Remote Sensing of Environment*, 115(11), 2931-2942. [Link](https://www.sciencedirect.com/science/article/abs/pii/S0034425711001404)
2. IPCC (2006). 2006 IPCC Guidelines for National Greenhouse Gas Inventories. [Link](https://www.ipcc-nggip.iges.or.jp/public/2006gl/)
3. Mitchard, E. T. A., et al. (2013). Uncertainty in the spatial distribution of tropical forest biomass: a comparison of pan-tropical maps. *Carbon Balance and Management*, 8(1), 10. [Link](https://cbmjournal.biomedcentral.com/articles/10.1186/1750-0680-8-10)


