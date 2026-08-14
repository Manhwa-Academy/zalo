import fs from 'fs'

export async function imageMetadataGetter(filePath: string) {
  try {
    const stats = await fs.promises.stat(filePath)
    const buffer = await fs.promises.readFile(filePath)

    let width = 800
    let height = 600

    if (buffer.length > 24) {
      // PNG: 0x89 PNG
      if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
        width = buffer.readUInt32BE(16)
        height = buffer.readUInt32BE(20)
      }
      // JPEG: 0xFF 0xD8
      else if (buffer[0] === 0xff && buffer[1] === 0xd8) {
        let offset = 2
        while (offset < buffer.length - 8) {
          const marker = buffer.readUInt16BE(offset)
          if (marker >= 0xffc0 && marker <= 0xffc3) {
            height = buffer.readUInt16BE(offset + 5)
            width = buffer.readUInt16BE(offset + 7)
            break
          }
          offset += 2
          if (offset + 2 <= buffer.length) {
            const blockLength = buffer.readUInt16BE(offset)
            if (blockLength < 2) break
            offset += blockLength
          } else {
            break
          }
        }
      }
      // GIF: GIF87a or GIF89a
      else if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
        width = buffer.readUInt16LE(6)
        height = buffer.readUInt16LE(8)
      }
      // WEBP: RIFF ... WEBP
      else if (buffer.subarray(0, 4).toString() === 'RIFF' && buffer.subarray(8, 12).toString() === 'WEBP') {
        const type = buffer.subarray(12, 16).toString()
        if (type === 'VP8 ') {
          width = buffer.readUInt16LE(26) & 0x3fff
          height = buffer.readUInt16LE(28) & 0x3fff
        } else if (type === 'VP8L') {
          const b1 = buffer[21]
          const b2 = buffer[22]
          const b3 = buffer[23]
          const b4 = buffer[24]
          width = 1 + (((b2 & 0x3f) << 8) | b1)
          height = 1 + (((b4 & 0xf) << 10) | (b3 << 2) | ((b2 & 0xc0) >> 6))
        }
      }
    }

    return {
      width: width || 800,
      height: height || 600,
      size: stats.size || buffer.length,
    }
  } catch (e) {
    return { width: 800, height: 600, size: 100000 }
  }
}
