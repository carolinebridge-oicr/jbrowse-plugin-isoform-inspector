import React from 'react'
import { InputForm } from './inputForm'
import Heatmap from './heatmap'
import HeatmapV from './heatmapVisx'
import { observer } from 'mobx-react-lite'

const IsoformInspectorView = observer(({ model }: { model: any }) => {
  // TODO: change any to IsoformInspectorViewModel
  return (
    <>
      <h3>Transcript Isoform Inspector</h3>
      <InputForm model={model} />
      <HeatmapV model={model} />
      <Heatmap model={model} />
    </>
  )
})

export default IsoformInspectorView
