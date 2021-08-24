import { createConverter } from "convert-svg-to-png"
import * as D3Node from "d3-node"
import { d3 } from "d3-node"
import * as fs from "fs"
import { Feature, FeatureCollection, GeoJSON } from "geojson"
import * as sharp from "sharp"

// Set up global variables which can be changed
const width = 256
const height = 256
const geojsonDirectory = './geojsons'
const outputDirectory = './images'
const colors = [
  { minDepth: 0.0, maxDepth: 0.5, code: "rgb(240, 250, 255)"},
  { minDepth: 0.5, maxDepth: 1.0, code: "rgb(210, 225, 240)"},
  { minDepth: 1.0, maxDepth: 1.5, code: "rgb(180, 200, 225)"},
  { minDepth: 1.5, maxDepth: 2.0, code: "rgb(150, 175, 210)"},
  { minDepth: 2.0, maxDepth: 2.5, code: "rgb(120, 150, 195)"},
  { minDepth: 2.5, maxDepth: 3.0, code: "rgb(90, 125, 180)"},
  { minDepth: 3.0, maxDepth: 3.5, code: "rgb(60, 100, 165)"},
  { minDepth: 3.5, maxDepth: 4.0, code: "rgb(30, 75, 150)"},
  { minDepth: 4.0, maxDepth: 4.5, code: "rgb(0, 50, 135)"},
  { minDepth: 4.5, maxDepth: 5.0, code: "rgb(0, 25, 120)"},
  { minDepth: 5.0, maxDepth: 5.5, code: "rgb(0, 0, 105)"},
  { minDepth: 5.5, maxDepth: 6.0, code: "rgb(0, 0, 90)"},
  { minDepth: 6.0, maxDepth: 6.5, code: "rgb(0, 0, 75)"},
  { minDepth: 6.5, maxDepth: 7.0, code: "rgb(0, 0, 60)"},
  { minDepth: 7.0, maxDepth: 7.5, code: "rgb(0, 0, 45)"},
  { minDepth: 7.5, maxDepth: 8.0, code: "rgb(0, 0, 30)"},
  { minDepth: 8.0, maxDepth: 8.5, code: "rgb(0, 0, 15)"},
]
class Tile {
  zoom: number
  x: number
  y: number
  geoJSON: FeatureCollection

  constructor(zoom: number, x: number, y: number, geoJSON: FeatureCollection) {
    this.zoom = zoom
    this.x = x
    this.y = y
    this.geoJSON = geoJSON
  }
}
const convertSvgFiles = async (tile: Tile) => {
  // Add map tile's four corners to GeoJSON features
  const west = tile.x / Math.pow(2.0, tile.zoom) * 360.0 - 180.0
  const east = (tile.x + 1) / Math.pow(2.0, tile.zoom) * 360.0 - 180.0
  const n = Math.PI - 2.0 * Math.PI * tile.y / Math.pow(2.0, tile.zoom)
  const north = 180.0 / Math.PI * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)))
  const m = Math.PI - 2.0 * Math.PI * (tile.y + 1) / Math.pow(2.0, tile.zoom)
  const south = 180.0 / Math.PI * Math.atan(0.5 * (Math.exp(m) - Math.exp(-m)))
  const feature = {
    type: "Feature",
    geometry: {
      type: "MultiPoint",
      coordinates: [[west,north],[west,south],[east,south],[east,north],[west,north]]
    }
  } as Feature
  const features = tile.geoJSON.features.concat([feature])

  // Entry point into main convert GeoJSON to PNG function
  const converter = createConverter()

  // Using the FeatureCollection, center the region with the selected geographic projection
  const projection = d3.geoMercator()
    .fitSize([width, height], {
      "type": "FeatureCollection",
      "features": features//tile.geoJSON.features
    })
  const geoPath = d3.geoPath(projection)
 
  // Go through each feature, or constituency, within the region, 
  // and render it as SVG with the feature highlighted
  // const svgString = await renderSVG(tile, geoPath)
  const svgString = await renderSVG(features, geoPath)
  try {
    // Using the `sharp` library, take the rendered SVG string and generate a PNG
    await sharp(Buffer.from(svgString))
      .extract({
        left: 0, 
        top: 0, 
        width: width, 
        height: height
      })
      .png()
      .toFile(`${outputDirectory}/${tile.zoom}.${tile.x}.${tile.y}.png`)
  } catch (err) {
    console.error(err)
  }
  await converter.destroy()
}

const renderSVG = async (features, geoPath) => {
  // Use D3 on the back-end to create an SVG of the FeatureCollection
  const svgString = features
    .map(feature => {
      const d3N = new D3Node()
      let color = "rgba(0,0,0,0)"
      if (feature.properties && feature.properties.maxDepth && feature.properties.minDepth) {
        const averageDepth = (feature.properties.maxDepth + feature.properties.minDepth) / 2.0
        color = colors.find(color => averageDepth >= color.minDepth && averageDepth <= color.maxDepth).code
      }
      const svg = d3N.createSVG(width, height)
      svg
        .selectAll("path")
        .data([feature])
        .enter()
        .append("path")
        .style("fill", color)
        .style("shape-rendering", "crispEdges")
        .style("stroke", color)
        .style("stroke-width", "1px")
        .attr("d", geoPath)
      return d3N.svgString()
       .replace('<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256">', "")
       .replace("</svg>", "")
    })
    .reduce((a, b) => { return a + b })

  return `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256">${svgString}</svg>`
}

const createTiles = async () => {
  const tiles = fs.readdirSync(geojsonDirectory)
    .filter((value) => { return value.endsWith('.geojson') })
    .filter((value) => { return value.split('.').length === 4 })
    .map((value) => {
      const components = value.split('.')
      const geoJSON = JSON.parse(fs.readFileSync(`${geojsonDirectory}/${value}`,'utf8')) as FeatureCollection
      return new Tile(parseInt(components[0]), parseInt(components[1]), parseInt(components[2]), geoJSON)
    })
  for (let tile of tiles) {
    await convertSvgFiles(tile)
  }
  process.exit()
}
createTiles()
  .catch((reason) => { console.log(reason) })
  .finally(() => { console.log("done") })