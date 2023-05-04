#!/usr/bin/env python3

import os.path
import csv
import json
import argparse
import random as rd
from re import sub
import time
import subprocess

# external libs
import gffutils
import pysam
import numpy as np

start = time.time()

sample_id_header = 'subject_id'

def rename(obj, oldKey, newKey):
  obj[newKey] = obj.pop(oldKey)

def snake_case(s):
  return '_'.join(
    sub('([A-Z][a-z]+)', r' \1',
    sub('([A-Z]+)', r' \1',
    s.replace('-', ' '))).split()).lower()

def parse_anno(annotation_files, filename_header, subject_header) -> dict:
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
            if (snake_field == filename_header or key == filename_header):
              file_name_header = key
            if (snake_field == subject_header or key == subject_header):
              sample_id_header = key
        if file_name_header == '':
          raise Exception(f"Annotation file '{anno}' does not contain required 'filename' field.")

        if row[file_name_header] not in annotations:
          annotations[row[file_name_header]] = {}

        annotations[row[file_name_header]].update(row)

  return annotations

def drop_attributes(attributes_str, attributes_to_drop=[]) -> str:
  attributes_str = attributes_str.strip()
  new_attributes = []
  for attr in attributes_str.split(';'):
    if attr.split('=')[0] in attributes_to_drop:
      continue
    new_attributes.append(attr)

  return ";".join(new_attributes)

def get_exon_info(row) -> dict:
  row = row.strip()
  cols = row.split('\t')
  if len(cols) == 9 and cols[2] == 'exon':
    attributes = cols[8].split(';')
    id = attributes[0].split('=')[1]
    _, transcript_id, exon_number = id.split(':')

    return {
      'start': cols[3],
      'end': cols[4],
      'strand': cols[6],
      'id': id,
      'transcript_id': transcript_id,
      'exon_number': exon_number,
      'row': row
    }

  else:
    return {}

def add_intron(row, prev_row):
  output = ''
  cols = row.split("\t")
  exon_info = get_exon_info(row)
  prev_exon_info = get_exon_info(prev_row)
  if exon_info and prev_exon_info and exon_info['transcript_id'] == prev_exon_info['transcript_id']:
    if cols[6] == '+':
      start = int(prev_exon_info['end']) + 1
      end = int(exon_info['start']) - 1
    else:
      start = int(exon_info['end']) + 1
      end = int(prev_exon_info['start']) - 1

    intron_number = prev_exon_info['exon_number']
    intron_id = f"intron:{exon_info['transcript_id']}:{intron_number}"

    cleaned_attr = drop_attributes(cols[8], ['ID', 'exon_number', 'exon_id'])
    attr = f"ID={intron_id};{cleaned_attr}"
    output += "\t".join([cols[0], cols[1], 'intron', str(start), str(end), '.', exon_info['strand'], '.', attr])
  return output

def add_introns_rm_cds_utr_start_stop_codon(gff):
  new_gff_name = f'{gff}.with-introns.no-cds-utr-stop-start.gff3'
  new_gff = open(new_gff_name, 'w')
  prev_row = ''
  with open(gff, 'r') as g:
    prev_row = ''
    for row in g:
      if "\tCDS\t" not in row and "\tUTR\t" not in row and "\tfive_prime_UTR\t" not in row and "\tthree_prime_UTR\t" not in row and "\tstart_codon\t" not in row and "\tstop_codon\t" not in row:
        output = add_intron(row, prev_row)
        if output != '':
          print(output, file=new_gff)
        # if search(r'CDS', row) is None and search(r'UTR', row) is None and search(r'start_codon', row) is None and search(r'stop_codon', row) is None:
        print(row, end='', file=new_gff)
        if "\texon\t" in row:
          prev_row = row
  new_gff.close()
  return new_gff_name

def parse_gff3(gff_raw, gene_id):
  gff = f'{gff_raw}.with-introns.no-cds-utr-stop-start.gff3'
  db_filename = f'{gff}.db'

  if not os.path.isfile(db_filename):
    if not os.path.isfile(gff):
      # removes utr start stop codons
      gff = add_introns_rm_cds_utr_start_stop_codon(gff_raw)
    gff_db = gffutils.create_db(gff, db_filename)
  else:
    gff_db = gffutils.FeatureDB(db_filename)

  g = gff_db[gene_id]
  if not g:
    raise Exception(
        f"Specified gene ID '{gene_id}' does not exist in the provided Gff3 file '{gff}'.")

  gene = {
    "id": g.id,
    "name": g.attributes['gene_name'][0],
    "chr": g.seqid.replace('chr', ''),
    "start": g.start,
    "end": g.end,
    "strand": g.strand,
    "exons": {},
    "junctions": {}
  }

  for f in gff_db.children(gene_id, featuretype='intron', order_by='start'):
    chr = f.seqid.replace('chr', '')
    start = f.start
    end = f.end
    try:
      [status] = f.attributes['transcript_status']
    except:
      status = ''
    gene['junctions'][f"{chr}:{start}-{end}"] = {
      "status": status,
      "chr": chr,
      "start": start,
      "end": end
    }
  
  for f in gff_db.children(gene_id, featuretype='exon', order_by='start'):
    chr = f.seqid.replace('chr', '')
    start = f.start
    end = f.end
    try:
      [status] = f.attributes['transcript_status']
    except:
      status = ''
    gene['exons'][f"{chr}:{start}-{end}"] = {
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
  # TODO: reworking this for later
  # count = 0
  # for seq in samfile.fetch(chr, start, end):
  #   ref_start = seq.reference_start + 1
  #   for seg in seq.cigar:
  #     op, size = seg
  #     if op == 3: # intron, skipped region from the reference
  #         ref_end = ref_start + size - 1
  #         if ref_start == start and ref_end == end:
  #             count += 1

  #     if op in (0, 2, 3): # increase the ref_start for match, deletion, or skipped reference
  #         ref_start += size
  return samfile.count(chr, start, end)

def get_exon_count(samfile, chr, start, end):
  # TODO: might need to pass the count_cov operation through the json file to the front end
  # this is an intensive operation that the BAM file is required for
  # JBrowse2 core currently does it but it takes some load time
  # samfile.count_coverage(chr, start, end)
  count = samfile.count(chr, start, end)
  return count

def get_coverage(samfile, chr, start, end):
  # returns a tuple of arrays
  cov = samfile.count_coverage(chr, start, end)
  out_arr = []
  first = 0
  for arr in list(cov):
    if (first == 0):
      out_arr = arr
      first = 1
    else:
      out_arr = np.add(out_arr, arr)
  return out_arr.tolist()

def get_ann_expression(adata, gene_id):
  df = adata.to_df(layer="decontXcounts")
  result = df[gene_id].to_json(orient="table")
  parsed = json.loads(result)
  for ele in parsed['data']:
    rename(ele, 'cell_id', 'feature_id')
    rename(ele, gene_id, 'value')

  return parsed['data']

def sc_extract_read_counts(f, annotations, gene):
  samfile = pysam.AlignmentFile(f, 'rb')
  junction_read_sum = 0
  exon_read_sum = 0
  cells = {}
  for junction in gene['junctions']:
    # gene reads spanning across canonical junctions
    chr = gene['junctions'][junction]['chr']
    start = gene['junctions'][junction]['start']
    end = gene['junctions'][junction]['end']

    try:
      samfile.fetch(chr, start, end)
    except ValueError:
      chr = 'chr' + chr

    for seq in samfile.fetch(chr, start, end):
      count = 0
      ref_start = seq.reference_start + 1
      cell_barcode = seq.query_name
      for seg in seq.cigar:
        op, size = seg
        if op == 3: # intron, skipped region from the reference
            ref_end = ref_start + size - 1
            if ref_start == start and ref_end == end:
                count += 1

        if op in (0, 2, 3): # increase the ref_start for match, deletion, or skipped reference
            ref_start += size
      value = count
      junction_read_sum += value
      try:
        cells[cell_barcode]["subject_id"] = cell_barcode
      except KeyError:
        cells[cell_barcode] = {
          "subject_id": cell_barcode,
          "junctions": {},
          "exons": {}
        }
      cells[cell_barcode]["junctions"][junction] = {
        "feature_id": junction,
        "value": value,
        "status": gene['junctions'][junction]['status']
      }

  for exon in gene['exons']:
    # gene reads spanning across canonical exons
    chr = gene['exons'][exon]['chr']
    start = gene['exons'][exon]['start']
    end = gene['exons'][exon]['end']

    try:
      samfile.fetch(chr, start, end)
    except ValueError:
      chr = 'chr' + chr

    for seq in samfile.fetch(chr, start, end):
      cell_barcode = seq.query_name
      value = samfile.count(chr, start, end)
      exon_read_sum += value
      try:
        cells[cell_barcode]["subject_id"] = cell_barcode
      except KeyError:
        cells[cell_barcode] = {
          "subject_id": cell_barcode,
          "junctions": {},
          "exons": {},
        }
      cells[cell_barcode]["exons"][exon] = {
        "feature_id": exon,
        "value": value,
        "coverage": get_coverage(samfile, chr, start, end),
        "status": gene['exons'][exon]['status']
      }

  samfile.close()

  # normalization performed with RPKM
  gene_length = gene['end'] - gene['start']
  scale_factor = junction_read_sum / 1000000
  for cell in list(cells.values()):
    # TODO: temporary annots
    cell["annotations"] = [{}]
    cell["check"] = 0
    junctions = cell["junctions"]
    for junction in list(junctions.keys()):
      rpkm = (junctions[junction]['value'] / scale_factor) / gene_length if scale_factor > 0 else 0
      junctions[junction]["rpkm"] = rpkm
      cell["check"] += rpkm

  scale_factor = exon_read_sum / 1000000
  for cell in list(cells.values()):
    cell["annotations"] = [{}]
    exons = cell["exons"]
    for exon in list(exons.keys()):
      rpkm = (exons[exon]['value'] / scale_factor) / gene_length if scale_factor > 0 else 0
      exons[exon]["rpkm"] = rpkm
      cell["check"] += rpkm
    if cell["check"] == 0:
      del cells[cell["subject_id"]]

  return cells

def extract_read_counts(f, annotations, gene):
  # checks if the annotations file exists
  seq_filename = os.path.basename(f)

  if seq_filename not in annotations and seq_filename.split('.')[0] not in annotations:
    # if no annotations file is given subject ids are assigned a random integer
    subj_annotations = []
    subject_id = f'null-id-{rd.randint(0,100)}'
  else:
    if seq_filename not in annotations:
      seq_filename = seq_filename.split('.')[0]
    anno = annotations[seq_filename]
    subject_id = anno[sample_id_header] # figure out what this looks like for anndata

    subj_annotations = output_anno(anno)

  junctions = {}
  junction_read_sum = 0
  if (f.lower().endswith('.bam')):
    # counting junctions for alignment files
    samfile = pysam.AlignmentFile(f, "rb")
    # TODO: enhancement to use subject junctions instead of relying on canonical junctions
    #  might be a useful enhancement to include and illustrate novel subject junctions and counts
    #  pysam has a good function for this, just one call across the entire gene of interest
    #  samfile.find_introns((read for read in samfile.fetch(chr, start, end))))
    #  returns a list of introns with their read counts
    for junction in gene['junctions']:
      # gene reads spanning across canonical junctions
      chr = gene['junctions'][junction]['chr']
      start = gene['junctions'][junction]['start']
      end = gene['junctions'][junction]['end']
      try:
        value = get_junction_count(samfile, chr, start, end)
      except ValueError:
        chr = 'chr' + chr
        value = get_junction_count(samfile, chr, start, end)
      junction_read_sum += value
      junctions[junction] = {
        "feature_id": junction,
        "value": value,
        "status": gene['junctions'][junction]['status']
      }
    exons = {}
    exon_read_sum = 0
    for exon in gene['exons']:
      chr = gene['exons'][exon]['chr']
      start = gene['exons'][exon]['start']
      end = gene['exons'][exon]['end']
      try:
        value = get_exon_count(samfile, chr, start, end)
      except ValueError:
        chr = 'chr' + chr
        value = get_exon_count(samfile, chr, start, end)
      cov = get_coverage(samfile, chr, start, end)
      exon_read_sum += value
      exons[exon] = {
        "feature_id": exon,
        "value": value,
        "coverage": cov,
        "status": gene['exons'][exon]['status']
      }

    samfile.close()

  # normalization performed with RPKM
  gene_length = gene['end'] - gene['start']
  scale_factor = junction_read_sum / 1000000
  for junction in list(junctions.keys()):
    rpkm = (junctions[junction]['value'] / scale_factor) / gene_length if scale_factor > 0 else 0
    junctions[junction]["rpkm"] = rpkm

  scale_factor = exon_read_sum / 1000000
  for exon in list(exons.keys()):
    rpkm = (exons[exon]['value'] / scale_factor) / gene_length if scale_factor > 0 else 0
    exons[exon]["rpkm"] = rpkm

  subject = {
    "subject_id": subject_id,
    "junctions": junctions,
    "exons": exons,
    "annotations": subj_annotations
  }

  return subject

def main(score_client, manifest, seq_file_output_dir, gff, annotation_files, filename_header, subject_header, output_dir, single_cell, genes):
  gene_list = genes
  # genes is either a single gene id, a list of gene ids, or a .txt file of gene names (space delimited)
  if ('.txt' in genes[0]):
    f = open(genes[0], 'r')
    gene_list = f.read().split()

  # define some process variables, allows extensibility in the future
  subject_type = "cell" if single_cell else "sample"
  observation_type = "read_counts"

  # start the dictionary of genes
  gene_dict = {}
  print('Operation 1/3: Parsing gff3 file...', flush=True)
  for gene_id in gene_list:
    # parse gff
    gene = parse_gff3(gff, gene_id)
    gene_dict[gene_id] = {
      "gene_id": gene_id,
      "gene_name": gene['name'],
      "subject_type": subject_type,
      "observation_type": observation_type, # TODO: might remove or make this something else later
      "subjects": {}, # a dictionary of subjects
      "full_gene_obj": gene
    }

  print('Operation 2/3: Parsing annotations file...', flush=True)
  # parse annotation files, which are TSV files providing additional information about sequencing files
  annotations = parse_anno(annotation_files, filename_header, subject_header)

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
        files.append({"name": row['file_name'], "object": row['object_id']})
    i = 0
    for file in files:
      # open the download process and begin
      download_process = subprocess.Popen([f'{score_client}', 'download', '--object-id', f'{file["object"]}', '--output-dir', f'{seq_file_output_dir}'])

      # poll the process for completion, continue processing until each file has been processed
      print(f'\t{i+1}/{len(files)}: processing file {file["name"]}', flush=True)
      current_bam = f'{seq_file_output_dir}{file["name"]}'
      current_bai = f'{seq_file_output_dir}{file["name"]}.bai'
      while (download_process.poll() is None and i < len(files)):
          # check if the currently downloading file exists 
          if (os.path.isfile(current_bam) and os.path.isfile(current_bai)):
            for gene_id in gene_list:
              gene = gene_dict[gene_id]["full_gene_obj"]
              # assumes the bai file was downloaded first, which seems to be the case with score
              subject = extract_read_counts(current_bam, annotations, gene)
              gene_dict[gene_id]["subjects"][subject["subject_id"]] = subject
            subprocess.Popen(['rm', f'{current_bam}', f'{current_bai}'])
            # file has finished processing, iterate the counter and wait until the next files are done
            i+=1
  else:
    for gene_id in gene_list:
      gene = gene_dict[gene_id]["full_gene_obj"]
      # user is processing existing files on the system
      print('Operation 3/3: Extracting read counts...', flush=True)
      i = 0
      seq_files = []
      for f in os.listdir(seq_file_output_dir):
        filename = f'{seq_file_output_dir}{f}'
        if os.path.isfile(filename) and f.endswith('.bam'):
          seq_files.append(filename)

      # extract read counts
      for f in seq_files:
        i+=1
        print(f'\t{i}/{len(seq_files)}: processing file {f}', flush=True)
        if single_cell is True:
          cells = sc_extract_read_counts(f, annotations, gene)
          for cell in list(cells.values()):
            gene_dict[gene_id]["subjects"][cell["subject_id"]] = cell
        else:
          subject = extract_read_counts(f, annotations, gene)
          gene_dict[gene_id]["subjects"][subject["subject_id"]] = subject

  for gene_id in gene_list:
    gene_obj = gene_dict[gene_id]
    subjects_arr = []
    for subject in list(gene_obj["subjects"].values()):
      junctions = list(subject["junctions"].values())
      exons = list(subject["exons"].values())
      annotations = subject['annotations']
      subjects_arr.append({
        "subject_id": subject["subject_id"],
        "junctions": junctions,
        "exons": exons,
        "annotations": annotations
      })

    gene_name = gene_obj["gene_name"]
    output = {
      "gene_id": gene_obj["gene_id"],
      "gene_name": gene_obj["gene_name"],
      "subject_type": gene_obj["subject_type"],
      "observation_type": gene_obj["observation_type"],
      "subjects": subjects_arr
    }

    output_file = os.path.join(output_dir, f"{gene_id}_{gene_name}_subj_observ.json")

    # so as to not overwrite other files with other annotation sets for that gene
    i = 1
    while (os.path.exists(output_file)):
      output_file = os.path.join(output_dir, f"{gene_id}_{gene_name}_subj_observ_{i}.json")
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
  parser.add_argument('-n', '--filename-header', type=str, default='file_name',
                    help='Field name in the annotation file for the file name (optional)')
  parser.add_argument('-b', '--subject-header', type=str, default='subject_id',
                  help='Field name in the annotation file for the subject id (optional)')
  parser.add_argument('-o', '--output-dir', type=str, default='../public/data',
                    help='Output directory')
  parser.add_argument('-sc', '--single-cell', type=bool, default=False,
                    help='bool where if true processes alignment data as single cell', required=False)
  parser.add_argument('-g', '--genes', type=str, nargs='+',
                    help='Ensembl gene ID, or list of gene ID\'s', required=True)
  args = parser.parse_args()

  main(args.score_client, args.manifest, args.seq_file_dir, args.gff, args.annotation_file, args.filename_header, args.subject_header, args.output_dir, args.single_cell, args.genes)
