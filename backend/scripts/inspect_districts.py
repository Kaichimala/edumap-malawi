import shapefile, os

data_dir = r"c:\Users\COMADMIN\MY FINAL YEAR PROJECT\edumap-malawi\backend\data\EduMapdata"
dbf_path = os.path.join(data_dir, "mw_districts.dbf")

sf = shapefile.Reader(dbf=open(dbf_path, "rb"))
fields = [f[0] for f in sf.fields[1:]]
print(f"Fields: {fields}")
print(f"Total records: {len(sf.records())}")
print(f"\nAll district records:")
for i, rec in enumerate(sf.records()):
    d = dict(zip(fields, rec))
    print(f"  {i}: {d}")

