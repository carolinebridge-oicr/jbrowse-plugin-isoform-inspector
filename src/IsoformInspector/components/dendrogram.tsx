import React from 'react'
import { observer } from 'mobx-react-lite'
import { useStore } from '../model'

export const Dendrogram = () => {
  const store = useStore()

  return <div>Dendrogram</div>
}

export default observer(Dendrogram)
