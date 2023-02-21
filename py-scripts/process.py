#!/usr/bin/env python3

import os.path
import csv
import json
import gffutils
import pysam
import argparse
import scanpy as sc
import random as rd
from re import sub
import time
import subprocess

start = time.time()

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
    delim = ',' if anno.endswith('.csv') else '\t' # takes csv or tsv files as annotations
    with open(anno, 'r') as a:
      reader = csv.DictReader(a, delimiter=delim)
      file_name_header = ''

      for row in reader:
        if file_name_header == '':
          for key in row.keys():
            snake_field = snake_case(key)
            if (snake_field == 'file_name'):
              file_name_header = key
            if (snake_field == 'subject_id' or snake_field == 'sample_id'): # TODO: barcode for single cell?
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
  print(seq_filename)
  if (f.lower().endswith('.bam')):
    samfile = pysam.AlignmentFile(f, "rb")
    # gene reads spanning across junctions
    # this may be optimized later, should ideally stream the reads once
    junction_quant = []
    print(gene['junctions'])
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

def main(score_client, manifest, seq_file_output_dir, gff, annotation_files, output_dir, gene_id):
  # TODO: host gff files for common assemblies on aws and fetch them instead of requiring the user to do so

  # TODO: create compatibility step for "exon" counts

  # TODO: complete compatibility step for AnnData files

  # define some process variables, allows extensibility in the future
  feature_type = "junction_quantifications"
  subject_type = "sample"

  print('Operation 1/3: Parsing annotations file...', flush=True)
  # parse annotation files, which are TSV files providing additional information about sequencing files
  annotations = parse_anno(annotation_files)

  print('Operation 2/3: Parsing gff3 file...', flush=True)
  # parse gff
  gene = parse_gff3(gff, gene_id)

  subjects_arr = []

  if (score_client):
    # user is bulk processing while downloading
    if (not manifest):
      raise Exception(
        f'A manifest file must be provided to bulk download and process files.'
      )
    files = []
    # read the manifest to see how many files are being downloaded and what their names are
    with open (manifest) as f:
      reader = csv.DictReader(f, delimiter='\t')
      for row in reader:
        files.append(row['file_name'])
    # open the download process and begin
    download_process = subprocess.Popen([f'{score_client}', 'download', '--manifest', f'{manifest}', '--output-dir', f'{seq_file_output_dir}'])

    # poll the process for completion, continue processing until each file has been processed
    i = 0
    print('Operation 3/3: Extracting read counts...', flush=True)
    check_f = open('output.txt', 'w')
    while (download_process.poll() is None and i < len(files)):
      current_bam = f'{seq_file_output_dir}{files[i]}'
      current_bai = f'{seq_file_output_dir}{files[i]}.bai'
      # check if the currently downloading file exists 
      if (os.path.isfile(current_bam)):
        # assumes the bai file was downloaded first, which seems to be the case with score
        print(f'\t{i+1}/{len(files)}: processing file {files[i]}', flush=True, file=check_f)
        subject = extract_read_counts(current_bam, annotations, gene)
        subjects_arr.append(subject)
        subprocess.Popen(['rm', f'{current_bam}', f'{current_bai}'])
        # file has finished processing, iterate the counter and wait until the next files are done
        i+=1
  else:
    # user is processing existing files on the system
    print('Operation 3/3: Extracting read counts...', flush=True)
    i = 0
    seq_files = []
    for f in os.listdir(seq_file_output_dir):
      filename = f'{seq_file_output_dir}{f}'
      if os.path.isfile(filename) and f.endswith('.bam'):
        seq_files.append(filename)
    # seq_files = f'{seq_file_output_dir}/*.bam'
    print(seq_files)
    # extract read counts
    for f in seq_files:
      i+=1
      print(f'\t{i}/{len(seq_files)}: processing file {f}', flush=True)
      subject = extract_read_counts(f, annotations, gene)
      subjects_arr.append(subject)

  # whether bulk downloading or static, output is generated here
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
  # TODO: eventually the front end should be able to process a variety of .jsons for the same gene
  i = 1
  while (os.path.exists(output_file)):
    output_file = os.path.join(output_dir, f"{gene_id}_subj_observ_{i}.json")
    i += 1

  with open(output_file, 'w+') as j:
    j.write(json.dumps(output, indent=2))

  end = time.time()
  print(f'process.py has finished. Execution time: {end - start} seconds')

if __name__ == '__main__':
  parser = argparse.ArgumentParser(
    description='Script to count reads for exons and junctions of a given gene')
  parser.add_argument('-c', '--score-client', type=str,
                help='location of the score client (optional)', required=False)
  parser.add_argument('-m', '--manifest', type=str,
                help='manifest file for bulk download and process (optional)', required=False)
  parser.add_argument('-s', '--seq-file-dir', type=str,
                    help='directory where sequencing file(s) reside', required=True)
  parser.add_argument('-f', '--gff', type=str,
                    help='gff3 file', required=True)
  parser.add_argument('-a', '--annotation-file', type=str, nargs='+',
                    help='annotation file(s) providing more info about samples, must contain a file_name field', required=True)
  parser.add_argument('-o', '--output-dir', type=str, default='../public/data',
                    help='Output directory')
  parser.add_argument('-g', '--gene-id', type=str,
                    help='Ensembl gene ID', required=True)
  args = parser.parse_args()

  main(args.score_client, args.manifest, args.seq_file_dir, args.gff, args.annotation_file, args.output_dir, args.gene_id)
