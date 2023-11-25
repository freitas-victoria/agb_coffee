var area_estudo = ee.FeatureCollection('projects/ee-serradosalitre/assets/quadrados_cafe_ref')


var rgb = {"opacity":1,"bands":["b3","b2","b1"],"min":61,"max":52604,"gamma":1},
    nrrd = {"opacity":1,"bands":["b4","b3","b5"],"min":61,"max":52604,"gamma":1};

var palettes = require('users/gena/packages:palettes');

var chmp = palettes.colorbrewer.BrBG[5]
var dsmp = palettes.colorbrewer.RdYlGn[5]

var dsm = ee.Image('projects/ee-serradosalitre/assets/cafe_ref_dsm').rename("DSM")
var dtm= ee.Image('projects/ee-serradosalitre/assets/cafe_ref_dtm').rename("DTM")
var temp = ee.Image('projects/ee-serradosalitre/assets/serra_salitre_mg_cafe1_120m_230822_index_temperatura').rename("temp_index")

var chm = dsm.subtract(dtm).rename('CHM')
var chm2 = chm.expression('b("CHM") < 0 ? 0 : b("CHM")')
//var chm2 = chm.updateMask(mascara1)

print(chm2)


Map.addLayer(chm2, {min:0.30, max:4, palette:chmp}, 'CHM', false)
Map.addLayer(dsm, {min:1181, max:1231, palette:dsmp}, 'DSM',false)

Map.centerObject(dsm)

var nicfi = ee.ImageCollection('projects/planet-nicfi/assets/basemaps/americas')
var basemap= nicfi.filter(ee.Filter.date('2021-01-01','2022-08-30'))//.first();

var cenapl = basemap.map(
    function(img){return img.clip(area_estudo)}
  )
  
print(cenapl)
//Map.addLayer(cenapl,{},'cena planet')

//var area1 = ee.FeatureCollection() // poligono
//var area2 = ee.FeatureCollection() //poigono

var rfNTrees = 250; //Number of random trees;
var rfBagFraction = 0.5; //Fraction (10^-2%) of variables in the bag;
var rfVarPersplit = 6 //Number of varibales per tree branch;


var coffee = ee.Image("projects/ee-serradosalitre/assets/ortofoto_cafe_ref");
var mascara2 = coffee.gt(0)
var cafe = coffee.updateMask(mascara2) // b1 - b | b2 - g| b3 - r| b4 - nir| b5 - rededge  

Map.addLayer(cafe,{},'Café 1',false)
print(cafe,'café 1')

var cena = function(img){
  // add index
  var ndvi = img.expression("(b('b4')-b('b3'))/(b('b4')+b('b3'))").rename('ndvi') // nir e r
  var ndviB = img.expression("(b('b3')-b('b1'))/(b('b3')+b('b1'))").rename('ndviB') // r e b
  var savi = img.expression("1.5*(b('b4')-b('b3'))/(b('b4')+b('b3')-0.5)").rename('savi') // nir e r
  var vari = img.expression("(b('b2')-b('b3'))/(b('b2')+b('b3')-b('b1'))").rename('vari') //g, r, b Visible Atmospherically Resistant Index
  var EXG = img.expression("(2*b('b2'))-(b('b3')+b('b1'))").rename('EXG') 
  var TGI = img.expression("(b('b2')-0.39)*(b('b3')-0.61)*b('b1')").rename('TGI')
  var GLI = img.expression("(b('b2')*2-b('b5')-b('b1'))/(b('b2')*2+b('b5')+b('b1'))").rename('GLI')
  var Rdvi = img.expression("(b('b4')-b('b3'))/sqrt(b('b4')+b('b3'))").rename('Rdvi')
  var TVDI = img.expression("1.5*(b('b4')-b('b3'))/sqrt((b('b4')**2+b('b3')+0.5))").rename('TVDI')
  var Osavi = img.expression("((b('b5')-b('b3'))-0.2*(b('b5')-b('b2'))*(b('b5')/b('b3')))/((1+0.16)*(b('b4')-b('b3')))/(b('b4')+b('b3')+0.16)").rename('Osavi')
  var EVI = img.expression("2.5*(b('b4')-b('b3'))/(b('b4')+6*b('b3')-7.5*b('b1')+1)").rename('EVI')
  var ndre = img.expression("(b('b4')-b('b5'))/(b('b4')+b('b5'))").rename('ndre')
  var gndvi = img.expression("(b('b4')-b('b2'))/(b('b4')+b('b2'))").rename('gndvi')
  var ccci = img.expression("( (b('b4')-b('b5'))/(b('b4')+b('b5')) ) /  ((b('b4')-b('b3')) / (b('b4')+b('b3')) )").rename('ccci')
 
 
  return img = img.addBands([ndvi, ndviB, savi, vari, EXG, TGI, GLI, Rdvi, 
                             TVDI, ndre, gndvi])
                            }

var cafecena = cena(cafe)


Map.addLayer(cafecena, nrrd,'cena café', false)
print('cena café', cafecena)

var indices_pl = cenapl.map(function(img2){
    var ndvi_pl = img2.expression("(b('N')-b('R'))/(b('N')+b('R'))").rename('ndvi_pl')
    var ndviB_pl = img2.expression("(b('R')-b('B'))/(b('R')+b('B'))").rename('ndviB_pl') 
    var GLI_pl = img2.expression("(b('G')*2-b('R')-b('B'))/(b('G')*2+b('R')+b('B'))").rename('GLI_pl')

return img2 = img2.addBands([ndvi_pl, ndviB_pl, GLI_pl])
                            })
     
var cena_min = indices_pl.reduce(ee.Reducer.min())
var cena_max = indices_pl.reduce(ee.Reducer.max())
var std = indices_pl.reduce(ee.Reducer.stdDev())


var square = ee.Kernel.square({radius: 2});
var entropia = cafecena.select('b5').toInt32().entropy(square);
//Map.addLayer(entropia,{},'entropia')

var glcm = cafecena.select('b5').rename('NIR').glcmTexture({size: 2});
//print(glcm)
var contrast = glcm.select('NIR_contrast');
//Map.addLayer(contrast, {}, 'contrast')



var bigcena = cafecena
  .addBands(chm)
  .addBands(dsm)
  .addBands(dtm).clip(geometry)
  .addBands(glcm)
  .addBands(contrast)
  //.addBands(cena_min)
  //.addBands(cena_max)
   //.addBands(std)
  
  
print('cena completa',bigcena)
Map.addLayer(bigcena,rgb, 'bigcena')



var bands = bigcena.bandNames()
var classe = 'class_n'


var features1 = cafe_ref.merge(solo).merge(arb).merge(graminea).merge(veg_n_arb).merge(sombra)
//.merge(cafe_seco).merge(cons)
//.merge(estrada).merge(cafeseco).merge(nan).
var features1 = features1.filter(ee.Filter.bounds(geometry))
print('amostras', features1)
  
var palette = ee.Dictionary({
                 '1':'#c5752a', // cafe
                '2':'#ffcccc', // solo exposto
                '3':'#1c8406', // arb
                '4':'#e4e349', // graminea
               // '5':'#8b0a00', // construcao
                '6':'#b2dc95', // veg nao arb
                '7':'#ffffff',//sombra
               // '8':'#694228',
                    });

var image = features1
  .map(function (feature) {
    // Add a style-dictionary property using our chosen palette
    return feature.set('myStyle', {
      'color': palette.get(feature.get('class_n')),
    });
  })
  .style({
    'styleProperty': 'myStyle',
  });



var withRandom = features1.filter(ee.Filter.neq('class_n', null))
  .randomColumn('random');
  
//Queremos reservar alguns dos dados para teste, para evitar overfitting do modelo.
var split = 0.7;  // Aproximadamente 80% treinando, 20% testando.

var trainingPartition = withRandom.filter(ee.Filter.lt('random', split));
print('trainingPartition',trainingPartition)
var testingPartition = withRandom.filter(ee.Filter.gte('random', split));
print('testingPartition',testingPartition)

var training = bigcena.select(bands).sampleRegions({
  collection: trainingPartition,
  properties: ['class_n'],
  scale: 0.05,
  tileScale: 16
 });
 
var testing = bigcena.select(bands).sampleRegions({
  collection: testingPartition,
  properties: ['class_n'],
  scale: 0.05,
  tileScale: 16
 });
 
 var withRandom = training.randomColumn('random');
print('Com Random',withRandom)

var withRandom_2 = testing.randomColumn('random');
print('Com Random',withRandom)
  
var withRandom = training.randomColumn('random');
print('Com Random',withRandom)

//var withRandom_2 = training2.randomColumn('random');
//print('Com Random',withRandom)

//Queremos reservar alguns dos dados para teste, para evitar overfitting do modelo.
var split = 0.7;  // Aproximadamente 80% treinando, 20% testando.
var trainingPartition = withRandom.filter(ee.Filter.lte('random', split));
print('trainingPartition',trainingPartition)
var testingPartition = withRandom_2.filter(ee.Filter.lte('random', split));
print('testingPartition',testingPartition)
  
var trainedClassifier = ee.Classifier
  .smileRandomForest(rfNTrees,rfVarPersplit, 1, rfBagFraction)
  .setOutputMode('CLASSIFICATION')
  .train({
  features: trainingPartition,
  classProperty: 'class_n',
  inputProperties: bands
});

var test = testingPartition.classify(trainedClassifier);

var confusionMatrix = test.errorMatrix(classe, 'classification');
print('Confusion Matrix', confusionMatrix);

var confMatrix = trainedClassifier.confusionMatrix()
var OA = confMatrix.accuracy()
var CA = confMatrix.consumersAccuracy()
var Kappa = confMatrix.kappa()
var PA = confMatrix.producersAccuracy()
var Order = confMatrix.order()

print(confMatrix,'Matriz de Confusão')
print(OA,'Acurácia geral da validação:')
print(Kappa,'Kappa ')
print(CA,'Acurácia do Consumidor ')
print(PA,'Acurácia do Produtor ')

//Imprima algumas informações sobre o classificador
print('Random Forest, explained', trainedClassifier.explain());

var classificado =  bigcena.select(bands).classify(trainedClassifier);

print(classificado.int8())

Map.addLayer(classificado, {min: 1, max: 6, palette: [
  '#a54c1b',//1 cafe
  '#1fbf19',  //2 arvore
  '#f08f90',//3 solo
  '#ffd06c',//4 graminea
  //'red', //5 construcao
  '#b2dc95', //6 estrada
  '#000000', // 7 sombra
 // '#694228', // 8  cafe secagem
  //'#879aff', // 9 nan
    ]},'Classificação Supervisionada', false);
    
    
    
/** Filter  ***/


var kernel = ee.Kernel.manhattan(3)
var fmajority = classificado.reduceNeighborhood({
  reducer:ee.Reducer.mode(),
  kernel:kernel
}) 


Map.addLayer(fmajority, {min: 1, max: 6, palette: [
  '#a54c1b',//1 cafe
  '#f08f90',//2 solo
  '#1fbf19',  //3 arvore
  '#ffd06c',//4 graminea
  //'red', //5 construcao
  '#b2dc95', //6 veg n arb
  '#000000', // 7 sombra
 // '#694228', // 8  cafe secagem
  //'#879aff', // 9 nan
    ]},'Classificação Supervisionada fmajority');
    
    
    
Map.addLayer(image, {}, 'amostras');
   
var cena2 = function(img){
  // add index
  var ndvi = img.expression("(b('b4')-b('b3'))/(b('b4')+b('b3'))").rename('ndvi') // nir e r
  var ndviB = img.expression("(b('b3')-b('b1'))/(b('b3')+b('b1'))").rename('ndviB') // r e b
  var savi = img.expression("1.5*(b('b4')-b('b3'))/(b('b4')+b('b3')-0.5)").rename('savi') // nir e r
  var vari = img.expression("(b('b2')-b('b3'))/(b('b2')+b('b3')-b('b1'))").rename('vari') //g, r, b Visible Atmospherically Resistant Index
  var EXG = img.expression("(2*b('b2'))-(b('b3')+b('b1'))").rename('EXG') 
  var TGI = img.expression("(b('b2')-0.39)*(b('b3')-0.61)*b('b1')").rename('TGI')
  var GLI = img.expression("(b('b2')*2-b('b5')-b('b1'))/(b('b2')*2+b('b5')+b('b1'))").rename('GLI')
  var Rdvi = img.expression("(b('b4')-b('b3'))/sqrt(b('b4')+b('b3'))").rename('Rdvi')
  var TVDI = img.expression("1.5*(b('b4')-b('b3'))/sqrt((b('b4')**2+b('b3')+0.5))").rename('TVDI')
  var Osavi = img.expression("((b('b5')-b('b3'))-0.2*(b('b5')-b('b2'))*(b('b5')/b('b3')))/((1+0.16)*(b('b4')-b('b3')))/(b('b4')+b('b3')+0.16)").rename('Osavi')
  var EVI = img.expression("2.5*(b('b4')-b('b3'))/(b('b4')+6*b('b3')-7.5*b('b1')+1)").rename('EVI')
  var ndre = img.expression("(b('b4')-b('b5'))/(b('b4')+b('b5'))").rename('ndre')
  var gndvi = img.expression("(b('b4')-b('b2'))/(b('b4')+b('b2'))").rename('gndvi')
  var ccci = img.expression("( (b('b4')-b('b5'))/(b('b4')+b('b5')) ) /  ((b('b4')-b('b3')) / (b('b4')+b('b3')) )").rename('ccci')
 
 
  return img = img.addBands([ ndvi ,
                              ndviB,
                              savi ,
                              vari ,
                              EXG ,
                              TGI ,
                              GLI ,
                              Rdvi ,
                              TVDI ,
                              Osavi,
                              EVI ,
                              ndre ,
                              gndvi,
                              ccci ])
                            }
                            
var cafecena_export = cena2(cafe)
var bigcena_to_exp = cafecena_export
  .addBands(chm)
  .addBands(dsm)
  .addBands(dtm)
var vectors = fmajority.addBands(classificado).reduceToVectors({
  geometry: geometry2,
  crs: geometry2.projection(),
  scale: 0.25,
  geometryType: 'polygon',
  eightConnected: true,
  labelProperty: 'classe',
  reducer: ee.Reducer.allNonZero(),
  tileScale:16,
  maxPixels:10e10
}); 
var cafev = vectors.filter('classe==1')
Map.addLayer(cafev,{},'vetor de cafe')

var polygonArea = cafev.geometry().area({proj:'EPSG:5880','maxError': 1});
print('área de cafe',polygonArea.divide(10000)) 

var totalArea = geometry2.area({proj:'EPSG:5880','maxError': 1});
print('área de cafe total',totalArea.divide(10000))

  Export.table.toAsset({
 collection: features1,
 description:'amostras_salitre2'
});

var classificado_export = fmajority.clip(cafev)

var big_export = bigcena.clip(cafev).toFloat()

var bigall_to_exp_clip = bigcena_to_exp.clip(cafev).toFloat()
print(bigall_to_exp_clip)
Map.addLayer(classificado_export,{},'class export')
Map.addLayer(big_export,{},'big_export')

var list_grid = area_estudo.aggregate_array('id').getInfo()


for (var i=0; i < list_grid.length;i++){
  var id = list_grid[i]
  var geometry= area_estudo.filter(ee.Filter.eq('id',id))
  Export.image.toDrive({
    image: bigall_to_exp_clip.clip(geometry),
    description: 'big_all_caferef_'+String(i),
    folder:'gee_biomassa',
    region: geometry,
    scale:0.05,
    crs: 'EPSG:32723',
    maxPixels: 1e13
  })
} 

 
  Export.image.toDrive({
  image:bigall_to_exp_clip.toFloat(),
  description:'bigall_to_exp_clip_caferef',
  scale:0.05,
  folder: 'gee_biomassa',
  region:area_estudo,
  maxPixels:1e13, 
  shardSize: 1000,
  crs: 'EPSG:32723'
})

Export.image.toDrive({
  image:bigcena.toFloat(),
  description:'bigcena_export_caferef',
  scale:0.05,
  folder: 'gee_biomassa',
  region:area_estudo,
  maxPixels:1e13, 
  shardSize: 1024,
  crs: 'EPSG:32723',
})

  Export.image.toDrive({
  image:classificado_export,
  description:'classificado_caferef',
  scale:0.05,
  folder: 'gee_biomassa',
  region:area_estudo,
  maxPixels:1e13, 
  shardSize: 1024,
  crs: 'EPSG:32723',
})

for (var i=0; i < list_grid.length;i++){
  var id = list_grid[i]
  var geometry= area_estudo.filter(ee.Filter.eq('id',id))
  Export.image.toDrive({
    image: chm.clip(geometry),
    description: 'CHM_caferef'+String(i),
    folder:'gee_biomassa',
    region: geometry,
    scale:0.05,
    crs: 'EPSG:32723',
    maxPixels: 1e13
  })
} 

Export.table.toDrive(cafev, 'teste_cafev_caferef', 'SHP')

Map.addLayer(area_estudo)