import sys
import os
import struct

def align_file(path):
    try:
        with open(path, 'rb') as f:
            data = f.read()
        if len(data) < 64 or data[:4] != b'\x7fELF':
            return
        b = bytearray(data)
        ei_class = b[4]
        endian = '<' if b[5] == 1 else '>'
        modified = False
        if ei_class == 2: # 64-bit ELF
            e_phoff = struct.unpack(endian + 'Q', b[32:40])[0]
            e_phentsize = struct.unpack(endian + 'H', b[54:56])[0]
            e_phnum = struct.unpack(endian + 'H', b[56:58])[0]
            for i in range(e_phnum):
                off = e_phoff + i * e_phentsize
                if off + 56 > len(b): break
                if struct.unpack(endian + 'I', b[off:off+4])[0] == 1: # PT_LOAD
                    p_align = struct.unpack(endian + 'Q', b[off+48:off+56])[0]
                    if p_align < 16384:
                        struct.pack_into(endian + 'Q', b, off+48, 16384)
                        modified = True
        elif ei_class == 1: # 32-bit ELF
            e_phoff = struct.unpack(endian + 'I', b[28:32])[0]
            e_phentsize = struct.unpack(endian + 'H', b[42:44])[0]
            e_phnum = struct.unpack(endian + 'H', b[44:46])[0]
            for i in range(e_phnum):
                off = e_phoff + i * e_phentsize
                if off + 32 > len(b): break
                if struct.unpack(endian + 'I', b[off:off+4])[0] == 1: # PT_LOAD
                    p_align = struct.unpack(endian + 'I', b[off+28:off+32])[0]
                    if p_align < 16384:
                        struct.pack_into(endian + 'I', b, off+28, 16384)
                        modified = True
        if modified:
            with open(path, 'wb') as f:
                f.write(b)
    except Exception as e:
        print(f"Warning aligning {path}: {e}")

if __name__ == '__main__':
    if len(sys.argv) > 1:
        target_dir = sys.argv[1]
        print(f"Aligning native libraries in {target_dir} to 16 KB page size...")
        count = 0
        for root, dirs, files in os.walk(target_dir):
            for file in files:
                if file.endswith('.so'):
                    align_file(os.path.join(root, file))
                    count += 1
        print(f"Successfully processed {count} .so files for 16 KB alignment.")
