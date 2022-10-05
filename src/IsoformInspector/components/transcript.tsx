import React from 'react'
import { observer } from 'mobx-react-lite'
import { useStore } from '../model'

export const Transcript = () => {
  const store = useStore()

  return <div>Transcript</div>
}

export default observer(Transcript)
