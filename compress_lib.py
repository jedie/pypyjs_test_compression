#!/usr/bin/env python
import lzma

import os
import json
import sys
import tarfile
import shutil
import time
import zipfile
import zlib



class TarGzCompressor(object):
    SUFFIX=".tar.gz"
    TAR_MODE="w:gz"

    def __init__(self, level=9, filter_callback=None):
        self.level = level
        self.filter_callback = filter_callback
        self._tar_open_kwargs = {"compresslevel":self.level}

    def get_info(self):
        return "%s with level=%i" % (self.SUFFIX, self.level)

    def tar_info_filter(self, tarinfo):
        tarinfo.uname = tarinfo.gname = "root"
        tarinfo.uid = tarinfo.gid = 0
        # tarinfo.type = ???
        # tarinfo.gname = ???
        tarinfo.mode = 0o0777 # ???

        # print("add",tarinfo.size, tarinfo.name)

        if self.filter_callback is not None:
            tarinfo = self.filter_callback(tarinfo)

        return tarinfo

    def compress(self, out_dir, archive_name, files_dir, files, verbose=False):
        archive_name = archive_name + self.SUFFIX
        out_filename = os.path.join(out_dir, archive_name)

        total_uncompressed_size = 0
        total_start_time = time.time()
        with tarfile.open(out_filename, mode=self.TAR_MODE, **self._tar_open_kwargs) as tar:
            tar.ENCODING = "utf-8"

            for file_name in files:
                file_path = os.path.join(files_dir, file_name)
                file_size = os.stat(file_path).st_size
                total_uncompressed_size += file_size

                if verbose:
                    sys.stdout.write("Compress %20r %7.1fMB ... " % (
                        file_name, (file_size / 1024.0 / 1024.0)
                    ))
                    sys.stdout.flush()

                start_time = time.time()
                tar.add(file_path, arcname=file_name, filter=self.tar_info_filter)
                duration = time.time() - start_time

                if verbose:
                    print("compressed in %.2fsec." % duration)

        total_duration = time.time() - total_start_time
        compressed_size = os.stat(out_filename).st_size
        return archive_name, total_uncompressed_size, compressed_size, total_duration


class LZMA_Hack(lzma.LZMAFile):
    def __init__(self, *args, **kwargs):
        # print("XXX", args, kwargs)
        kwargs["format"] = lzma.FORMAT_ALONE # The legacy .lzma container format.
        kwargs["check"] = lzma.CHECK_NONE # No integrity check like CRC or SHA
        kwargs["filters"] = None # custom filter chains
        # print("XXX", args, kwargs)
        super(LZMA_Hack, self).__init__(*args, **kwargs)


class TarLzmaCompressor(TarGzCompressor):
    """
    LZMA was added in Python 3.3 !
    """
    SUFFIX=".tar.xz"
    TAR_MODE="w:xz"

    def __init__(self, level=9, filter_callback=None):
        self.level = level
        self.filter_callback = filter_callback
        self._tar_open_kwargs = {"preset":self.level}

        # FIXME:
        lzma.LZMAFile = LZMA_Hack



class ZipCompressor(object):
    SUFFIX=".zip"
    COMPRESSION=zipfile.ZIP_DEFLATED

    def __init__(self, level=9):
        self.level = level

        # Ugly work-a-round: Currently it's not possible to set
        # the compression level. It will be always used the default
        # and that's -1
        # see also:
        #   http://bugs.python.org/issue21417
        zlib.Z_DEFAULT_COMPRESSION = self.level

    def get_info(self):
        return "%s with level=%i" % (self.SUFFIX, self.level)

    def compress(self, out_dir, archive_name, files_dir, files, verbose=False):
        archive_name = archive_name + self.SUFFIX
        out_filename = os.path.join(out_dir, archive_name)

        total_uncompressed_size = 0
        total_start_time = time.time()
        with zipfile.ZipFile(out_filename, mode="w", compression=self.COMPRESSION) as zip:
            for file_name in files:
                file_path = os.path.join(files_dir, file_name)
                file_size = os.stat(file_path).st_size
                total_uncompressed_size += file_size

                if verbose:
                    sys.stdout.write("Compress %20r %7.1fMB ... " % (
                        file_name, (file_size / 1024.0 / 1024.0)
                    ))
                    sys.stdout.flush()

                start_time = time.time()
                zip.write(file_path, arcname=file_name)
                duration = time.time() - start_time

                if verbose:
                    print("compressed in %.2fsec." % duration)

        total_duration = time.time() - total_start_time
        compressed_size = os.stat(out_filename).st_size
        return archive_name, total_uncompressed_size, compressed_size, total_duration


class LzmaZipCompressor(ZipCompressor):
    SUFFIX=".lzma.zip"
    COMPRESSION=zipfile.ZIP_LZMA

    def __init__(self, level=9):
        self.level = level
        lzma.PRESET_DEFAULT = 9 # FIXME: http://bugs.python.org/issue21417




class ModuleCompressor(object):
    def __init__(self, modules_dir, out_dir, compressor):
        self.modules_dir = modules_dir
        self.download_dir = out_dir
        self.compressor = compressor

        self.index_file = os.path.join(self.modules_dir, "index.json")
        self.meta_file = os.path.join(self.modules_dir, "meta.json")
        self.load_index()

        self.reset_stats()

    def reset_stats(self):
        self.total_files = 0
        self.total_archives = 0
        self.total_uncompressed_size = 0
        self.total_compressed_size = 0
        self.total_duration = 0

    def compress(self, max_packages=None):
        # files, seen = self.get_module("UserDict")
        # print(files, seen)
        # return

        print("\ncreated archive files in..:", self.download_dir)
        print("Used compression..........: %s" % self.compressor.get_info())
        print("\n")

        for module_name in sorted(self.modules.keys()):
            self.compress_module(module_name)
            if max_packages is not None and self.total_archives>=max_packages:
                break # only for developing!

    def compress_module(self, module_name, verbose=False):
        """
        create a common .tar.gz archive

        e.g.:
        ...
           2 files    14.6KB ->     4.4KB - ratio:  30.4% - xml.sax.handler.tar.gz
          84 files  1554.2KB ->   393.9KB - ratio:  25.3% - xml.sax.saxutils.tar.gz
          84 files  1554.2KB ->   393.5KB - ratio:  25.3% - xml.sax.xmlreader.tar.gz
           2 files    54.4KB ->    13.2KB - ratio:  24.3% - xmllib.tar.gz
          84 files  1614.6KB ->   408.9KB - ratio:  25.3% - xmlrpclib.tar.gz
          69 files  1353.6KB ->   340.7KB - ratio:  25.2% - zipfile.tar.gz

        Compress 76584 files to 1141 archives in 197sec.
        total uncompressed size..: 1362.4 MB
        total compressed size....: 349.6 MB
        """
        if verbose:
            print("Compress module '%s' with %s to %s" % (
                module_name, self.compressor.get_info(), self.download_dir
            ))

        files, seen = self.get_module(module_name)
        if not files:
            print("Skip:", module_name)
            return

        archive_name, uncompressed_size, compressed_size, duration = self.compressor.compress(
            out_dir=self.download_dir,
            archive_name=module_name,
            files_dir=self.modules_dir,
            files=files
        )
        if uncompressed_size == 0:
            print(" *** ERROR!", archive_name)
        else:
            print("%4i files %7.1fKB -> %7.1fKB - ratio: %5.1f%% - %s" % (
                len(files),
                uncompressed_size / 1024.0, compressed_size / 1024.0,
                (compressed_size / uncompressed_size * 100.0),
                archive_name
            ))

        self.total_uncompressed_size += uncompressed_size
        self.total_compressed_size += compressed_size
        self.total_duration += duration
        self.total_files += len(files)
        self.total_archives += 1

    def print_stats(self):
        print("\nCompress %i files to %i archives in %isec." % (
            self.total_files, self.total_archives, self.total_duration.duration
        ))
        print("total uncompressed size..: %.1f MB" % (
            self.total_uncompressed_size / 1024.0 / 1024.0
        ))
        print("total compressed size....: %.1f MB" % (
            self.total_compressed_size / 1024.0 / 1024.0
        ))

    def _add_parent(self, module_name, files, seen):
        # Include the parent package, if any.
        parent = os.path.split(module_name)[0]
        parent = parent.replace(os.sep, ".")
        if parent:
            if parent not in seen:
                # print("\t add parent:", parent)
                self.get_module(parent, files, seen)

    def _skip_module(self, module_name):
        return bool(
            module_name in self.exclude or module_name in self.preload
        )

    def get_module(self, module_name, files=None, seen=None):
        if files is None:
            files = []

        if seen is None:
            seen = [module_name]
        else:
            if module_name in seen:
                return files, seen
            seen.append(module_name)

        if self._skip_module(module_name): # in exclude/preload
            return files, seen

        try:
            data = self.modules[module_name]
        except KeyError:
            # print("\tSkip:", module_name)
            return files, seen

        # print("\nmodule name:", module_name)

        if "dir" in data:
            dir = data["dir"]
            import_name = "%s.%s" % (data["dir"], "__init__")
            self.get_module(import_name, files, seen)
            # print("\t* append dir:", import_name)
            # Include the parent package
            self._add_parent(dir, files, seen)

        try:
            filename = data["file"]
        except KeyError:
            # print("No file:", data)
            return files, seen

        # print("filename:", filename)
        if filename and not self._skip_module(module_name): # in exclude/preload:
            # print("\t * append", filename)
            files.append(filename)
            if os.sep in filename:
                # Include the parent package
                self._add_parent(filename, files, seen)

        imports = data["imports"]
        # print("imports:", imports)
        for import_name in imports:
            # print("\t imports: %r" % import_name)
            if import_name in seen or self._skip_module(module_name): # in exclude/preload:
                continue

            self.get_module(import_name, files, seen)
        return files, seen

    def load_index(self):
        """Load in-memory state from the index file."""
        print("\nread %s" % self.index_file)
        with open(self.index_file) as f:
            index = json.load(f)
        self.modules = index["modules"]
        self.preload = index["preload"]

        print("read %s" % self.meta_file)
        with open(self.meta_file) as f:
            meta = json.load(f)
        self.exclude = meta["exclude"]
        self.missing = meta["missing"]


class VMCompressor(object):
    def __init__(self, files_dir, files, out_dir, compressor):
        self.files_dir = files_dir
        self.files = files
        self.out_dir=out_dir
        self.compressor = compressor

    def compress(self):
        print("\ncreated archive files in..:", self.out_dir)
        print("Used compression..........: %s" % self.compressor.get_info())
        print("\n")

        archive_name, uncompressed_size, compressed_size, duration = self.compressor.compress(
            out_dir=self.out_dir,
            archive_name="pypyjs",
            files_dir=self.files_dir,
            files=self.files,
            verbose=True,
        )
        if uncompressed_size == 0:
            print(" *** ERROR!", archive_name)
        else:
            print("%4i files %7.1fMB -> %7.1fMB - ratio: %5.1f%% - %s" % (
                len(self.files),
                uncompressed_size / 1024.0 / 1024.0, compressed_size / 1024.0 / 1024.0,
                (compressed_size / uncompressed_size * 100.0),
                archive_name
            ))
        return uncompressed_size, compressed_size


if __name__ == "__main__":
    out_dir="download"

    if os.path.isdir(out_dir):
        print("rmtree", out_dir)
        shutil.rmtree(out_dir) # Cleanup
    try:
        os.makedirs(out_dir)
    except FileExistsError:
        pass

    compressors = [
        TarLzmaCompressor(
            # level=1
            level=9
        ),
        # LzmaZipCompressor(level=9), # There is not JS lib to decompress .zip with LZMA :(
        TarGzCompressor(level=9),
        ZipCompressor(level=9),
    ]
    # compressors = [ # XXX: only for developing!
    #     TarLzmaCompressor(level=1),
    #     LzmaZipCompressor(level=1),
    #     TarGzCompressor(level=1),
    #     ZipCompressor(level=1),
    # ]

    for compressor in compressors:
        print("="*79)
        print("\n +++ Compress pypyjs vm init files: +++")
        VMCompressor(
            files_dir="pypyjs-release/lib",
            files=["pypy.vm.js", "pypy.vm.js.mem"],
            out_dir="download",
            compressor=compressor
        ).compress()

        print("\n +++ Compress modules: +++")
        mc = ModuleCompressor(
            modules_dir="pypyjs-release/lib/modules",
            out_dir="download",
            compressor=compressor
        )

        # compress all modules
        # mc.compress(
        #     max_packages=10 # XXX: only for developing!
        # )

        # compress only the needed files for the JS-tests:
        mc.compress_module(module_name = "HTMLParser")
        mc.compress_module(module_name = "MimeWriter")

