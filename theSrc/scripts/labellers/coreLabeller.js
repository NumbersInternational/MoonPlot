import labeler from './simulatedAnneallingLabellingAlgorithm'
import {getLabelDimensionsUsingSvgApproximation} from '../labelUtils'
import _ from 'lodash'

const NONE = 'NONE'
const BOTTOM_LEFT = 'BOTTOM_LEFT'
const BOTTOM_CENTER = 'BOTTOM_CENTER'
const BOTTOM_RIGHT = 'BOTTOM_RIGHT'
const TOP_LEFT = 'TOP_LEFT'
const TOP_CENTER = 'TOP_CENTER'
const TOP_RIGHT = 'TOP_RIGHT'
const MIDDLE_LEFT = 'MIDDLE_LEFT'
const MIDDLE_RIGHT = 'MIDDLE_RIGHT'

// ({plotState, coreLabelsData, svg, cx, cy, textColor, linkWidth})
const positionLabels = ({
  svg,
  coreLabels,
  fontFamily,
  fontSize,
  fontColor,
  radius,
  cx,
  cy }) => {
  const labels = _(coreLabels)
    .cloneDeep()
    .map(label => {
      const x = (label.x * radius) + cx
      const y = (-label.y * radius) + cy
      const {width, height} = getLabelDimensionsUsingSvgApproximation({
        parentContainer: svg,
        text: label.name,
        fontSize,
        fontFamily
      })
      return {
        id: label.id,
        name: label.name,
        truncatedName: label.name,
        anchor: { x, y, r: 2 },
        label: { x, y, width, height }, // NB putting width and height here for simulatedAnneallingLabellingAlgorithm and getLabelAnchorPoint
        width,
        height
      }
    })
    // TODO I should have to call .value() here, but that throws an error ?

  // Check if labels are overlapping and if need to be repositioned
  labeler()
    .svg(svg)
    .cx(cx)
    .cy(cy)
    .radius(radius)
    .anchor(_(labels).map('anchor').value())
    .label(_(labels).map('label').value())
    .start(500)


  const allTheAnchors = _(labels).map('anchor').value()
  _(labels).each(label => { label.labelLineConnector = getLabelAnchorPoint(label.label, label.anchor, label.name, allTheAnchors) })

  return labels
}

const getLabelAnchorPoint = (lab, anc, name, allTheAnchors) => {
  const labelLeft = lab.x - (lab.width / 2)
  const labelRight = lab.x + (lab.width / 2)
  const labelTop = (lab.y - lab.height)
  const labelBottom = lab.y

  const placementOptions = {
    NONE:          null,
    BOTTOM_LEFT:   { x: labelLeft,  y: lab.y},
    BOTTOM_CENTER: { x: lab.x,      y: lab.y},
    BOTTOM_RIGHT:  { x: labelRight, y: lab.y},
    TOP_LEFT:      { x: labelLeft,  y: labelTop},
    TOP_CENTER:    { x: lab.x,      y: labelTop},
    TOP_RIGHT:     { x: labelRight, y: labelTop},
    MIDDLE_LEFT:   { x: labelLeft,  y: lab.y - (lab.height / 2)},
    MIDDLE_RIGHT:  { x: labelRight, y: lab.y - (lab.height / 2)}
  }

  const padding = 10
  const horizontallyAligned = (anc.x > (labelLeft)) && (anc.x < (labelRight))
  const anchorFarAbove = anc.y < (labelTop - padding)
  const anchorAbove = anc.y < labelTop
  const anchorFarBelow = anc.y > (labelBottom + padding)
  const anchorBelow = anc.y > labelBottom
  const anchorToLeft = anc.x < (labelLeft)
  const anchorFarToLeft = anc.x < (labelLeft - padding)
  const anchorToRight = anc.x > (labelRight)
  const anchorFarToRight = anc.x > (labelRight + padding)

  let placementOption = null
  if      (horizontallyAligned && anchorFarAbove)   {placementOption = TOP_CENTER}
  else if (horizontallyAligned && anchorFarBelow)   {placementOption = BOTTOM_CENTER}
  else if (anchorAbove && anchorToLeft)             {placementOption = TOP_LEFT}
  else if (anchorAbove && anchorToRight)            {placementOption = TOP_RIGHT}
  else if (anchorBelow && anchorToLeft)             {placementOption = BOTTOM_LEFT}
  else if (anchorBelow && anchorToRight)            {placementOption = BOTTOM_RIGHT}
  else if (anchorFarToLeft)                         {placementOption = MIDDLE_LEFT}
  else if (anchorFarToRight)                        {placementOption = MIDDLE_RIGHT}
  else {
    // Draw the link if there are any anc nearby
    const ambiguityFactor = 10
    const padL = placementOptions[TOP_LEFT]['x'] - ambiguityFactor
    const padR = placementOptions[BOTTOM_RIGHT]['x'] + ambiguityFactor
    const padT = placementOptions[TOP_LEFT]['y'] - ambiguityFactor
    const padB = placementOptions[BOTTOM_RIGHT]['y'] + ambiguityFactor
    let ancNearby = 0
    for (anc of Array.from(allTheAnchors)) {
      if (((anc.x > padL) && (anc.x < padR)) && ((anc.y > padT) && (anc.y < padB))) {
        ancNearby++
      }
    }
    if (ancNearby > 1) {
      if (!anchorToLeft && !anchorToRight && !anchorAbove && !anchorBelow) {
        placementOption = BOTTOM_CENTER
      } else if (horizontallyAligned && anchorAbove) {
        placementOption = TOP_CENTER
      } else if (horizontallyAligned && anchorBelow) {
        placementOption = BOTTOM_CENTER
      } else if (anchorToLeft && anchorAbove) {
        placementOption = TOP_LEFT
      } else if (anchorToLeft && anchorBelow) {
        placementOption = BOTTOM_LEFT
      } else if (anchorToRight && anchorAbove) {
        placementOption = TOP_RIGHT
      } else if (anchorToRight && anchorBelow) {
        placementOption = BOTTOM_RIGHT
      } else if (anchorToLeft) {
        placementOption = MIDDLE_LEFT
      } else if (anchorToRight) {
        placementOption = MIDDLE_RIGHT
      }
    } else {
      placementOption = NONE // else just return the label x,y
    }
  }
  console.log(`label ${name} chose ${placementOption}`)
  return placementOptions[placementOption]
}

module.exports = { positionLabels, getLabelAnchorPoint }
