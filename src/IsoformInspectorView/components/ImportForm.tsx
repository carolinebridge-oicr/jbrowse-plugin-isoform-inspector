import React, { useState } from 'react'
import {
  Button,
  FormControl,
  InputLabel,
  Select,
  Typography,
} from '@mui/material'
import { makeStyles } from 'tss-react/mui'
import { getSession, isElectron } from '@jbrowse/core/util'
import { storeBlobLocation } from '@jbrowse/core/util/tracks'
import { fetchLocalDataFromBlob } from '../../IsoformDataAdapter/IsoformDataAdapter'

const useStyles = makeStyles()((theme) => ({
  paper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    height: '350px',
    justifyContent: 'center',
    padding: theme.spacing(2),
  },
  container: {
    display: 'flex',
    flexDirection: 'column',
    width: '50%',
    gap: '10px',
  },
  button: {
    width: '50%',
  },
}))

export default function MultiWiggleWidget({ model }: { model: any }) {
  const { classes } = useStyles()
  const [files, setFiles] = useState(
    model.files ? model.files.map((file: any) => file.source) : [],
  )
  const [selectedFiles, setSelectedFiles] = useState([''])

  return (
    <div className={classes.paper}>
      <div className={classes.container}>
        <Typography variant="subtitle1">
          Opening file for: <b>{model.geneName}</b>
        </Typography>
        <Button className={classes.button} variant="outlined" component="label">
          Choose Files from your computer
          <input
            type="file"
            hidden
            multiple
            onChange={({ target }) => {
              // @ts-ignore
              const res = [...(target?.files || [])].map((file) => ({
                type: 'IsoformInspectorAdapter',
                isoLocation: isElectron
                  ? {
                      localPath: (file as File & { path: string }).path,
                      locationType: 'LocalPathLocation',
                    }
                  : storeBlobLocation({ blob: file }),
                source: file.name,
              }))
              const concatFiles = model.files.concat(res)
              model.setFiles(concatFiles)
              setFiles(model.files.map((file: any) => file.source))
            }}
          />
        </Button>
        <Typography variant="caption">
          Upload a new, valid .json file, or select a previously uploaded file
          from below.
        </Typography>
        <FormControl>
          <InputLabel shrink htmlFor="select-multiple-native">
            Loaded files
          </InputLabel>
          <Select
            multiple
            native
            value={selectedFiles}
            // @ts-ignore Typings are not considering `native`
            onChange={(e: any) => {
              const { options } = e.target
              const value: Array<string> = []
              for (let i = 0, l = options.length; i < l; i += 1) {
                if (options[i].selected) {
                  value.push(options[i].value)
                }
              }
              setSelectedFiles(value)
            }}
            label="Loaded files"
            inputProps={{
              id: 'select-multiple-native',
            }}
          >
            {files.map((file: string) => {
              return (
                <option key={file} value={file}>
                  {file}
                </option>
              )
            })}
          </Select>
        </FormControl>
        <Button
          className={classes.button}
          variant="contained"
          onClick={() => {
            const session = getSession(model)
            // find file object from selectedFile name in the model.files
            const selectedFilesObj: Array<{}> = []
            selectedFiles.forEach((file: any) => {
              const obj = model.files.find(
                (mFile: any) => mFile.source === file,
              )
              selectedFilesObj.push(obj)
            })
            try {
              selectedFilesObj.forEach(async (selectedFile: any, i: number) => {
                const data = await fetchLocalDataFromBlob(
                  // @ts-ignore
                  selectedFile.isoLocation,
                  model.geneModel,
                )
                if (i === 0) {
                  // @ts-ignore
                  model.setOnLoadProperties(data, true)
                  model.setIsImport(false)
                } else {
                  session.addView('IsoformInspectorView', {
                    geneId: model.geneId,
                    geneModel: model.geneModel,
                    isImport: false,
                  })
                  const view = session.views[session.views.length - 1]
                  // @ts-ignore
                  view.setOnLoadProperties(data, true)
                }
              })
            } catch (e: any) {
              session.notify(e.message, 'error')
            }
          }}
        >
          Submit
        </Button>
      </div>
    </div>
  )
}
