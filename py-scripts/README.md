# isoform-inspector-py-scripts

This project houses some supplementary tools required to fully utilize the [isoform inspector for JBrowse 2](https://github.com/carolinebridge-oicr/jbrowse-plugin-isoform-inspector). Please refer to its github page and corresponding README for information on the project and its uses.

The isoform inspector for JBrowse 2 plugin requires some data pre-processing to accurately represent data in the visualization.

This is due to the bulky nature of the files being processed: RNA-Seq alignment data from single cell sequencing or bulk sequencing derived from a cohort (e.g. a group of cancer patients).

## User guide

Clone the project and `cd` into the containing folder:

```
git clone jbrowse-plugin-isoform-inspector
cd py-scripts
```

You will need at minimum:

1. Your assembly of choice in .gff3 format
2. A set of data to process, in a single directory (no sub folders)
3. A TSV or CSV of annotations for that data, with a field for `file_name`
4. A gene of interest, or a set of genes of interest

Now run the following with the relevant term replacements after moving your data into the designated data folders, **or replace the terms with your own folders where your data resides**.

```
python3 process.py -s <location of data, a directory> -f <location of assembly gff3> -a <location of annotations tsv> -o <where you would like the files to go> -g <Ensembl gene id>
```

If deriving data from the ICGC, you can retrieve an annotations file by clicking "export this table as a TSV" when viewing your data cohort -- otherwise annotations data must include a corresponding **file name** property and by supplied in `.tsv` or `.csv` format.

After running the previous command one file will be produced for you:

`_subj_observ.json`; depending on your data, the `features` property of each subject will contain either splice junction quantification read counts, or mapped exon reads.

By default, this file once produced will reside in the `public/data` folder of this project.

You can also run against multiple genes at once by delimiting them with spaces in the command, e.g.:

`... -g `

And there is additional tooling to programatically retrieve subject files from the ICGC using the score client, e.g.:

`python3 process.py -c ~/Workspace/score-client-5.8.1/bin/score-client -m ~/Workspace/score-client-5.8.1/manifest-63.tsv -s ~/Workspace/score-client-5.8.1/input/ -f ./input/gene-model/gencode.v19.annotation.gff3 -a ./input/annotations/annotations-63.tsv -g ENSG00000011114.10 ENSG00000068878.10 ENSG00000106462.6 ENSG00000163349.17 ENSG00000141510.11 ENSG00000171862.5 ENSG00000249859.3 ENSG00000012048.15`

Note that a manifest is required if using the score client to download data as it is processed. Also note that by doing this, the script will run a lot longer than with locally hosted files, as the download operation is substantial.

More details about this tooling in the help command.

## --help

```
usage: process.py [-h] [-c SCORE_CLIENT] [-m MANIFEST] -s SEQ_FILE_DIR -f GFF -a ANNOTATION_FILE [ANNOTATION_FILE ...] [-o OUTPUT_DIR] -g GENES [GENES ...]

Script to count reads for exons and junctions of a given gene

options:
  -h, --help            show this help message and exit
  -c SCORE_CLIENT, --score-client SCORE_CLIENT
                        location of the score client (optional)
  -m MANIFEST, --manifest MANIFEST
                        manifest file for bulk download and process (optional)
  -s SEQ_FILE_DIR, --seq-file-dir SEQ_FILE_DIR
                        directory where sequencing file(s) reside
  -f GFF, --gff GFF     gff3 file
  -a ANNOTATION_FILE [ANNOTATION_FILE ...], --annotation-file ANNOTATION_FILE [ANNOTATION_FILE ...]
                        annotation file(s) providing more info about samples, must contain a file_name field
  -o OUTPUT_DIR, --output-dir OUTPUT_DIR
                        Output directory
  -g GENES [GENES ...], --genes GENES [GENES ...]
                        Ensembl gene ID, or list of gene ID's
```

## Additional information

The script does a few things to make it compatible with the isoform inspector, these may be of note in your analysis:

1. Removes UTR, CDS, stop_codon, and start_codon features from the gff, and thus they are not present in the final product.
2. The GFF file is processed into a .db file.
3. These two files (a gff with the aformentioned features removed, and a .db file) will reside in the same directory as the original assembly provided to the command. Subsequent runs of the script will take less time
4. Processing a GFF for the first time takes about 7 minutes (for a 1GB assembly), but assuming the generated files are maintained, subsequent runs take half a second for one gene processed.

## Quickstart

**coming soon**

If you'd just like to see the project in action, the repository comes pre-equipped with some quickstart files, found in public/data.

## Future work

These manual steps are to be streamlined into the desktop version of JBrowse 2 in the future.

Using the isoform inspector in the web version of JBrowse 2 will continue to require manual data pre-processing due to web browser limitations.

## Citations

Built using the [anndata library](https://github.com/scverse/anndata):

1. Isaac Virshup, Sergei Rybakov, Fabian J. Theis, Philipp Angerer, F. Alexander Wolf. _anndata: Annotated Data._ bioRxiv. 2021.12.16.473007; doi: https://doi.org/10.1101/2021.12.16.473007.

Built using the [gffutils library](https://github.com/daler/gffutils):

2. Dale, Ryan. (2022). gffutils (version 0.11.1). Python package.

Built using the [SAMtools library](http://www.htslib.org/) and its wrapper [pysam](https://pysam.readthedocs.io/en/latest/api.html):

3. Danecek P, Bonfield JK, Liddle J, Marshall J, Ohan V, Pollard MO, Whitwham A, Keane T, McCarthy SA, Davies RM, Li H, Twelve years of SAMtools and BCFtools, GigaScience (2021) 10(2) giab008 [33590861].

Sample data retrieved from [Tabula Sapiens](https://figshare.com/projects/Tabula_Sapiens/100973), and the [International Cancer Genome Consortium](https://dcc.icgc.org/):

4. Pisco, Angela; Consortium, Tabula Sapiens (2021): Tabula Sapiens Single-Cell Dataset. figshare. Dataset. https://doi.org/10.6084/m9.figshare.14267219.v4.

5. Zhang, J., Bajari, R., Andric, D. et al. The International Cancer Genome Consortium Data Portal. Nat Biotechnol 37, 367–369 (2019). https://doi.org/10.1038/s41587-019-0055-9
