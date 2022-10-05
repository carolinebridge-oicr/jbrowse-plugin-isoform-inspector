import React from 'react'
import { observer } from 'mobx-react-lite'

export const InputForm = ({ model }: { model: any }) => {
  const [geneId, setGeneId] = React.useState('')
  const [colors, setColors] = React.useState(model.colors ?? 'blues')

  return (
    <div>
      Gene:{' '}
      <select
        name="geneId"
        onChange={async (e) => {
          setGeneId(e.target.value)
        }}
      >
        <option value=""></option>
        <option value="ENSG00000068878.10">ENSG00000068878.10</option>
        <option value="ENSG00000127481.10">ENSG00000127481.10</option>
        <option value="ENSG00000163349.17">ENSG00000163349.17</option>
      </select>
      &nbsp;&nbsp; Color:{' '}
      <select name="color" onChange={(e) => setColors(e.target.value)}>
        <option value="greens">greens</option>
        <option value="reds">reds</option>
        <option value="blues">blues</option>
      </select>
      &nbsp;&nbsp;
      <button
        onClick={() => {
          if (geneId !== model.geneId) {
            model.setGeneId(geneId)
          }
          model.setColors(colors)
        }}
      >
        OK
      </button>
    </div>
  )
}

export default observer(InputForm)
