import fs from 'fs';
import yauzl from 'yauzl';

export class ZipFile {
  private _ready;
  zipFile: Buffer | string;
  filelist: yauzl.Entry[];

  private constructor(zipFile: Buffer | string) {
    this.zipFile = zipFile;
    this.filelist = [];
    this._ready = false;
  }

  get isReady() {
    return this._ready;
  }

  findEntry(entryName) {
    return this.filelist.find((value) => value.fileName == entryName);
  }

  async findZipEntry(entryPath): Promise<Buffer | null> {
    return ZipFile.findZipEntry(this.zipFile, entryPath);
  }

  static async new(zipFile: Buffer | string) {
    const self = new ZipFile(zipFile);
    self.filelist = await ZipFile.getEntries(self.zipFile);
    self._ready = true;
    return self;
  }

  static isZip(zipFile: Buffer | string) {
    if (!zipFile || !zipFile.length) {
      return false;
    }
    const signature = Buffer.from('PK\x03\x04', 'ascii');
    const len = signature.length;
    try {
      let buff: Buffer;
      if (typeof zipFile === 'string') { // file name
        buff = Buffer.from('\x00'.repeat(4));
        const df = fs.openSync(zipFile, 'r');
        fs.readSync(df, buff, 0, 4, null);
        fs.closeSync(df);
      } else {
        buff = zipFile.subarray(0, 4);
      }
      const res = buff.compare(signature);
      return res == 0;
    } catch (error) {
      console.log(error);
      return false;
    }
  }

  static async getEntries(zipFile: Buffer | string): Promise<yauzl.Entry[]> {
    const filelist = [];
    const action: any = (typeof zipFile === 'string') 
      ? yauzl.open 
      : yauzl.fromBuffer;
    return new Promise((resolve, reject) => {
      action(zipFile, { lazyEntries: true }, (err, zipData) => {
        if (err) return reject(err);
        zipData.on("entry", (entry) => {
          if (/\/$/.test(entry.fileName)) {
              // This is a directory entry
              // You can choose to process or ignore directories
          } else {
              // This is a file entry
              // You can open a read stream to access its content if needed
              // For example, to just list names, you don't need to open the stream
          }
          filelist.push(entry);
          zipData.readEntry(); // Read the next entry
        });

        zipData.on('end', () => {
          // If the entry wasn't found after iterating all entries
          // console.log(`Entry '${entryPath}' not found.`);
          resolve(filelist);
        });

        zipData.readEntry(); // Start reading entries
      });
    });
  }

  static async findZipEntry(zipFile: Buffer | string, entryPath): Promise<Buffer | null> {
    const action: any = (typeof zipFile === 'string') 
      ? yauzl.open 
      : yauzl.fromBuffer;
    return new Promise((resolve, reject) => {
      action(zipFile, { lazyEntries: true }, (err, zipData) => {
        if (err) return reject(err);

        zipData.on("entry", (entry) => {
          if (entry.fileName === entryPath) {
            // console.log(`Entry: ${entryPath} found:`, entry);
            // Now you can open a read stream for this entry
            zipData.openReadStream(entry, (err, readStream) => {
              if (err) return reject(err);
              // Process the readStream (e.g., pipe to a file, read into a buffer)
              const chunks = [];
              readStream.on('data', (chunk) => chunks.push(chunk));
              readStream.on("end", () => {
                zipData.close();
                resolve(Buffer.concat(chunks));
              });
            });
          } else {
            zipData.readEntry(); // Read the next entry
          }
        });

        zipData.on('end', () => {
          // If the entry wasn't found after iterating all entries
          // console.log(`Entry '${entryPath}' not found.`);
          resolve(null);
        });

        zipData.readEntry(); // Start reading entries
      });
    });
  }
}