# jbrowse-plugin-isoform-inspector

> JBrowse plugin that embeds the Isoform Inspector for visualizing cohort RNA-seq data.

## Overview

The isoform inspector for JBrowse 2 is a plugin that provides transcript isoform / splice junction visualization and light-weight analysis (such as clustering) for RNA-Seq alignment data from single cell sequencing or bulk sequencing derived from a cohort (e.g. a group of cancer patients).

The tool's main use is to provide insights related to transcript isoforms (e.g. the presence or absense of certain isoforms, and in what quantity amongst different cells or samples). As such, it works on one gene at a time. Reads aligned to more than one exon (i.e. split reads) of the current gene are used to quantify exon junctions, and reads mapped exons of the current gene are used for exon quantifications.

The main body of the visualization is the heatmap view of the underlying matrix where the rows are the cells (or samples), and the columns are exon junctions (or exons). The value in each cell of the matrix is the count of reads spanning across the junction or mapped to the exon. The colour gradient is used to indicate read counts on a scale of zero to the max read counts in the data cohort.

When a gene model of a particular gene is chosen (e.g. information is parsed from a gene annotation sources such as a GFF file) we can work out a set of canonical exons and introns. Those introns are annotated in the gene model are referred to as KNOWN introns or KNOWN junctions. NOVEL junctions are defined as a junction between an exon pair with split reads aligned to both exons which are not adjacent in any of the annotated transcript isoforms. These NOVEL junctions are marked as such along the x-axis of the read matrix.

## User guide

**Important note**: this plugin _must_ be run locally, as the files required to run it are produced by the supporting [python scripts](https://github.com/carolinebridge-oicr/jbrowse-plugin-isoform-inspector/tree/main/py-scripts) and the plugin accesses these to display the relevant data.

Add to the `plugins` of your JBrowse config:

```json
{
  "plugins": [
    {
      "name": "IsoformInspector",
      "url": "http://localhost:9000/dist/jbrowse-plugin-isoform-inspector.umd.development.js"
    }
  ]
}
```

### Prepping your data

To use the isoform inspector, you should have an idea of the gene or genes you're looking at, and have some related alignment data ready. These typically take the form of `.gff` files and `.bam` files, which is what the tool is designed to digest.

If you have a different datatype you'd like to represent in the tool, please submit a feature request.

### **IMPORTANT** Pre-processing step

To use the isoform inspector, you will need to perform a pre-processing step using the [python scripts](https://github.com/carolinebridge-oicr/jbrowse-plugin-isoform-inspector/tree/main/py-scripts) to derive cohort read counts and supply one `.json` file to the plugin.

Follow the instructions on the README file of the linked repository to create these files. Note this process may take some time, depending on the size of your data.

## Quickstart

**coming soon**

If you'd just like to see the project in action, the repository comes pre-equipped with some quickstart files.

1. Load the plugin into your JBrowse steps and ensure you have Gencode v19 (for this demo data) in your JBrowse config (or use the config from the project itself).

2. Navigate on a linear genome view to the gene `PSME4` using the search function (or navigate to location `2:54,091,141..54,197,223`).

3. Right click on the gene and select 'Open in Isoform Inspector'

4. Explore the tool! This should give you an idea of how to use the tool and how you might load your own data in for analysis.

## Author note

The [Isoform Inspector](https://github.com/carolinebridge-oicr/isoform-inspector/) and this JBrowse plugin for the Isoform Inspector were originally developed and conceptualized by [Junjun Zhang](https://github.com/junjun-zhang/).
