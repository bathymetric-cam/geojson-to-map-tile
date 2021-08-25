# geojson-to-maptile

geojson-to-maptile is a tool converting depth contour into GeoJSON into map tile png image.

Source GeoJSON file

<img width="486" alt="16 57508 25958 geojson" src="https://user-images.githubusercontent.com/225808/130753981-62565318-fe87-4062-98c4-eade257de445.png">

Output png file

![converted image](https://user-images.githubusercontent.com/225808/130754091-26da145a-a2a3-4ecd-a37c-96e63612cd9c.png)

## Prerequisite

Make sure you have GeoJSON file whose features have the following properties.

| property | format          | description                  |
| -------- | --------------- | ---------------------------- |
| maxDepth | Floating Number | Maximum depth in the feature |
| minDepth | Floating Number | Minimum depth in the feature |

Here is a sample json file.

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": { "maxDepth": 2.0, "minDepth": 1.5 },
      "geometry": { "type": "MultiPolygon", "coordinates": ... }
    },
    ...
  ]
}
```

The files have to be named `${zoom}.${x}.${y}.geojson`.
The `zoom`, `x`, and `y` are based on the [tile system](https://wiki.openstreetmap.org/wiki/Slippy_map_tilenames).

## Quick Start

1. **Install via yarn**

```shell
yarn install
```

2. **Create convert-config.json**

Create convert-config.json on the base directory.

Here is an example `convert-config.json`.

```json
{
  "geojsonDirectory": "./geojsons",
  "outputDirectory": "./images",
  "outputWidth": 256,
  "outputHeight": 256,
  "colors": [
    { "minDepth": 0.0, "maxDepth": 0.5, "code": "rgb(240, 250, 255)"},
    { "minDepth": 0.5, "maxDepth": 1.0, "code": "rgb(210, 225, 240)"},
    { "minDepth": 1.0, "maxDepth": 1.5, "code": "rgb(180, 200, 225)"},
    { "minDepth": 1.5, "maxDepth": 2.0, "code": "rgb(150, 175, 210)"},
    { "minDepth": 2.0, "maxDepth": 2.5, "code": "rgb(120, 150, 195)"},
    { "minDepth": 2.5, "maxDepth": 3.0, "code": "rgb(90, 125, 180)"},
    { "minDepth": 3.0, "maxDepth": 3.5, "code": "rgb(60, 100, 165)"},
    { "minDepth": 3.5, "maxDepth": 4.0, "code": "rgb(30, 75, 150)"},
    { "minDepth": 4.0, "maxDepth": 4.5, "code": "rgb(0, 50, 135)"},
    { "minDepth": 4.5, "maxDepth": 5.0, "code": "rgb(0, 25, 120)"},
    { "minDepth": 5.0, "maxDepth": 5.5, "code": "rgb(0, 0, 105)"},
    { "minDepth": 5.5, "maxDepth": 6.0, "code": "rgb(0, 0, 90)"},
    { "minDepth": 6.0, "maxDepth": 6.5, "code": "rgb(0, 0, 75)"},
    { "minDepth": 6.5, "maxDepth": 7.0, "code": "rgb(0, 0, 60)"},
    { "minDepth": 7.0, "maxDepth": 7.5, "code": "rgb(0, 0, 45)"},
    { "minDepth": 7.5, "maxDepth": 8.0, "code": "rgb(0, 0, 30)"},
    { "minDepth": 8.0, "maxDepth": 8.5, "code": "rgb(0, 0, 15)"}
  ]
}
```

| config           | format            | description |
| ---------------- | ----------------- | ----------- |
| geojsonDirectory | String            | Directory you place the source GeoJSON files |
| outputDirectory  | String            | Directory you save the output png files |
| outputWidth      | Int Number        | Output image's width |
| outputHeight     | Int Number        | Output Image's height |
| colors           | Array<Dictionary> | Array of output image's coloring settings |

3. **Convert GeoJSON into png files**

Run the command below to convert.

```shell
yarn convert
```