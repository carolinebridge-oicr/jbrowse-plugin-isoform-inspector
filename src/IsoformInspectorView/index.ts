import PluginManager from '@jbrowse/core/PluginManager'
import modelFactory from './model'
import ReactComponent from './components/IsoformInspectorView'

export default ({ jbrequire }: PluginManager) => {
  const ViewType = jbrequire('@jbrowse/core/pluggableElementTypes/ViewType')
  return new ViewType({
    name: 'IsoformInspectorView',
    stateModel: jbrequire(modelFactory),
    ReactComponent,
  })
}
