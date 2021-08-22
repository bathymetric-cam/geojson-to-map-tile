import { createConverter } from "convert-svg-to-png"
import * as D3Node from "d3-node"
import { d3 } from "d3-node"
import * as fs from "fs"
import { FeatureCollection, GeoJSON } from "geojson"
import * as sharp from "sharp"

// Set up global variables which can be changed
const width = 256
const height = 256
const fileDirectory = './geojsons'

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
  // Entry point into main convert GeoJSON to PNG function
  const converter = createConverter()

  // Using the FeatureCollection, center the region with the selected geographic projection
  const projection = d3.geoMercator()
    .fitSize([width, height], {
      "type": "FeatureCollection",
      "features": tile.geoJSON.features
    })
  const p = d3.geoPath(projection)
  
  // Go through each feature, or constituency, within the region, 
  // and render it as SVG with the feature highlighted
  for (let feature of tile.geoJSON.features) {
    const renderedSVG = await renderSVG(tile.geoJSON.features, feature, p)
    try {
      // Using the `sharp` library, take the rendered SVG string and generate a PNG
      await sharp(Buffer.from(renderedSVG.svgString))
        .extract({
          left: 0, 
          top: renderedSVG.y1, 
          width: width, 
          height: renderedSVG.y2 - renderedSVG.y1
        })
        .png()
        .toFile(`./images/${tile.zoom}.${tile.x}.${tile.y}.png`)
    } catch (err) {
      console.error(err)
    }
  }
  await converter.destroy()
  process.exit()
}

const renderSVG = async (features, feature, p) => {
  // Use D3 on the back-end to create an SVG of the FeatureCollection
  const d3N = new D3Node()
  const svg = d3N.createSVG(width, height)

  svg
    .selectAll("path")
    .data(features)
    .enter()
    .append("path")
    .style("stroke", "black")
    .style("fill", "#149E9C")
    .style("shape-rendering", "crispEdges")
    .style("stroke-width", "1px")
    .attr("d", p)

  // Use the bounds of the feature to make sure our images don't have any extra white space around them
  let y1
  let y2
  features.forEach(feature => {
    const bound = p.bounds(feature)
    if (!y1 || bound[0][1] < y1) y1 = bound[0][1]
    if (!y2 || bound[1][1] > y2) y2 = bound[1][1]
  })

  const svgString = d3N.svgString()

  return {
    svgString, 
    y1: Math.floor(Math.max(y1, 0)), 
    y2: Math.floor(y2)
  }
}

// Run the application to convert the SVG files
const tiles = fs.readdirSync(fileDirectory)
  .filter((value) => { return value.endsWith('.geojson') })
  .filter((value) => { return value.split('.').length === 4 })
  .map((value) => {
    const components = value.split('.')
    const geoJSON = JSON.parse(fs.readFileSync(`${fileDirectory}/${value}`,'utf8')) as FeatureCollection
    return new Tile(parseInt(components[0]), parseInt(components[1]), parseInt(components[2]), geoJSON)
  })
tiles.forEach((tile) => {
  convertSvgFiles(tile)
    .then()
})