import Plugin from '@jbrowse/core/Plugin'
import PluginManager from '@jbrowse/core/PluginManager'
import ViewType from '@jbrowse/core/pluggableElementTypes/ViewType'
import { AbstractSessionModel, isAbstractMenuManager } from '@jbrowse/core/util'
import { version } from '../package.json'

import { IsoformInspector } from './IsoformInspector/IsoformInspector'
import { default as IsoformInspectorModel } from './IsoformInspector/model'

export default class TemplatePlugin extends Plugin {
  name = 'Template'
  version = version

  install(pluginManager: PluginManager) {
    pluginManager.addViewType(() => {
      return new ViewType({
        name: 'IsoformInspector',
        stateModel: IsoformInspectorModel(),
        ReactComponent: IsoformInspector,
      })
    })
  }

  configure(pluginManager: PluginManager) {
    if (isAbstractMenuManager(pluginManager.rootModel)) {
      pluginManager.rootModel.appendToSubMenu(['File', 'Add'], {
        label: 'Open Isoform Inspector!',
        onClick: (session: AbstractSessionModel) => {
          session.addView('IsoformInspector', {})
        },
      })
    }
  }
}
