# Above-ground biomass (AGB) estimation for coffee crops
This project stores the scripts and supplementary materials for coffee above-ground biomass estimation developed during my Master's degree.
- Folder scripts contains:
1. A Google Earth Engine (GEE) code for classification in UAV imagery, separating only coffee (the class of interest in this study) to export the selected bands to Google Drive;
2. A Google Colab Notebook that uses the image exported from GEE to perform regressions between AGB field samples and the UAV imagery using different Session ids (seeds) to mantain the reproducibility and tracking of the best model that fits the data and then performs a spatial prediction of AGB values.
- Folder supplementary materials:
1. Contains the csv files generated from the compare of various possibilities between the AGB field and predicted AGB;
2. Figures used in the article.

# The data used to support the findings of this study are available upon reasonable request.

