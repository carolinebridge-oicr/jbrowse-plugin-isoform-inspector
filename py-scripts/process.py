#!/usr/bin/env python3

import os
import csv
import json
import gffutils
import pysam
import argparse
import scanpy as sc
import random as rd
from re import sub

sample_id_header = 'subject_id'

def rename(obj, oldKey, newKey):
  obj[newKey] = obj.pop(oldKey)

def snake_case(s):
  return '_'.join(
    sub('([A-Z][a-z]+)', r' \1',
    sub('([A-Z]+)', r' \1',
    s.replace('-', ' '))).split()).lower()

def parse_anno(annotation_files) -> dict:
  global sample_id_header
  annotations = {}
  for anno in annotation_files:
    delim = ',' if anno.endsWith('.csv') else '\t' # takes csv or tsv files as annotations
    with open(anno, 'r') as a:
      reader = csv.DictReader(a, delimiter=delim)
      file_name_header = ''

      for row in reader:
        if file_name_header == '':
          for key in row.keys():
            snake_field = snake_case(key)
            if (snake_field == 'file_name'):
              file_name_header = key
            if (snake_field == 'subject_id' or snake_field == 'sample_id'):
              sample_id_header = key
        if file_name_header == '':
          raise Exception(f"Annotation file '{anno}' does not contain required 'filename' field.")

        if row[file_name_header] not in annotations:
          annotations[row[file_name_header]] = {}

        annotations[row[file_name_header]].update(row)

  return annotations

def parse_gff3(gff, gene_id):
  db_filename = f'{gff}.db'
  if not os.path.isfile(db_filename):
    gff_db = gffutils.create_db(gff, db_filename)
  else:
    gff_db = gffutils.FeatureDB(db_filename)

  g = gff_db[gene_id]
  if not g:
    raise Exception(
        f"Specified gene ID '{gene_id}' does not exist in the provided Gff3 file '{gff}'.")

  gene = {
    "id": g.id,
    "chr": g.seqid.replace('chr', ''),
    "start": g.start,
    "end": g.end,
    "strand": g.strand,
    "collapsed_exons": {},
    "junctions": {}
  }

  for f in gff_db.children(gene_id, featuretype='intron', order_by='start'):
    chr = f.seqid.replace('chr', '')
    start = f.start
    end = f.end
    [status] = f.attributes['transcript_status'] # might be fragile
    gene['junctions'][f"{chr}:{start}-{end}"] = {
      "status": status,
      "chr": chr,
      "start": start,
      "end": end
    }

  return gene

def output_anno(anno):
  output = []

  for a in anno:
    if a == sample_id_header:
        continue

    output.append({
        'type': a,
        'value': anno[a]
    })

  return output

def get_junction_count(samfile, chr, start, end):
  count = 0
  for seq in samfile.fetch(chr, start, end):
    ref_start = seq.reference_start + 1
    for seg in seq.cigar:
      op, size = seg
      if op == 3: # intron, skipped region from the reference
          ref_end = ref_start + size - 1
          if ref_start == start and ref_end == end:
              count += 1

      if op not in (2, 4, 5): # not increase for clipping or deletion from the reference
          ref_start += size

  return count

def get_ann_expression(adata, gene_id):
  df = adata.to_df(layer="decontXcounts")
  result = df[gene_id].to_json(orient="table")
  parsed = json.loads(result)
  for ele in parsed['data']:
    rename(ele, 'cell_id', 'feature_id')
    rename(ele, gene_id, 'value')

  return parsed['data']

def extract_read_counts(f, annotations, gene):
  # checks if the annotations file exists
  seq_filename = os.path.basename(f)

  if seq_filename not in annotations:
    subj_annotations = []
    subject_id = f'null-id-{rd.randint(0,100)}'
    # raise Exception(f"No annotation provided for file: {seq_filename}")
  else:
    anno = annotations[seq_filename]
    subject_id = anno[sample_id_header] # figure out what this looks like for anndata

    subj_annotations = output_anno(anno)

  value = []
  if (f.lower().endswith('.bam')):
    samfile = pysam.AlignmentFile(f, "rb")
    # gene reads spanning across junctions
    # this may be optimized later, should ideally stream the reads once
    junction_quant = []
    for junction in gene['junctions']:
      chr = gene['junctions'][junction]['chr']
      start = gene['junctions'][junction]['start']
      end = gene['junctions'][junction]['end']
      junction_quant.append({
          "feature_id": junction,
          "value": get_junction_count(samfile, chr, start, end), # this count is all it derives from ea file
          "status": gene['junctions'][junction]['status']
          # this whole for loop basically:
          # for each junction in the junctions derived from the gencode
          # grab all that info, then create an object with the featureid and the value that coordinates with it
          # the value that coordinates with it is one where the chromosome start and end coordinate with the junction
          # i.e. use this provided BAM file, find the corresponding junction within it
      })

    samfile.close()
  if (f.lower().endswith('.h5ad')):
    gene_id = gene['id']
    adata = sc.read(f)
    value = get_ann_expression(adata, gene_id)
    adata.file.close()

    junction_quant.append({
      "feature_id": '',
      "value": value,
    })

  subject = {
    "subject_id": subject_id,
    "features": junction_quant,
    "annotations": subj_annotations
  }

  return subject

def main(gff, gene_id, seq_files, annotation_files, output_dir):
  # TODO: run gene model script prior, so there's only one script execution step

  # TODO: create compatibility step for "exon" counts

  # TODO: create compatibility step for TSV's from the GDC

  # TODO: complete compatibility step for AnnData files
  ## if seq_files ends with .h5ad feature_type = gene_expression
  feature_type = "junction_quantifications"
  subject_type = "sample"

  # parse annotation files, which are TSV files providing additional information about sequencing files
  annotations = parse_anno(annotation_files)

  # parse gff
  gene = parse_gff3(gff, gene_id)

  subjects_arr = []

  # extract read counts
  for f in seq_files:
    subject = extract_read_counts(f, annotations, gene)
    subjects_arr.append(subject)

  output = {
    "gene_id": gene_id,
    "subject_type": subject_type,
    "feature_type": feature_type,
    "observation_type": "read_counts",
    "subjects": subjects_arr
  }

  output_file = os.path.join(output_dir, f"{gene_id}_subj_observ.json")

  # so as to not overwrite other files with other annotation sets for that gene
  # isoform inspector will choose the one without a _n appended
  i = 1
  while (os.path.exists(output_file)):
    output_file = os.path.join(output_dir, f"{gene_id}_subj_observ_{i}.json")
    i += 1

  with open(output_file, 'w') as j:
    j.write(json.dumps(output, indent=2))

if __name__ == '__main__':
  parser = argparse.ArgumentParser(
    description='Script to count reads for exons and junctions of a given gene')
  parser.add_argument('-f', '--gff', type=str,
                    help='Gff3 file', required=True)
  parser.add_argument('-g', '--gene-id', type=str,
                    help='Ensembl gene ID', required=True)
  parser.add_argument('-s', '--seq-file', type=str, nargs='+',
                    help='Sequencing file(s)', required=True)
  parser.add_argument('-a', '--annotation-file', type=str, nargs='+',
                    help='Annotation file(s) providing more info about samples', required=True)
  parser.add_argument('-o', '--output-dir', type=str, default='../public/data',
                    help='Output directory')
  args = parser.parse_args()

  main(args.gff, args.gene_id, args.seq_file, args.annotation_file, args.output_dir)
