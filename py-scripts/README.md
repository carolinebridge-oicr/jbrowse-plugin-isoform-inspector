# isoform-inspector-py-scripts

This project houses some supplementary tools required to fully utilize the [isoform inspector for JBrowse 2](https://github.com/carolinebridge-oicr/jbrowse-plugin-isoform-inspector). Please refer to its github page and corresponding README for information on the project and its uses.

The isoform inspector for JBrowse 2 plugin requires some data pre-processing to accurately represent data in the visualization.

This is due to the nature of the files being processed: RNA-Seq alignment data from single cell sequencing or bulk sequencing derived from a cohort (e.g. a group of cancer patients).

## User guide

Clone the project and `cd` into the containing folder:

```
git clone jbrowse-plugin-isoform-inspector
cd py-scripts
```

then run the following with the relevant term replacements after moving your data into the designated data folders, **or replace the terms with your own folders where your data resides**. The isoform inspector is based on genes of interest, so we recommend creating subdirectories for your data that correspond with that notion. Please refer to the --help command (available on this document) for details.

If deriving data from the ICGC, you can retrieve an annotations file by clicking "export this table as a TSV" when viewing your data cohort -- otherwise annotations data must include a corresponding file name and in a .tsv format.

```
python3 process.py -s <location of data> -f ./input/gene-model/gencode.v19.annotation.with-introns.no-cds-utr-stop-start.gff3 -a <location of annotations tsv> -o ../public/data -g <Ensembl gene id>
```

After running this command one file will be produced for you:

`_subj_observ.json`; depending on your data, the `features` property of each subject will contain either splice junction quantification read counts, or mapped exon reads.

By default, this file once produced will reside in the `output` folder of this project. Note that for the isoform inspector to make use for this `.json`, it must be in this folder.

## --help

```
usage: exon_junction_read_counter.py [-h] -f GFF -g GENE_ID -s SEQ_FILE [SEQ_FILE ...] -a ANNOTATION_FILE [ANNOTATION_FILE ...] [-o OUTPUT_DIR]

Script to count reads for exons and junctions of a given gene

options:
  -h, --help            show this help message and exit
  -f GFF, --gff GFF     Gff3 file
  -g GENE_ID, --gene-id GENE_ID
                        Ensembl gene ID
  -s SEQ_FILE [SEQ_FILE ...], --seq-file SEQ_FILE [SEQ_FILE ...]
                        Sequencing file(s)
  -a ANNOTATION_FILE [ANNOTATION_FILE ...], --annotation-file ANNOTATION_FILE [ANNOTATION_FILE ...]
                        Annotation file(s) providing more info about samples
  -o OUTPUT_DIR, --output-dir OUTPUT_DIR
                        Output directory
```

## Quickstart

**coming soon**

If you'd just like to see the project in action, the repository comes pre-equipped with some quickstart files, found in public/data.

## Future work

These manual steps are to be streamlined into the desktop version of JBrowse 2 in the future.

Using the isoform inspector in the web version of JBrowse 2 will continue to require manual data pre-processing due to web browser limitations.

## Citations

Built using the [anndata library](https://github.com/scverse/anndata):

1. Isaac Virshup, Sergei Rybakov, Fabian J. Theis, Philipp Angerer, F. Alexander Wolf. _anndata: Annotated Data._ bioRxiv. 2021.12.16.473007; doi: https://doi.org/10.1101/2021.12.16.473007.

Built using the [SAMtools library](http://www.htslib.org/) and its wrapper [pysam](https://pysam.readthedocs.io/en/latest/api.html):

2. Danecek P, Bonfield JK, Liddle J, Marshall J, Ohan V, Pollard MO, Whitwham A, Keane T, McCarthy SA, Davies RM, Li H, Twelve years of SAMtools and BCFtools, GigaScience (2021) 10(2) giab008 [33590861].

Sample data retrieved from [Tabula Sapiens](https://figshare.com/projects/Tabula_Sapiens/100973), and the [International Cancer Genome Consortium](https://dcc.icgc.org/):

3. Pisco, Angela; Consortium, Tabula Sapiens (2021): Tabula Sapiens Single-Cell Dataset. figshare. Dataset. https://doi.org/10.6084/m9.figshare.14267219.v4.

4. Zhang, J., Bajari, R., Andric, D. et al. The International Cancer Genome Consortium Data Portal. Nat Biotechnol 37, 367–369 (2019). https://doi.org/10.1038/s41587-019-0055-9
