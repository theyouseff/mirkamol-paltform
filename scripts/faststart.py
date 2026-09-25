import struct, sys, os, shutil
src, dst = sys.argv[1], sys.argv[2]
size = os.path.getsize(src)
f = open(src, 'rb')
atoms = []; pos = 0
while pos < size:
    f.seek(pos); h = f.read(8)
    sz, t = struct.unpack('>I4s', h); t = t.decode('latin1')
    if sz == 1: sz = struct.unpack('>Q', f.read(8))[0]
    elif sz == 0: sz = size - pos
    atoms.append((t, pos, sz)); pos += sz
names = [a[0] for a in atoms]
assert names.index('moov') > names.index('mdat'), 'moov allaqachon boshida'
moov = [a for a in atoms if a[0] == 'moov'][0]
f.seek(moov[1]); m = bytearray(f.read(moov[2]))
delta = moov[2]
def patch(buf, start, end):
    i = start
    while i < end:
        sz, t = struct.unpack('>I4s', buf[i:i+8]); t = t.decode('latin1')
        if t in ('trak', 'mdia', 'minf', 'stbl', 'edts'):
            patch(buf, i + 8, i + sz)
        elif t == 'stco':
            n = struct.unpack('>I', buf[i+12:i+16])[0]
            for k in range(n):
                o = i + 16 + 4*k
                buf[o:o+4] = struct.pack('>I', struct.unpack('>I', buf[o:o+4])[0] + delta)
        elif t == 'co64':
            n = struct.unpack('>I', buf[i+12:i+16])[0]
            for k in range(n):
                o = i + 16 + 8*k
                buf[o:o+8] = struct.pack('>Q', struct.unpack('>Q', buf[o:o+8])[0] + delta)
        i += sz
patch(m, 8, len(m))
with open(dst, 'wb') as out:
    for t, p, s in atoms:
        if t == 'moov': continue
        if t == 'mdat':
            out.write(m)  # moov mdat'dan oldin
        f.seek(p)
        remaining = s
        while remaining:
            chunk = f.read(min(remaining, 8 << 20)); out.write(chunk); remaining -= len(chunk)
print('OK', os.path.getsize(dst))
