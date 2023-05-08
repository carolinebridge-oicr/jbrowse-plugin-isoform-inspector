import React, { lazy, useEffect, useState } from 'react'
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material'
import { observer } from 'mobx-react'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import CloseIcon from '@mui/icons-material/Close'
import { makeStyles } from 'tss-react/mui'

// potentially use colorpicker from core in the future to allow more freedom with the colours
// const ColorPicker = lazy(() => import('@jbrowse/core/ui/ColorPicker'))

const useStyles = makeStyles()((theme) => ({
  closeButton: {
    position: 'absolute',
    top: '10px',
    right: '10px',
    color: theme.palette.grey[500],
  },
  root: {
    margin: theme.spacing(1),
  },
  paper: {
    display: 'flex',
    flexDirection: 'column',
    width: 500,
    height: 450,
    padding: theme.spacing(2),
  },
}))

export default observer(function ToggleAnnotationsDialog({
  model,
  handleClose,
}: {
  model: any
  handleClose: (arg?: string) => void
}) {
  const { classes } = useStyles()

  const columns: GridColDef[] = [
    {
      field: 'id',
      headerName: 'Annotation',
      flex: 1,
    },
    {
      field: 'show',
      headerName: 'Show annotation bar',
      flex: 1,
      align: 'center',
      headerAlign: 'center',
      renderCell: (param: any) => {
        const [state, setState] = useState(param.value)
        return (
          <Checkbox
            data-testid="annotation-checkbox"
            checked={state}
            onChange={(event) => {
              setState(event.target.checked)
              model.setNivoAnnotations([
                { field: param.id, show: event.target.checked },
              ])
            }}
          />
        )
      },
    },
    // TODO: wip
    // {
    //   field: 'colour',
    //   headerName: 'Colour scheme',
    //   flex: 1,
    //   align: 'center',
    //   headerAlign: 'center',
    //   renderCell: (param: any) => {
    //     const [selectedValue, setSelectedValue] = useState(param.value.name)
    //     return (
    //       <Select
    //         value={selectedValue}
    //         onChange={() => {
    //           console.log('apply colour scheme to the field')
    //         }}
    //         sx={{ height: '35px' }}
    //       >
    //         {/* {model.colourPalettes.map((scheme: any) => {
    //           return (
    //             <MenuItem key={scheme.name} value={scheme.name}>
    //               {scheme.name}
    //             </MenuItem>
    //           )
    //         })} */}
    //       </Select>
    //     )
    //   },
    // },
  ]
  return (
    <Dialog open onClose={() => handleClose()} maxWidth="sm">
      <DialogTitle>
        Heatmap annotations options
        <IconButton
          className={classes.closeButton}
          onClick={() => handleClose()}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <div className={classes.root}>
          <div className={classes.paper}>
            <Box sx={{ height: 400, width: 460 }}>
              <DataGrid
                rows={Object.values(model.annotationsConfig) as []}
                columns={columns}
                pageSize={5}
                rowsPerPageOptions={[5]}
                disableSelectionOnClick
                initialState={{
                  sorting: { sortModel: [{ field: 'show', sort: 'desc' }] },
                }}
              />
            </Box>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
})
